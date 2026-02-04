import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { config } from 'dotenv';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
config();

// SQLite Repository imports
import * as brandRepository from './src/db/repositories/brandRepository';
import * as queryRepository from './src/db/repositories/queryRepository';
import * as resultRepository from './src/db/repositories/resultRepository';
import * as reportRepository from './src/db/repositories/reportRepository';
import * as insightRepository from './src/db/repositories/insightRepository';

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      // GEO Score API 프록시 (별도 백엔드 서버로 전달)
      '/api/geo-score': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // PDF 리포트 API 프록시 (별도 백엔드 서버로 전달)
      '/api/reports/pdf': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // GEO Score PDF 리포트 API 프록시
      '/api/reports/geo-score': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // AI 인사이트 PDF 리포트 API 프록시
      '/api/reports/insights': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // 스케줄러 API 프록시
      '/api/scheduler': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    {
      name: 'api-server',
      configureServer(server) {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Utility to parse request body
        const parseBody = (req: any): Promise<any> => {
          return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk: Buffer) => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch {
                reject(new Error('Invalid JSON'));
              }
            });
            req.on('error', reject);
          });
        };

        // === 브랜드 API ===

        // GET/POST /api/brands
        server.middlewares.use('/api/brands', async (req, res, next) => {
          if (req.method === 'GET') {
            const data = brandRepository.getBrandsData();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return;
          }

          if (req.method === 'POST') {
            try {
              const body = await parseBody(req);
              const newBrand = brandRepository.createBrand({
                name: body.name,
                competitors: body.competitors || [],
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(newBrand));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to add brand' }));
            }
            return;
          }

          next();
        });

        // PUT/DELETE /api/brands/:id
        server.middlewares.use('/api/brands/', async (req, res, next) => {
          const id = req.url?.replace('/', '') || '';

          if (req.method === 'PUT' && id) {
            try {
              const body = await parseBody(req);
              brandRepository.updateBrand(id, {
                name: body.name,
                competitors: body.competitors,
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to update brand' }));
            }
            return;
          }

          if (req.method === 'DELETE' && id) {
            brandRepository.deleteBrand(id);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
            return;
          }

          next();
        });

        // === 쿼리 API ===

        server.middlewares.use('/api/queries', async (req, res, next) => {
          if (req.method === 'GET') {
            const data = queryRepository.getQueriesData();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return;
          }

          if (req.method === 'POST') {
            try {
              const body = await parseBody(req);
              const newQuery = queryRepository.createQuery({
                query: body.query,
                category: body.category || '기타',
                frequency: body.frequency || 'daily',
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(newQuery));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to add query' }));
            }
            return;
          }

          next();
        });

        server.middlewares.use('/api/queries/', async (req, res, next) => {
          const url = req.url || '';

          // PUT /api/queries/:id/brands - 브랜드 연결
          if (req.method === 'PUT' && url.includes('/brands')) {
            try {
              const id = url.split('/')[1];
              const body = await parseBody(req);
              queryRepository.updateQueryBrands(id, body.brandIds || []);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to update query brands' }));
            }
            return;
          }

          // DELETE /api/queries/:id
          if (req.method === 'DELETE' && url) {
            const id = url.replace('/', '');
            queryRepository.deleteQuery(id);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
            return;
          }
          next();
        });

        // === 결과 API ===

        // 개별 결과 조회 API (반드시 목록 API보다 먼저 등록)
        server.middlewares.use('/api/results/', async (req, res, next) => {
          const id = req.url?.replace('/', '').split('?')[0] || '';

          if (req.method === 'GET' && id) {
            const result = resultRepository.getResultById(id);
            if (!result) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Result not found' }));
              return;
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
            return;
          }
          next();
        });

        server.middlewares.use('/api/results', async (req, res, next) => {
          if (req.method === 'GET') {
            // 페이지네이션 파라미터 파싱
            const urlObj = new URL(req.url || '', 'http://localhost');
            const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
            const limit = parseInt(urlObj.searchParams.get('limit') || '20', 10);

            // page가 0이면 전체 조회 (기존 호환성)
            if (page === 0) {
              const data = resultRepository.getResultsData();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return;
            }

            // 페이지네이션 적용
            const data = resultRepository.getResultsPaginated(page, limit);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return;
          }
          next();
        });

        // === 테스트 API (핵심 로직 개선) ===

        server.middlewares.use('/api/test-query', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          try {
            const body = await parseBody(req);
            const { query, queryId, category = '기타', engine = 'gpt' } = body;

            if (!query) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Query is required' }));
              return;
            }

            // 등록된 브랜드 가져오기
            const brands = brandRepository.getAllBrands();

            if (brands.length === 0) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: '먼저 브랜드를 등록해주세요' }));
              return;
            }

            let response = '';

            if (engine === 'gemini') {
              // Gemini API 호출
              const result = await geminiModel.generateContent(query);
              response = result.response.text() || '';
            } else {
              // ChatGPT API 호출 (기본값)
              const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                  {
                    role: 'user',
                    content: query,
                  },
                ],
                max_tokens: 1000,
              });
              response = completion.choices[0]?.message?.content || '';
            }
            const responseLower = response.toLowerCase();

            // 각 브랜드별 인용 체크
            const brandResults: resultRepository.BrandResult[] = [];

            for (const brand of brands) {
              // 브랜드 인용은 오직 브랜드명만으로 판단
              const cited = responseLower.includes(brand.name.toLowerCase());
              let rank: number | null = null;

              // 인용된 경우 순위 찾기
              if (cited) {
                const lines = response.split('\n');
                for (let i = 0; i < lines.length; i++) {
                  if (lines[i].toLowerCase().includes(brand.name.toLowerCase())) {
                    const match = lines[i].match(/^[\s]*(\d+)[.)\]]/);
                    if (match) {
                      rank = parseInt(match[1]);
                    }
                    break;
                  }
                }
              }

              // 경쟁사 언급 체크 (별도 추적)
              const competitorMentions: string[] = [];
              for (const competitor of brand.competitors || []) {
                if (responseLower.includes(competitor.toLowerCase())) {
                  competitorMentions.push(competitor);
                }
              }

              brandResults.push({
                brandId: brand.id,
                brandName: brand.name,
                cited,
                rank,
                competitorMentions,
              });
            }

            // 하나라도 인용되었는지 체크
            const anyCited = brandResults.some(br => br.cited);

            const result = resultRepository.createResult({
              queryId: queryId || null,
              query,
              category,
              engine: engine as 'gpt' | 'gemini',
              cited: anyCited,
              brandResults,
              response: response.slice(0, 500),
              fullResponse: response,
            });

            // 오래된 결과 정리
            resultRepository.cleanupOldResults(500);

            // 쿼리의 lastTested 업데이트
            if (queryId) {
              queryRepository.updateQueryLastTested(queryId, result.testedAt);
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (error) {
            console.error('API Error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({
              error: error instanceof Error ? error.message : 'Internal server error'
            }));
          }
        });

        // === 통계 API ===

        server.middlewares.use('/api/stats', async (req, res, next) => {
          if (req.method !== 'GET') {
            next();
            return;
          }

          const results = resultRepository.getAllResults();
          const brands = brandRepository.getAllBrands();

          if (results.length === 0) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              totalTests: 0,
              citationRate: 0,
              avgRank: null,
              brandStats: [],
              recentResults: [],
            }));
            return;
          }

          // 전체 통계
          const cited = results.filter((r) => r.cited);
          const citationRate = Math.round((cited.length / results.length) * 1000) / 10;

          // 브랜드별 통계
          const brandStats = brands.map((brand) => {
            let citedCount = 0;
            let totalRank = 0;
            let rankCount = 0;

            results.forEach((result) => {
              const brandResult = result.brandResults?.find((br) => br.brandId === brand.id);
              if (brandResult?.cited) {
                citedCount++;
                if (brandResult.rank) {
                  totalRank += brandResult.rank;
                  rankCount++;
                }
              }
            });

            return {
              brandId: brand.id,
              brandName: brand.name,
              citedCount,
              totalTests: results.length,
              citationRate: results.length > 0 ? Math.round((citedCount / results.length) * 1000) / 10 : 0,
              avgRank: rankCount > 0 ? Math.round((totalRank / rankCount) * 10) / 10 : null,
            };
          });

          // 엔진별 통계
          const engineStats: Record<string, { total: number; cited: number }> = {};
          results.forEach((r) => {
            const eng = r.engine || 'gpt';
            if (!engineStats[eng]) engineStats[eng] = { total: 0, cited: 0 };
            engineStats[eng].total++;
            if (r.cited) engineStats[eng].cited++;
          });

          const engineStatsArray = Object.entries(engineStats).map(([engine, stats]) => ({
            engine,
            totalTests: stats.total,
            citedCount: stats.cited,
            citationRate: stats.total > 0 ? Math.round((stats.cited / stats.total) * 1000) / 10 : 0,
          }));

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            totalTests: results.length,
            citationRate,
            citedCount: cited.length,
            brandStats,
            engineStats: engineStatsArray,
            recentResults: results.slice(0, 10),
          }));
        });

        // === 리포트 API ===

        server.middlewares.use('/api/reports', async (req, res, next) => {
          // PDF 관련 요청은 백엔드 서버로 프록시 (통과)
          if (req.url?.startsWith('/pdf') || req.url?.startsWith('/geo-score') || req.url?.startsWith('/insights')) {
            next();
            return;
          }

          if (req.method === 'GET') {
            const data = reportRepository.getReportsData();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return;
          }

          if (req.method === 'POST') {
            try {
              const body = await parseBody(req);
              const { type = 'weekly' } = body; // 'weekly' or 'monthly'

              const results = resultRepository.getAllResults();
              const brands = brandRepository.getAllBrands();

              if (results.length < 5) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: '리포트 생성을 위해 최소 5개의 테스트 결과가 필요합니다' }));
                return;
              }

              // 기간 계산
              const now = new Date();
              const periodDays = type === 'weekly' ? 7 : 30;
              const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

              // 해당 기간 내 결과 필터링
              const periodResults = results.filter((r) =>
                new Date(r.testedAt) >= startDate
              );

              // 이전 기간 결과 (비교용)
              const prevStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
              const prevResults = results.filter((r) => {
                const date = new Date(r.testedAt);
                return date >= prevStartDate && date < startDate;
              });

              // 현재 기간 통계
              const citedCount = periodResults.filter((r) => r.cited).length;
              const citationRate = periodResults.length > 0
                ? Math.round((citedCount / periodResults.length) * 1000) / 10
                : 0;

              // 이전 기간 통계
              const prevCitedCount = prevResults.filter((r) => r.cited).length;
              const prevCitationRate = prevResults.length > 0
                ? Math.round((prevCitedCount / prevResults.length) * 1000) / 10
                : 0;

              // 브랜드별 성과
              const brandPerformance = brands.map((brand) => {
                let brandCited = 0;
                let totalRank = 0;
                let rankCount = 0;

                periodResults.forEach((result) => {
                  const br = result.brandResults?.find((b) => b.brandId === brand.id);
                  if (br?.cited) {
                    brandCited++;
                    if (br.rank) {
                      totalRank += br.rank;
                      rankCount++;
                    }
                  }
                });

                return {
                  brandId: brand.id,
                  brandName: brand.name,
                  citationRate: periodResults.length > 0
                    ? Math.round((brandCited / periodResults.length) * 1000) / 10
                    : 0,
                  avgRank: rankCount > 0 ? Math.round((totalRank / rankCount) * 10) / 10 : null,
                  totalTests: periodResults.length,
                  citations: brandCited,
                };
              });

              // 쿼리별 성과 (상위/하위)
              const queryPerformance: Record<string, { query: string; cited: number; total: number }> = {};
              periodResults.forEach((r) => {
                if (!queryPerformance[r.query]) {
                  queryPerformance[r.query] = { query: r.query, cited: 0, total: 0 };
                }
                queryPerformance[r.query].total++;
                if (r.cited) queryPerformance[r.query].cited++;
              });

              const queryList = Object.values(queryPerformance).map((q) => ({
                query: q.query,
                citationRate: Math.round((q.cited / q.total) * 100),
              }));
              queryList.sort((a, b) => b.citationRate - a.citationRate);

              // 엔진별 성과 계산
              const engineStats: Record<string, { total: number; cited: number }> = {};
              const prevEngineStats: Record<string, { total: number; cited: number }> = {};

              periodResults.forEach((r) => {
                const eng = r.engine || 'gpt';
                if (!engineStats[eng]) engineStats[eng] = { total: 0, cited: 0 };
                engineStats[eng].total++;
                if (r.cited) engineStats[eng].cited++;
              });

              prevResults.forEach((r) => {
                const eng = r.engine || 'gpt';
                if (!prevEngineStats[eng]) prevEngineStats[eng] = { total: 0, cited: 0 };
                prevEngineStats[eng].total++;
                if (r.cited) prevEngineStats[eng].cited++;
              });

              const enginePerformance = Object.entries(engineStats).map(([engine, stats]) => {
                const engCitationRate = stats.total > 0
                  ? Math.round((stats.cited / stats.total) * 1000) / 10
                  : 0;
                const prevStats = prevEngineStats[engine] || { total: 0, cited: 0 };
                const prevEngCitationRate = prevStats.total > 0
                  ? Math.round((prevStats.cited / prevStats.total) * 1000) / 10
                  : 0;

                return {
                  engine,
                  citationRate: engCitationRate,
                  avgRank: null,
                  totalTests: stats.total,
                  citations: stats.cited,
                  change: Math.round((engCitationRate - prevEngCitationRate) * 10) / 10,
                };
              });

              // 리포트 생성
              const periodLabel = type === 'weekly' ? '주간' : '월간';
              const periodStr = `${startDate.toLocaleDateString('ko-KR')} ~ ${now.toLocaleDateString('ko-KR')}`;

              const report = reportRepository.createReport({
                title: `${periodLabel} AI 가시성 리포트`,
                type: type as 'weekly' | 'monthly',
                period: periodStr,
                startDate: startDate.toISOString(),
                endDate: now.toISOString(),
                metrics: {
                  citationRate,
                  citationRateChange: Math.round((citationRate - prevCitationRate) * 10) / 10,
                  shareOfVoice: citationRate,
                  shareOfVoiceChange: Math.round((citationRate - prevCitationRate) * 10) / 10,
                  avgRank: null,
                  avgRankChange: 0,
                  totalTests: periodResults.length,
                  totalTestsChange: periodResults.length - prevResults.length,
                  enginePerformance,
                  brandPerformance,
                },
                highlights: [
                  `총 ${periodResults.length}회 테스트 수행`,
                  `전체 인용률 ${citationRate}%${prevCitationRate > 0 ? ` (이전 대비 ${citationRate >= prevCitationRate ? '+' : ''}${Math.round((citationRate - prevCitationRate) * 10) / 10}%p)` : ''}`,
                  `${citedCount}회 인용 성공`,
                ],
                topQueries: queryList.slice(0, 3),
                worstQueries: queryList.slice(-3).reverse(),
              });

              // 오래된 리포트 정리
              reportRepository.cleanupOldReports(50);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(report));
            } catch (error) {
              console.error('Report generation error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({
                error: error instanceof Error ? error.message : 'Failed to generate report'
              }));
            }
            return;
          }

          // DELETE /api/reports?id=xxx - 리포트 삭제
          if (req.method === 'DELETE') {
            try {
              const urlObj = new URL(req.url || '', 'http://localhost');
              const id = urlObj.searchParams.get('id');

              if (!id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'ID가 필요합니다' }));
                return;
              }

              reportRepository.deleteReport(id);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to delete report' }));
            }
            return;
          }

          next();
        });

        // === AI 인사이트 API ===

        // GET /api/insights - 저장된 인사이트 목록 조회
        server.middlewares.use('/api/insights', async (req, res, next) => {
          if (req.method === 'GET') {
            try {
              const data = insightRepository.getInsightsData();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to fetch insights' }));
            }
            return;
          }

          if (req.method === 'POST') {
            try {
              const body = await parseBody(req);
              const { brandId } = body;

              if (!brandId) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: '브랜드를 선택해주세요' }));
                return;
              }

              // 브랜드 정보 가져오기
              const brand = brandRepository.getBrandById(brandId);

              if (!brand) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: '선택한 브랜드를 찾을 수 없습니다' }));
                return;
              }

              // 선택한 브랜드가 포함된 결과 필터링
              const brandResults = resultRepository.getResultsByBrandId(brandId, 100);

              if (brandResults.length < 3) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: `'${brand.name}' 브랜드의 테스트 결과가 3개 이상 필요합니다 (현재 ${brandResults.length}개)` }));
                return;
              }

              // 최근 50개 응답 분석
              const recentResults = brandResults.slice(0, 50);
              const responses = recentResults
                .filter((r) => r.fullResponse)
                .map((r) => {
                  const brandResult = r.brandResults?.find((br) => br.brandId === brandId);
                  return {
                    query: r.query,
                    category: r.category,
                    response: r.fullResponse.slice(0, 2000), // 토큰 제한
                    cited: brandResult?.cited || false,
                  };
                });

              if (responses.length === 0) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: '분석할 응답 데이터가 없습니다' }));
                return;
              }

              // LLM에게 분석 요청
              const analysisPrompt = `당신은 AI 마케팅 전문가입니다.

분석 대상 브랜드: "${brand.name}"
${brand.competitors?.length > 0 ? `경쟁사: ${brand.competitors.join(', ')}` : ''}

아래는 "${brand.name}" 브랜드 관련 쿼리에 대한 AI(ChatGPT, Gemini 등)의 응답들입니다.
각 응답의 cited 필드는 해당 응답에서 "${brand.name}"이 언급되었는지를 나타냅니다.

이 응답들을 분석하여 "${brand.name}" 브랜드의 AI 가시성을 높이기 위한 인사이트를 JSON 형식으로 추출해주세요:

1. **commonKeywords**: AI가 이 분야에서 추천/답변할 때 공통적으로 자주 언급하는 핵심 키워드 또는 속성 (최대 15개)
   - 각 키워드에 대해: keyword, count(등장 빈도 추정), importance(high/medium/low), description("${brand.name}"이 왜 이 키워드를 활용해야 하는지)

2. **categoryInsights**: 쿼리 카테고리별 AI가 중요시하는 요소
   - 각 카테고리에 대해: category, keyFactors(중요 요소 3-5개), recommendation("${brand.name}"을 위한 마케팅 제안)

3. **citationPatterns**: "${brand.name}"이 인용될 때 vs 안 될 때의 패턴 차이
   - citedPatterns: 인용된 응답들의 공통 특징 (문자열 배열)
   - uncitedPatterns: 인용되지 않은 응답들의 공통 특징 (문자열 배열)

4. **actionableInsights**: "${brand.name}"이 실행할 수 있는 인사이트 (최대 5개)
   - 각 인사이트에 대해: title, description, priority(high/medium/low), actionItems(구체적 행동 2-3개, 문자열 배열)

5. **contentGaps**: "${brand.name}"이 보강해야 할 콘텐츠 영역 (최대 5개)
   - 각 갭에 대해: area, currentState, recommendation

분석할 응답 데이터:
${JSON.stringify(responses.slice(0, 20), null, 2)}

반드시 유효한 JSON 형식으로만 응답하세요. 마크다운이나 추가 설명 없이 JSON만 출력하세요.`;

              let analysisResult;

              try {
                // GPT로 분석
                const completion = await openai.chat.completions.create({
                  model: 'gpt-4o-mini',
                  messages: [
                    {
                      role: 'system',
                      content: 'You are an AI marketing analyst. Always respond with valid JSON only, no markdown.',
                    },
                    {
                      role: 'user',
                      content: analysisPrompt,
                    },
                  ],
                  max_tokens: 3000,
                  temperature: 0.3,
                });

                const content = completion.choices[0]?.message?.content || '{}';
                // JSON 파싱 (마크다운 코드블록 제거)
                const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                analysisResult = JSON.parse(jsonContent);
              } catch (llmError) {
                console.error('LLM analysis error:', llmError);
                // 폴백: 기본 분석 결과
                analysisResult = {
                  commonKeywords: [],
                  categoryInsights: [],
                  citationPatterns: { citedPatterns: [], uncitedPatterns: [] },
                  actionableInsights: [],
                  contentGaps: [],
                  error: 'LLM 분석 중 오류가 발생했습니다. 기본 분석 결과를 표시합니다.',
                };
              }

              // 인사이트 저장
              const result = insightRepository.createInsight({
                brandId,
                brandName: brand.name,
                commonKeywords: analysisResult.commonKeywords || [],
                categoryInsights: analysisResult.categoryInsights || [],
                citationPatterns: analysisResult.citationPatterns || { citedPatterns: [], uncitedPatterns: [] },
                actionableInsights: analysisResult.actionableInsights || [],
                contentGaps: analysisResult.contentGaps || [],
                metadata: {
                  analyzedAt: new Date().toISOString(),
                  totalResponses: responses.length,
                  citedResponses: responses.filter((r) => r.cited).length,
                  categories: [...new Set(responses.map((r) => r.category))],
                },
              });

              // 오래된 인사이트 정리
              insightRepository.cleanupOldInsights(50);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (error) {
              console.error('Insights API error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({
                error: error instanceof Error ? error.message : 'Failed to analyze'
              }));
            }
            return;
          }

          // DELETE /api/insights?id=xxx - 인사이트 삭제
          if (req.method === 'DELETE') {
            try {
              const urlObj = new URL(req.url || '', 'http://localhost');
              const id = urlObj.searchParams.get('id');

              if (!id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'ID가 필요합니다' }));
                return;
              }

              insightRepository.deleteInsight(id);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to delete insight' }));
            }
            return;
          }

          next();
        });
      },
    },
  ],
});
