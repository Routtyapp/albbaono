import { Router, Request, Response } from 'express';
import { crawlSite, validateUrl } from '../services/crawler.js';
import { analyzePages } from '../services/analyzer/index.js';
import { calculateGrade } from '../utils/scoring.js';
import { generateRecommendations } from '../utils/recommendations.js';
import type { GeoScoreRequest, GeoScoreResult } from '../types/geoScore.js';

const router = Router();

/**
 * POST /api/geo-score/analyze
 * 사이트 GEO 점수 분석
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { url, options } = req.body as GeoScoreRequest;

    // URL 유효성 검사
    if (!url) {
      res.status(400).json({ error: 'URL이 필요합니다.' });
      return;
    }

    const validation = validateUrl(url);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    // 크롤링 옵션
    const crawlOptions = {
      includeSubpages: options?.includeSubpages ?? false,
      maxSubpages: Math.min(options?.maxSubpages ?? 10, 50), // 최대 50페이지 제한
    };

    console.log(`[GEO Score] 분석 시작: ${url}`);
    console.log(`[GEO Score] 옵션:`, crawlOptions);

    // 1. 크롤링
    const crawlResult = await crawlSite(url, crawlOptions);

    if (crawlResult.pages.length === 0) {
      res.status(400).json({
        error: '페이지를 크롤링할 수 없습니다.',
        details: crawlResult.errors,
      });
      return;
    }

    console.log(`[GEO Score] 크롤링 완료: ${crawlResult.pages.length}개 페이지`);

    // 2. 분석
    const analysisResult = analyzePages(crawlResult.pages);

    // 3. 등급 계산
    const grade = calculateGrade(analysisResult.totalScore);

    // 4. 권장사항 생성
    const recommendations = generateRecommendations(analysisResult.categories);

    // 5. 결과 조합
    const result: GeoScoreResult = {
      url,
      analyzedAt: new Date().toISOString(),
      totalScore: analysisResult.totalScore,
      grade,
      categories: analysisResult.categories,
      pages: analysisResult.pages,
      recommendations,
    };

    console.log(`[GEO Score] 분석 완료: ${result.totalScore}점 (${grade})`);

    res.json(result);
  } catch (err) {
    console.error('[GEO Score] 분석 오류:', err);
    res.status(500).json({
      error: '분석 중 오류가 발생했습니다.',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/geo-score/health
 * 헬스 체크
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
