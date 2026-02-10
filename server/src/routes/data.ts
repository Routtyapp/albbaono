import { Response, Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../config/db.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();

type ApiErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'FORBIDDEN' | 'UNAUTHORIZED' | 'INTERNAL_ERROR';

function sendError(
  res: Response,
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown
) {
  return res.status(status).json({
    success: false,
    code,
    message,
    details,
  });
}

// Responses API web_search 인용 마커 제거 (브랜드 매칭용 클린 텍스트)
function stripCitations(text: string): string {
  return text
    .replace(/\u3010\d+†[^\u3011]*\u3011/g, '')   // 【4†source】
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')       // [text](url) → text
    .replace(/\[\d+\]/g, '')                        // [1] 참조 번호
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// 모든 라우트에 인증 필요
router.use(isAuthenticated);

// === 온보딩 API ===

router.patch('/onboarding', (req, res) => {
  const userId = req.user!.id;
  const { step } = req.body;

  if (typeof step !== 'number' || step < 0 || step > 3) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'step must be a number between 0 and 3');
  }

  db.prepare('UPDATE users SET onboarding_step = ? WHERE id = ?').run(step, userId);
  res.json({ success: true, onboardingStep: step });
});

// === 브랜드 API ===

router.get('/brands', (req, res) => {
  const userId = req.user!.id;
  const brands = db.prepare(`
    SELECT id, name, competitors, is_active, created_at
    FROM brands WHERE user_id = ? AND is_active = 1
    ORDER BY created_at DESC
  `).all(userId);

  // JSON 파싱
  const parsed = brands.map((b: any) => ({
    ...b,
    competitors: JSON.parse(b.competitors || '[]'),
    isActive: !!b.is_active,
    createdAt: b.created_at,
  }));

  res.json({ brands: parsed });
});

router.post('/brands', (req, res) => {
  const userId = req.user!.id;
  const { name, competitors = [] } = req.body;

  if (!name) {
    return res.status(400).json({ error: '브랜드 이름은 필수입니다.' });
  }

  const id = randomUUID();
  db.prepare(`
    INSERT INTO brands (id, user_id, name, competitors)
    VALUES (?, ?, ?, ?)
  `).run(id, userId, name, JSON.stringify(competitors));

  res.status(201).json({
    id,
    name,
    competitors,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
});

router.put('/brands/:id', (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { name, competitors } = req.body;

  if (!name) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Brand name is required');
  }

  const result = db.prepare(`
    UPDATE brands SET name = ?, competitors = ?
    WHERE id = ? AND user_id = ?
  `).run(name, JSON.stringify(competitors || []), id, userId);

  if (result.changes === 0) {
    return sendError(res, 404, 'NOT_FOUND', 'Brand not found');
  }

  res.json({ success: true });
});

router.delete('/brands/:id', (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const result = db.prepare('DELETE FROM brands WHERE id = ? AND user_id = ?').run(id, userId);
  if (result.changes === 0) {
    return sendError(res, 404, 'NOT_FOUND', 'Brand not found');
  }
  res.json({ success: true });
});

// === 쿼리 API ===

router.get('/queries', (req, res) => {
  const userId = req.user!.id;
  const queries = db.prepare(`
    SELECT q.id, q.query, q.category, q.frequency, q.is_active, q.created_at, q.last_tested,
           GROUP_CONCAT(qb.brand_id) as brand_ids
    FROM queries q
    LEFT JOIN query_brands qb ON q.id = qb.query_id
    WHERE q.user_id = ?
    GROUP BY q.id
    ORDER BY q.created_at DESC
  `).all(userId);

  const parsed = queries.map((q: any) => ({
    id: q.id,
    query: q.query,
    category: q.category,
    frequency: q.frequency,
    isActive: !!q.is_active,
    createdAt: q.created_at,
    lastTested: q.last_tested,
    brandIds: q.brand_ids ? q.brand_ids.split(',') : [],
  }));

  res.json({ queries: parsed });
});

router.post('/queries', (req, res) => {
  const userId = req.user!.id;
  const { query, category, frequency = 'daily' } = req.body;

  if (!query || !category) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Query and category are required');
  }

  const id = randomUUID();
  db.prepare(`
    INSERT INTO queries (id, user_id, query, category, frequency)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, query, category, frequency);

  res.status(201).json({
    id,
    query,
    category,
    frequency,
    isActive: true,
    createdAt: new Date().toISOString(),
    brandIds: [],
  });
});

router.put('/queries/:id/brands', (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { brandIds = [] } = req.body;

  const query = db.prepare(
    'SELECT id FROM queries WHERE id = ? AND user_id = ?'
  ).get(id, userId) as { id: string } | undefined;
  if (!query) {
    return sendError(res, 404, 'NOT_FOUND', 'Query not found');
  }

  if (!Array.isArray(brandIds) || brandIds.some((brandId) => typeof brandId !== 'string')) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'brandIds must be an array of strings');
  }

  if (brandIds.length > 0) {
    const placeholders = brandIds.map(() => '?').join(', ');
    const ownedCount = db.prepare(
      `SELECT COUNT(*) as count FROM brands WHERE user_id = ? AND id IN (${placeholders})`
    ).get(userId, ...brandIds) as { count: number };

    if (ownedCount.count !== brandIds.length) {
      return sendError(res, 403, 'FORBIDDEN', 'Some brands are not accessible');
    }
  }

  // 기존 연결 삭제

  // 새 연결 추가
  const updateLinks = db.transaction(() => {
    db.prepare('DELETE FROM query_brands WHERE query_id = ?').run(id);
    const insert = db.prepare('INSERT INTO query_brands (query_id, brand_id) VALUES (?, ?)');
    for (const brandId of brandIds) {
      insert.run(id, brandId);
    }
  });
  updateLinks();

  res.json({ success: true });
});

router.patch('/queries/:id/active', (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { isActive } = req.body as { isActive?: boolean };

  if (typeof isActive !== 'boolean') {
    return sendError(res, 400, 'VALIDATION_ERROR', 'isActive must be a boolean');
  }

  const result = db.prepare(
    'UPDATE queries SET is_active = ? WHERE id = ? AND user_id = ?'
  ).run(isActive ? 1 : 0, id, userId);

  if (result.changes === 0) {
    return sendError(res, 404, 'NOT_FOUND', 'Query not found');
  }

  res.json({ success: true, id, isActive });
});

router.patch('/queries/:id/frequency', (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { frequency } = req.body as { frequency?: string };

  if (!frequency || !['daily', 'weekly', 'monthly'].includes(frequency)) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'frequency must be daily, weekly, or monthly');
  }

  const result = db.prepare(
    'UPDATE queries SET frequency = ? WHERE id = ? AND user_id = ?'
  ).run(frequency, id, userId);

  if (result.changes === 0) {
    return sendError(res, 404, 'NOT_FOUND', 'Query not found');
  }

  res.json({ success: true, id, frequency });
});

router.delete('/queries/:id', (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const result = db.prepare('DELETE FROM queries WHERE id = ? AND user_id = ?').run(id, userId);
  if (result.changes === 0) {
    return sendError(res, 404, 'NOT_FOUND', 'Query not found');
  }
  res.json({ success: true });
});

// === 통계 API ===

router.get('/stats', (req, res) => {
  const userId = req.user!.id;

  const totalTests = db.prepare(
    'SELECT COUNT(*) as count FROM results WHERE user_id = ?'
  ).get(userId) as { count: number };

  const citedCount = db.prepare(
    'SELECT COUNT(*) as count FROM results WHERE user_id = ? AND cited = 1'
  ).get(userId) as { count: number };

  const brandsCount = db.prepare(
    'SELECT COUNT(*) as count FROM brands WHERE user_id = ? AND is_active = 1'
  ).get(userId) as { count: number };

  const citationRate = totalTests.count > 0
    ? Math.round((citedCount.count / totalTests.count) * 100)
    : 0;

  // 브랜드별 통계
  const brands = db.prepare(
    'SELECT id, name FROM brands WHERE user_id = ? AND is_active = 1'
  ).all(userId) as { id: string; name: string }[];

  const brandStats = brands.map((brand) => {
    const brandTotal = db.prepare(
      'SELECT COUNT(*) as count FROM brand_results br JOIN results r ON br.result_id = r.id WHERE r.user_id = ? AND br.brand_id = ?'
    ).get(userId, brand.id) as { count: number };

    const brandCited = db.prepare(
      'SELECT COUNT(*) as count FROM brand_results br JOIN results r ON br.result_id = r.id WHERE r.user_id = ? AND br.brand_id = ? AND br.cited = 1'
    ).get(userId, brand.id) as { count: number };

    const avgRankRow = db.prepare(
      'SELECT AVG(br.rank) as avg FROM brand_results br JOIN results r ON br.result_id = r.id WHERE r.user_id = ? AND br.brand_id = ? AND br.cited = 1 AND br.rank IS NOT NULL'
    ).get(userId, brand.id) as { avg: number | null };

    return {
      brandId: brand.id,
      brandName: brand.name,
      citedCount: brandCited.count,
      totalTests: brandTotal.count,
      citationRate: brandTotal.count > 0 ? Math.round((brandCited.count / brandTotal.count) * 1000) / 10 : 0,
      avgRank: avgRankRow.avg ? Math.round(avgRankRow.avg * 10) / 10 : null,
    };
  });

  // 엔진별 통계
  const engineRows = db.prepare(
    'SELECT engine, COUNT(*) as total, SUM(cited) as cited FROM results WHERE user_id = ? GROUP BY engine'
  ).all(userId) as { engine: string; total: number; cited: number }[];

  const engineStats = engineRows.map((e) => ({
    engine: e.engine,
    totalTests: e.total,
    citedCount: e.cited,
    citationRate: e.total > 0 ? Math.round((e.cited / e.total) * 1000) / 10 : 0,
  }));

  // 최근 결과
  const recentRows = db.prepare(
    'SELECT id, query_id, query, category, engine, cited, response, full_response, tested_at FROM results WHERE user_id = ? ORDER BY tested_at DESC LIMIT 10'
  ).all(userId) as any[];

  const getBrandResults = db.prepare(
    'SELECT brand_id, brand_name, cited, rank, competitor_mentions FROM brand_results WHERE result_id = ?'
  );

  const recentResults = recentRows.map((r: any) => {
    const brs = getBrandResults.all(r.id) as any[];
    return {
      id: r.id,
      queryId: r.query_id,
      query: r.query,
      category: r.category,
      engine: r.engine,
      cited: !!r.cited,
      response: r.response,
      fullResponse: r.full_response,
      testedAt: r.tested_at,
      brandResults: brs.map((br: any) => ({
        brandId: br.brand_id,
        brandName: br.brand_name,
        cited: !!br.cited,
        rank: br.rank,
        competitorMentions: JSON.parse(br.competitor_mentions || '[]'),
      })),
    };
  });

  res.json({
    totalTests: totalTests.count,
    citedCount: citedCount.count,
    citationRate,
    registeredBrands: brandsCount.count,
    brandStats,
    engineStats,
    recentResults,
  });
});

// === 트렌드 API ===

router.get('/trends', (req, res) => {
  const userId = req.user!.id;
  const range = (req.query.range as string) || 'month';

  // range에 따라 시작일 계산
  const now = new Date();
  let daysBack: number;
  switch (range) {
    case 'week': daysBack = 7; break;
    case 'quarter': daysBack = 90; break;
    default: daysBack = 30; break;
  }
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysBack);
  const startISO = startDate.toISOString();

  // week: 일별 집계, month/quarter: 주별 집계
  const useDaily = range === 'week';
  const dateExpr = useDaily
    ? `DATE(tested_at)`
    : `strftime('%Y-W%W', tested_at)`;

  // 전체 트렌드
  const overallRows = db.prepare(`
    SELECT ${dateExpr} as date, COUNT(*) as total, SUM(cited) as cited
    FROM results WHERE user_id = ? AND tested_at >= ?
    GROUP BY ${dateExpr} ORDER BY date
  `).all(userId, startISO) as { date: string; total: number; cited: number }[];

  const overall = overallRows.map((r) => ({
    date: r.date,
    totalTests: r.total,
    citedCount: r.cited,
    citationRate: r.total > 0 ? Math.round((r.cited / r.total) * 1000) / 10 : 0,
  }));

  // 엔진별 트렌드
  const engineRows = db.prepare(`
    SELECT engine, ${dateExpr} as date, COUNT(*) as total, SUM(cited) as cited
    FROM results WHERE user_id = ? AND tested_at >= ?
    GROUP BY engine, ${dateExpr} ORDER BY date
  `).all(userId, startISO) as { engine: string; date: string; total: number; cited: number }[];

  const byEngine: Record<string, { date: string; totalTests: number; citedCount: number; citationRate: number }[]> = {};
  for (const r of engineRows) {
    const label = r.engine === 'gpt' ? 'ChatGPT' : r.engine === 'gemini' ? 'Gemini' : r.engine;
    if (!byEngine[label]) byEngine[label] = [];
    byEngine[label].push({
      date: r.date,
      totalTests: r.total,
      citedCount: r.cited,
      citationRate: r.total > 0 ? Math.round((r.cited / r.total) * 1000) / 10 : 0,
    });
  }

  // 카테고리별 트렌드
  const categoryRows = db.prepare(`
    SELECT category, ${dateExpr} as date, COUNT(*) as total, SUM(cited) as cited
    FROM results WHERE user_id = ? AND tested_at >= ?
    GROUP BY category, ${dateExpr} ORDER BY date
  `).all(userId, startISO) as { category: string; date: string; total: number; cited: number }[];

  const byCategory: Record<string, { date: string; totalTests: number; citedCount: number; citationRate: number }[]> = {};
  for (const r of categoryRows) {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push({
      date: r.date,
      totalTests: r.total,
      citedCount: r.cited,
      citationRate: r.total > 0 ? Math.round((r.cited / r.total) * 1000) / 10 : 0,
    });
  }

  res.json({ overall, byEngine, byCategory });
});

// === 결과 API ===

router.get('/results', (req, res) => {
  const userId = req.user!.id;
  const rawPage = parseInt(req.query.page as string);
  const page = isNaN(rawPage) ? 1 : rawPage;
  const limit = parseInt(req.query.limit as string) || 20;

  const getBrandResults = db.prepare(
    'SELECT brand_id, brand_name, cited, rank, competitor_mentions FROM brand_results WHERE result_id = ?'
  );

  const mapResult = (r: any) => {
    const brs = getBrandResults.all(r.id) as any[];
    return {
      id: r.id,
      queryId: r.query_id,
      query: r.query,
      category: r.category,
      engine: r.engine,
      cited: !!r.cited,
      response: r.response,
      fullResponse: r.full_response,
      testedAt: r.tested_at,
      brandResults: brs.map((br: any) => ({
        brandId: br.brand_id,
        brandName: br.brand_name,
        cited: !!br.cited,
        rank: br.rank,
        competitorMentions: JSON.parse(br.competitor_mentions || '[]'),
      })),
    };
  };

  // page=0: 전체 조회 (프론트엔드 호환)
  if (page === 0) {
    const results = db.prepare(`
      SELECT id, query_id, query, category, engine, cited, response, full_response, tested_at
      FROM results WHERE user_id = ?
      ORDER BY tested_at DESC
      LIMIT 500
    `).all(userId);

    const parsed = results.map(mapResult);
    const lastResult = parsed[0];
    res.json({
      results: parsed,
      lastUpdated: lastResult?.testedAt || null,
    });
    return;
  }

  // 일반 페이지네이션
  const offset = (page - 1) * limit;
  const results = db.prepare(`
    SELECT id, query_id, query, category, engine, cited, response, full_response, tested_at
    FROM results WHERE user_id = ?
    ORDER BY tested_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, limit, offset);

  const total = db.prepare(
    'SELECT COUNT(*) as count FROM results WHERE user_id = ?'
  ).get(userId) as { count: number };

  const parsed = results.map(mapResult);

  res.json({
    results: parsed,
    total: total.count,
    page,
    limit,
    hasMore: offset + results.length < total.count,
  });
});

router.get('/results/:id', (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const result = db.prepare(`
    SELECT id, query_id, query, category, engine, cited, response, full_response, tested_at
    FROM results WHERE id = ? AND user_id = ?
  `).get(id, userId) as any;

  if (!result) {
    return res.status(404).json({ error: '결과를 찾을 수 없습니다.' });
  }

  const brs = db.prepare(
    'SELECT brand_id, brand_name, cited, rank, competitor_mentions FROM brand_results WHERE result_id = ?'
  ).all(result.id) as any[];

  res.json({
    id: result.id,
    queryId: result.query_id,
    query: result.query,
    category: result.category,
    engine: result.engine,
    cited: !!result.cited,
    response: result.response,
    fullResponse: result.full_response,
    testedAt: result.tested_at,
    brandResults: brs.map((br: any) => ({
      brandId: br.brand_id,
      brandName: br.brand_name,
      cited: !!br.cited,
      rank: br.rank,
      competitorMentions: JSON.parse(br.competitor_mentions || '[]'),
    })),
  });
});

// === 리포트 API ===

router.get('/reports', (req, res) => {
  const userId = req.user!.id;
  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
  const cursor = req.query.cursor as string | undefined;

  const { total } = db.prepare(`SELECT COUNT(*) as total FROM reports WHERE user_id = ?`).get(userId) as { total: number };

  let reports: any[];
  if (cursor) {
    const cursorRow = db.prepare(`SELECT generated_at FROM reports WHERE id = ? AND user_id = ?`).get(cursor, userId) as { generated_at: string } | undefined;
    if (cursorRow) {
      reports = db.prepare(`
        SELECT id, title, type, period, start_date, end_date, generated_at, metrics, highlights, top_queries, worst_queries, ai_analysis
        FROM reports WHERE user_id = ? AND (generated_at < ? OR (generated_at = ? AND id < ?))
        ORDER BY generated_at DESC, id DESC
        LIMIT ?
      `).all(userId, cursorRow.generated_at, cursorRow.generated_at, cursor, limit);
    } else {
      reports = [];
    }
  } else {
    reports = db.prepare(`
      SELECT id, title, type, period, start_date, end_date, generated_at, metrics, highlights, top_queries, worst_queries, ai_analysis
      FROM reports WHERE user_id = ?
      ORDER BY generated_at DESC, id DESC
      LIMIT ?
    `).all(userId, limit);
  }

  const parsed = reports.map((r: any) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    period: r.period,
    startDate: r.start_date,
    endDate: r.end_date,
    generatedAt: r.generated_at,
    metrics: JSON.parse(r.metrics || '{}'),
    highlights: JSON.parse(r.highlights || '[]'),
    topQueries: JSON.parse(r.top_queries || '[]'),
    worstQueries: JSON.parse(r.worst_queries || '[]'),
    aiAnalysis: r.ai_analysis ? JSON.parse(r.ai_analysis) : null,
  }));

  const nextCursor = parsed.length === limit ? parsed[parsed.length - 1].id : null;

  res.json({ reports: parsed, totalCount: total, nextCursor });
});

router.post('/reports', async (req, res) => {
  const userId = req.user!.id;
  const { type } = req.body;

  const now = new Date();
  const id = randomUUID();
  const days = type === 'weekly' ? 7 : 30;

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);

  const title = `${type === 'weekly' ? '주간' : '월간'} 리포트`;
  const period = `${startDate.toISOString().split('T')[0]} ~ ${now.toISOString().split('T')[0]}`;

  // 현재 기간 결과
  const currentResults = db.prepare(`
    SELECT r.id, r.query_id, r.query, r.engine, r.cited, r.tested_at
    FROM results r
    WHERE r.user_id = ? AND r.tested_at >= ? AND r.tested_at <= ?
  `).all(userId, startDate.toISOString(), now.toISOString()) as any[];

  // 이전 기간 결과 (변화량 계산용)
  const prevResults = db.prepare(`
    SELECT r.id, r.query_id, r.query, r.engine, r.cited, r.tested_at
    FROM results r
    WHERE r.user_id = ? AND r.tested_at >= ? AND r.tested_at < ?
  `).all(userId, prevStartDate.toISOString(), startDate.toISOString()) as any[];

  // 브랜드별 결과
  const currentResultIds = currentResults.map((r: any) => r.id);
  const prevResultIds = prevResults.map((r: any) => r.id);

  let currentBrandResults: any[] = [];
  if (currentResultIds.length > 0) {
    const placeholders = currentResultIds.map(() => '?').join(',');
    currentBrandResults = db.prepare(
      `SELECT * FROM brand_results WHERE result_id IN (${placeholders})`
    ).all(...currentResultIds) as any[];
  }

  let prevBrandResults: any[] = [];
  if (prevResultIds.length > 0) {
    const placeholders = prevResultIds.map(() => '?').join(',');
    prevBrandResults = db.prepare(
      `SELECT * FROM brand_results WHERE result_id IN (${placeholders})`
    ).all(...prevResultIds) as any[];
  }

  // 기본 지표 계산
  const totalTests = currentResults.length;
  const citedCount = currentResults.filter((r: any) => r.cited).length;
  const citationRate = totalTests > 0 ? Math.round((citedCount / totalTests) * 100 * 10) / 10 : 0;

  const prevTotalTests = prevResults.length;
  const prevCitedCount = prevResults.filter((r: any) => r.cited).length;
  const prevCitationRate = prevTotalTests > 0 ? Math.round((prevCitedCount / prevTotalTests) * 100 * 10) / 10 : 0;

  // 점유율 (브랜드 인용 비율)
  const totalBrandChecks = currentBrandResults.length;
  const brandCited = currentBrandResults.filter((br: any) => br.cited).length;
  const shareOfVoice = totalBrandChecks > 0 ? Math.round((brandCited / totalBrandChecks) * 100 * 10) / 10 : 0;

  const prevTotalBrandChecks = prevBrandResults.length;
  const prevBrandCited = prevBrandResults.filter((br: any) => br.cited).length;
  const prevShareOfVoice = prevTotalBrandChecks > 0 ? Math.round((prevBrandCited / prevTotalBrandChecks) * 100 * 10) / 10 : 0;

  // 평균 순위
  const rankedResults = currentBrandResults.filter((br: any) => br.cited && br.rank != null);
  const avgRank = rankedResults.length > 0
    ? Math.round((rankedResults.reduce((sum: number, br: any) => sum + br.rank, 0) / rankedResults.length) * 10) / 10
    : null;

  const prevRankedResults = prevBrandResults.filter((br: any) => br.cited && br.rank != null);
  const prevAvgRank = prevRankedResults.length > 0
    ? Math.round((prevRankedResults.reduce((sum: number, br: any) => sum + br.rank, 0) / prevRankedResults.length) * 10) / 10
    : null;

  // 엔진별 성능
  const engines = [...new Set(currentResults.map((r: any) => r.engine))];
  const enginePerformance = engines.map((engine: string) => {
    const engineResults = currentResults.filter((r: any) => r.engine === engine);
    const engineCited = engineResults.filter((r: any) => r.cited).length;
    const engineTotal = engineResults.length;
    const engineRate = engineTotal > 0 ? Math.round((engineCited / engineTotal) * 100 * 10) / 10 : 0;

    const prevEngineResults = prevResults.filter((r: any) => r.engine === engine);
    const prevEngineCited = prevEngineResults.filter((r: any) => r.cited).length;
    const prevEngineTotal = prevEngineResults.length;
    const prevEngineRate = prevEngineTotal > 0 ? Math.round((prevEngineCited / prevEngineTotal) * 100 * 10) / 10 : 0;

    const engineBR = currentBrandResults.filter((br: any) => {
      const r = currentResults.find((cr: any) => cr.id === br.result_id);
      return r && r.engine === engine;
    });
    const engineRanked = engineBR.filter((br: any) => br.cited && br.rank != null);
    const engineAvgRank = engineRanked.length > 0
      ? Math.round((engineRanked.reduce((s: number, br: any) => s + br.rank, 0) / engineRanked.length) * 10) / 10
      : null;

    return {
      engine: engine === 'gpt' ? 'ChatGPT' : engine === 'gemini' ? 'Gemini' : engine,
      citationRate: engineRate,
      avgRank: engineAvgRank,
      totalTests: engineTotal,
      citations: engineCited,
      change: Math.round((engineRate - prevEngineRate) * 10) / 10,
    };
  });

  // 브랜드별 성능
  const brands = db.prepare(
    'SELECT id, name FROM brands WHERE user_id = ? AND is_active = 1'
  ).all(userId) as any[];

  const brandPerformance = brands.map((brand: any) => {
    const brandBR = currentBrandResults.filter((br: any) => br.brand_id === brand.id);
    const bCited = brandBR.filter((br: any) => br.cited).length;
    const bTotal = brandBR.length;
    const bRate = bTotal > 0 ? Math.round((bCited / bTotal) * 100 * 10) / 10 : 0;
    const bRanked = brandBR.filter((br: any) => br.cited && br.rank != null);
    const bAvgRank = bRanked.length > 0
      ? Math.round((bRanked.reduce((s: number, br: any) => s + br.rank, 0) / bRanked.length) * 10) / 10
      : null;

    return {
      brandId: brand.id,
      brandName: brand.name,
      citationRate: bRate,
      avgRank: bAvgRank,
      totalTests: bTotal,
      citations: bCited,
    };
  }).filter((bp: any) => bp.totalTests > 0);

  // 쿼리별 인용률 (top / worst)
  const queryMap = new Map<string, { query: string; cited: number; total: number }>();
  for (const r of currentResults) {
    const key = r.query_id || r.query;
    const entry = queryMap.get(key) || { query: r.query, cited: 0, total: 0 };
    entry.total++;
    if (r.cited) entry.cited++;
    queryMap.set(key, entry);
  }
  const queryStats = [...queryMap.values()]
    .map((q) => ({ query: q.query, citationRate: q.total > 0 ? Math.round((q.cited / q.total) * 100) : 0 }));
  queryStats.sort((a, b) => b.citationRate - a.citationRate);
  const topQueries = queryStats.filter((q) => q.citationRate > 0).slice(0, 5);
  const worstQueries = queryStats.filter((q) => q.citationRate < 100).reverse().slice(0, 5);

  // 하이라이트 생성
  const highlights: string[] = [];
  if (totalTests > 0) {
    highlights.push(`총 ${totalTests}건의 테스트가 수행되었습니다.`);
  }
  if (citationRate > prevCitationRate) {
    highlights.push(`인용률이 ${prevCitationRate}%에서 ${citationRate}%로 상승했습니다.`);
  } else if (citationRate < prevCitationRate) {
    highlights.push(`인용률이 ${prevCitationRate}%에서 ${citationRate}%로 하락했습니다.`);
  }
  if (enginePerformance.length > 0) {
    const bestEngine = enginePerformance.reduce((a, b) => a.citationRate > b.citationRate ? a : b);
    if (bestEngine.citationRate > 0) {
      highlights.push(`${bestEngine.engine}에서 ${bestEngine.citationRate}%의 인용률을 기록했습니다.`);
    }
  }
  if (brandPerformance.length > 0) {
    const bestBrand = brandPerformance.reduce((a, b) => a.citationRate > b.citationRate ? a : b);
    if (bestBrand.citationRate > 0) {
      highlights.push(`${bestBrand.brandName} 브랜드가 ${bestBrand.citationRate}%로 가장 높은 인용률을 보입니다.`);
    }
  }

  const metrics = {
    citationRate,
    citationRateChange: Math.round((citationRate - prevCitationRate) * 10) / 10,
    shareOfVoice,
    shareOfVoiceChange: Math.round((shareOfVoice - prevShareOfVoice) * 10) / 10,
    avgRank,
    avgRankChange: avgRank != null && prevAvgRank != null ? Math.round((avgRank - prevAvgRank) * 10) / 10 : 0,
    totalTests,
    totalTestsChange: totalTests - prevTotalTests,
    enginePerformance,
    brandPerformance,
  };

  // === AI 분석 생성 ===
  let aiAnalysis: any = null;

  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && totalTests > 0) {
      // 카테고리별 인용률 집계
      const categoryMap = new Map<string, { total: number; cited: number }>();
      if (currentResultIds.length > 0) {
        const catPlaceholders = currentResultIds.map(() => '?').join(',');
        const catResults = db.prepare(`
          SELECT r.category, r.cited
          FROM results r
          WHERE r.id IN (${catPlaceholders})
        `).all(...currentResultIds) as any[];
        for (const cr of catResults) {
          const entry = categoryMap.get(cr.category) || { total: 0, cited: 0 };
          entry.total++;
          if (cr.cited) entry.cited++;
          categoryMap.set(cr.category, entry);
        }
      }
      const categoryStats = [...categoryMap.entries()].map(([category, stats]) => ({
        category,
        total: stats.total,
        cited: stats.cited,
        citationRate: stats.total > 0 ? Math.round((stats.cited / stats.total) * 100 * 10) / 10 : 0,
      }));

      // 경쟁사 언급 빈도 집계
      const competitorFrequency = new Map<string, number>();
      for (const br of currentBrandResults) {
        const mentions: string[] = JSON.parse(br.competitor_mentions || '[]');
        for (const comp of mentions) {
          competitorFrequency.set(comp, (competitorFrequency.get(comp) || 0) + 1);
        }
      }
      const competitorStats = [...competitorFrequency.entries()]
        .map(([name, count]) => ({ name, mentionCount: count }))
        .sort((a, b) => b.mentionCount - a.mentionCount);

      // full_response 샘플링 (인용된 3건 + 인용 안 된 3건)
      let citedSamples: string[] = [];
      let uncitedSamples: string[] = [];
      if (currentResultIds.length > 0) {
        const samplePlaceholders = currentResultIds.map(() => '?').join(',');
        const citedRows = db.prepare(`
          SELECT query, full_response FROM results
          WHERE id IN (${samplePlaceholders}) AND cited = 1 AND full_response IS NOT NULL
          ORDER BY RANDOM() LIMIT 3
        `).all(...currentResultIds) as any[];
        citedSamples = citedRows.map((r: any) =>
          `[쿼리: ${r.query}]\n${(r.full_response || '').slice(0, 500)}`
        );

        const uncitedRows = db.prepare(`
          SELECT query, full_response FROM results
          WHERE id IN (${samplePlaceholders}) AND cited = 0 AND full_response IS NOT NULL
          ORDER BY RANDOM() LIMIT 3
        `).all(...currentResultIds) as any[];
        uncitedSamples = uncitedRows.map((r: any) =>
          `[쿼리: ${r.query}]\n${(r.full_response || '').slice(0, 500)}`
        );
      }

      // OpenAI 호출
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: openaiKey });

      const systemPrompt = `당신은 AI 검색 엔진 최적화(AEO/GEO) 전문 분석가입니다. 브랜드의 AI 검색 노출 데이터를 분석하여 실행 가능한 인사이트를 제공합니다.

## 분석 프레임워크

### summary (4-6문장)
반드시 다음 순서로 작성:
1. 해당 기간의 전체 추세 요약 (상승/하락/정체, 수치 근거)
2. 가장 두드러진 성과 또는 강점 (구체적 수치 인용)
3. 가장 우려되는 약점 또는 리스크
4. 다음 기간에 주목해야 할 포인트와 전망

### categoryAnalysis (카테고리당 각 2-3문장)
각 카테고리에 대해:
- 인용률의 원인 분석: 왜 높은지/낮은지 AI 응답 패턴 기반으로 추론
- 실제 AI 응답에서 관찰된 인용/미인용 패턴 언급
- 해당 카테고리에 특화된 구체적 개선 방향 1가지

### competitorAnalysis (4-5문장)
다음을 포함:
- 가장 자주 언급되는 경쟁사와 그 맥락 (어떤 유형의 질문에서 언급되는지)
- 자사 브랜드 대비 경쟁사의 포지셔닝 차이
- 경쟁사 대비 차별화 가능 영역과 전략적 제안

### actionItems (5-7개, 우선순위 순)
각 항목은 다음 형식:
- "[우선순위: 높음/중간] 무엇을 → 왜 → 어떻게" 형태로 구체적 작성
- 실행 가능하고 측정 가능한 제안만 포함
- AI 응답 패턴 분석에 기반한 콘텐츠 전략 포함

### highlights (3-5개)
- 데이터에서 발견된 의미 있는 패턴이나 인사이트
- 단순 수치 반복이 아닌, 숫자 뒤의 의미를 해석

## 출력 규칙
- 반드시 한국어로 작성
- 모든 주장에 데이터 수치를 근거로 인용
- 추상적 표현 대신 구체적 행동 제안
- JSON 형식으로 응답`;

      const userPrompt = `## 리포트 기간
${period} (${type === 'weekly' ? '주간' : '월간'})

## 핵심 지표
- 총 테스트: ${totalTests}건
- 인용률: ${citationRate}% (이전 기간 대비 ${citationRate - prevCitationRate > 0 ? '+' : ''}${Math.round((citationRate - prevCitationRate) * 10) / 10}%p)
- 점유율: ${shareOfVoice}%
- 평균 순위: ${avgRank != null ? '#' + avgRank : '없음'}

## 카테고리별 성과
${categoryStats.map(c => `- ${c.category}: ${c.citationRate}% (${c.cited}/${c.total}건)`).join('\n') || '데이터 없음'}

## 엔진별 성과
${enginePerformance.map(e => `- ${e.engine}: 인용률 ${e.citationRate}%, 변화 ${e.change > 0 ? '+' : ''}${e.change}%p`).join('\n') || '데이터 없음'}

## 브랜드별 성과
${brandPerformance.map(b => `- ${b.brandName}: 인용률 ${b.citationRate}%, 순위 ${b.avgRank != null ? '#' + b.avgRank : '없음'}`).join('\n') || '데이터 없음'}

## 경쟁사 언급 현황
${competitorStats.length > 0 ? competitorStats.map(c => `- ${c.name}: ${c.mentionCount}회 언급`).join('\n') : '데이터 없음'}

## 인용률 높은 쿼리
${topQueries.map(q => `- "${q.query}": ${q.citationRate}%`).join('\n') || '없음'}

## 인용률 낮은 쿼리
${worstQueries.map(q => `- "${q.query}": ${q.citationRate}%`).join('\n') || '없음'}

## AI 응답 샘플 (브랜드가 인용된 응답)
${citedSamples.length > 0 ? citedSamples.join('\n---\n') : '샘플 없음'}

## AI 응답 샘플 (브랜드가 인용되지 않은 응답)
${uncitedSamples.length > 0 ? uncitedSamples.join('\n---\n') : '샘플 없음'}

위 데이터를 분석하여 다음 JSON 형식으로 응답하세요:
{
  "summary": "string",
  "categoryAnalysis": [{"category": "string", "insight": "string", "citationRate": number}],
  "competitorAnalysis": "string",
  "actionItems": ["string"],
  "highlights": ["string"]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 3000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const aiContent = completion.choices[0]?.message?.content;
      if (aiContent) {
        aiAnalysis = JSON.parse(aiContent);
      }
    }
  } catch (err) {
    console.error('[reports] AI 분석 생성 실패 (리포트는 정상 생성됨):', err);
    aiAnalysis = null;
  }

  db.prepare(`
    INSERT INTO reports (id, user_id, title, type, period, start_date, end_date, metrics, highlights, top_queries, worst_queries, ai_analysis)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, userId, title, type, period,
    startDate.toISOString(), now.toISOString(),
    JSON.stringify(metrics),
    JSON.stringify(highlights),
    JSON.stringify(topQueries),
    JSON.stringify(worstQueries),
    aiAnalysis ? JSON.stringify(aiAnalysis) : null
  );

  res.status(201).json({
    id,
    title,
    type,
    period,
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
    generatedAt: now.toISOString(),
    metrics,
    highlights,
    topQueries,
    worstQueries,
    aiAnalysis,
  });
});

router.delete('/reports', (req, res) => {
  const userId = req.user!.id;
  const { id } = req.query;

  db.prepare('DELETE FROM reports WHERE id = ? AND user_id = ?').run(id, userId);
  res.json({ success: true });
});

// === 인사이트 API ===

router.get('/insights', (req, res) => {
  const userId = req.user!.id;

  const insights = db.prepare(`
    SELECT id, brand_id, brand_name, common_keywords, category_insights,
           citation_patterns, actionable_insights, content_gaps, metadata, created_at
    FROM insights WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId);

  const parsed = insights.map((i: any) => ({
    id: i.id,
    brandId: i.brand_id,
    brandName: i.brand_name,
    commonKeywords: JSON.parse(i.common_keywords || '[]'),
    categoryInsights: JSON.parse(i.category_insights || '[]'),
    citationPatterns: JSON.parse(i.citation_patterns || '{}'),
    actionableInsights: JSON.parse(i.actionable_insights || '[]'),
    contentGaps: JSON.parse(i.content_gaps || '[]'),
    metadata: JSON.parse(i.metadata || '{}'),
    createdAt: i.created_at,
  }));

  res.json({ insights: parsed });
});

router.post('/insights', async (req, res) => {
  const userId = req.user!.id;
  const { brandId } = req.body;

  if (!brandId) {
    return res.status(400).json({ error: '브랜드 ID는 필수입니다.' });
  }

  // 브랜드 정보 조회
  const brand = db.prepare(
    'SELECT id, name, competitors FROM brands WHERE id = ? AND user_id = ?'
  ).get(brandId, userId) as { id: string; name: string; competitors: string } | undefined;

  if (!brand) {
    return res.status(404).json({ error: '브랜드를 찾을 수 없습니다.' });
  }

  const competitors: string[] = JSON.parse(brand.competitors || '[]');

  // 해당 브랜드가 포함된 결과 조회
  const brandResultRows = db.prepare(`
    SELECT r.id, r.query, r.category, r.full_response, r.cited, r.tested_at,
           br.cited as brand_cited
    FROM results r
    JOIN brand_results br ON r.id = br.result_id AND br.brand_id = ?
    WHERE r.user_id = ?
    ORDER BY r.tested_at DESC
    LIMIT 100
  `).all(brandId, userId) as any[];

  if (brandResultRows.length < 3) {
    return res.status(400).json({
      error: `'${brand.name}' 브랜드의 테스트 결과가 3개 이상 필요합니다 (현재 ${brandResultRows.length}개)`
    });
  }

  // 최근 50개 응답 분석
  const responses = brandResultRows.slice(0, 50)
    .filter((r: any) => r.full_response)
    .map((r: any) => ({
      query: r.query,
      category: r.category,
      response: (r.full_response as string).slice(0, 2000),
      cited: !!r.brand_cited,
    }));

  if (responses.length === 0) {
    return res.status(400).json({ error: '분석할 응답 데이터가 없습니다' });
  }

  // LLM 분석
  const analysisPrompt = `당신은 AI 마케팅 전문가입니다.

분석 대상 브랜드: "${brand.name}"
${competitors.length > 0 ? `경쟁사: ${competitors.join(', ')}` : ''}

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

  let analysisResult: any;

  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(500).json({ error: 'OpenAI API 키가 설정되지 않았습니다.' });
    }

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: openaiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
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
      max_completion_tokens: 3000,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    analysisResult = JSON.parse(jsonContent);
  } catch (llmError) {
    console.error('LLM analysis error:', llmError);
    analysisResult = {
      commonKeywords: [],
      categoryInsights: [],
      citationPatterns: { citedPatterns: [], uncitedPatterns: [] },
      actionableInsights: [],
      contentGaps: [],
      error: 'LLM 분석 중 오류가 발생했습니다.',
    };
  }

  // 인사이트 저장
  const id = randomUUID();
  const now = new Date().toISOString();

  const metadata = {
    analyzedAt: now,
    totalResponses: responses.length,
    citedResponses: responses.filter((r) => r.cited).length,
    categories: [...new Set(responses.map((r) => r.category))],
  };

  const insight = {
    id,
    brandId: brand.id,
    brandName: brand.name,
    commonKeywords: analysisResult.commonKeywords || [],
    categoryInsights: analysisResult.categoryInsights || [],
    citationPatterns: analysisResult.citationPatterns || { citedPatterns: [], uncitedPatterns: [] },
    actionableInsights: analysisResult.actionableInsights || [],
    contentGaps: analysisResult.contentGaps || [],
    metadata,
  };

  db.prepare(`
    INSERT INTO insights (id, user_id, brand_id, brand_name, common_keywords, category_insights,
                          citation_patterns, actionable_insights, content_gaps, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, userId, brand.id, brand.name,
    JSON.stringify(insight.commonKeywords),
    JSON.stringify(insight.categoryInsights),
    JSON.stringify(insight.citationPatterns),
    JSON.stringify(insight.actionableInsights),
    JSON.stringify(insight.contentGaps),
    JSON.stringify(insight.metadata)
  );

  res.status(201).json({ ...insight, createdAt: now });
});

router.delete('/insights', (req, res) => {
  const userId = req.user!.id;
  const { id } = req.query;

  db.prepare('DELETE FROM insights WHERE id = ? AND user_id = ?').run(id, userId);
  res.json({ success: true });
});

// === GEO Score 히스토리 API ===

router.get('/geo-scores', (req, res) => {
  const userId = req.user!.id;

  const scores = db.prepare(`
    SELECT id, url, total_score, grade, categories, pages, recommendations, analyzed_at, created_at
    FROM geo_scores WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(userId);

  const parsed = scores.map((s: any) => ({
    id: s.id,
    url: s.url,
    totalScore: s.total_score,
    grade: s.grade,
    categories: JSON.parse(s.categories || '{}'),
    pages: JSON.parse(s.pages || '[]'),
    recommendations: JSON.parse(s.recommendations || '[]'),
    analyzedAt: s.analyzed_at,
    savedAt: s.created_at,
  }));

  res.json({ scores: parsed });
});

router.post('/geo-scores', (req, res) => {
  const userId = req.user!.id;
  const { url, totalScore, grade, categories, pages, recommendations, analyzedAt } = req.body;

  if (!url || totalScore === undefined || !grade) {
    return res.status(400).json({ error: 'URL, totalScore, grade는 필수입니다.' });
  }

  // 같은 URL의 기존 데이터 삭제 (최신 것만 유지)
  db.prepare('DELETE FROM geo_scores WHERE user_id = ? AND url = ?').run(userId, url);

  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO geo_scores (id, user_id, url, total_score, grade, categories, pages, recommendations, analyzed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, userId, url, totalScore, grade,
    JSON.stringify(categories || {}),
    JSON.stringify(pages || []),
    JSON.stringify(recommendations || []),
    analyzedAt || now,
    now
  );

  res.status(201).json({
    id,
    url,
    totalScore,
    grade,
    categories,
    pages,
    recommendations,
    analyzedAt: analyzedAt || now,
    savedAt: now,
  });
});

router.delete('/geo-scores/:id', (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  db.prepare('DELETE FROM geo_scores WHERE id = ? AND user_id = ?').run(id, userId);
  res.json({ success: true });
});

router.delete('/geo-scores', (req, res) => {
  const userId = req.user!.id;

  db.prepare('DELETE FROM geo_scores WHERE user_id = ?').run(userId);
  res.json({ success: true });
});

// === 테스트 쿼리 API ===

router.post('/test-query', async (req, res) => {
  const userId = req.user!.id;
  const { query, queryId, category = 'general', engine = 'gpt' } = req.body;

  if (!query) {
    return res.status(400).json({ error: '쿼리는 필수입니다.' });
  }

  try {
    // AI API 호출
    let fullResponse = '';

    if (engine === 'gpt') {
      const { default: OpenAI } = await import('openai');
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return res.status(500).json({ error: 'OpenAI API 키가 설정되지 않았습니다.' });
      }
      const openai = new OpenAI({ apiKey: openaiKey });
      const response = await openai.responses.create({
        model: 'gpt-5-mini',
        input: query,
        tools: [{ type: 'web_search' }],
      });
      fullResponse = response.output_text || '';
    } else {
      return res.status(400).json({ error: 'Gemini 엔진은 아직 지원되지 않습니다.' });
    }

    // 인용 마커 제거한 클린 텍스트로 브랜드 매칭
    const cleanResponse = stripCitations(fullResponse);
    const cleanLower = cleanResponse.toLowerCase();

    // 해당 유저의 브랜드 조회
    const brands = db.prepare(
      'SELECT id, name, competitors FROM brands WHERE user_id = ? AND is_active = 1'
    ).all(userId) as { id: string; name: string; competitors: string }[];

    // 브랜드별 인용 체크
    const brandResults: { brandId: string; brandName: string; cited: boolean; rank: number | null; competitorMentions: string[] }[] = [];

    for (const brand of brands) {
      const cited = cleanLower.includes(brand.name.toLowerCase());
      let rank: number | null = null;

      if (cited) {
        const lines = cleanResponse.split('\n');
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

      const competitors: string[] = JSON.parse(brand.competitors || '[]');
      const competitorMentions: string[] = [];
      for (const competitor of competitors) {
        if (cleanLower.includes(competitor.toLowerCase())) {
          competitorMentions.push(competitor);
        }
      }

      brandResults.push({ brandId: brand.id, brandName: brand.name, cited, rank, competitorMentions });
    }

    const anyCited = brandResults.some((br) => br.cited);
    const id = randomUUID();
    const now = new Date().toISOString();

    // 결과 저장
    db.prepare(`
      INSERT INTO results (id, user_id, query_id, query, category, engine, cited, response, full_response, tested_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, queryId || null, query, category, engine, anyCited ? 1 : 0, fullResponse.slice(0, 500), fullResponse, now);

    // 브랜드별 결과 저장
    const insertBrandResult = db.prepare(
      `INSERT INTO brand_results (result_id, brand_id, brand_name, cited, rank, competitor_mentions)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const br of brandResults) {
      insertBrandResult.run(id, br.brandId, br.brandName, br.cited ? 1 : 0, br.rank, JSON.stringify(br.competitorMentions));
    }

    // 쿼리 last_tested 업데이트
    if (queryId) {
      db.prepare("UPDATE queries SET last_tested = ? WHERE id = ?").run(now, queryId);
    }

    res.status(201).json({
      id,
      queryId,
      query,
      category,
      engine,
      cited: anyCited,
      brandResults,
      response: fullResponse.slice(0, 500),
      fullResponse,
      testedAt: now,
    });
  } catch (err: any) {
    console.error('[test-query] AI API 호출 실패:', err);
    res.status(500).json({ error: err.message || 'AI API 호출에 실패했습니다.' });
  }
});

export default router;
