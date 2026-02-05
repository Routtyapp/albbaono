import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../config/db.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();

// 모든 라우트에 인증 필요
router.use(isAuthenticated);

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

  db.prepare(`
    UPDATE brands SET name = ?, competitors = ?
    WHERE id = ? AND user_id = ?
  `).run(name, JSON.stringify(competitors || []), id, userId);

  res.json({ success: true });
});

router.delete('/brands/:id', (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  db.prepare('DELETE FROM brands WHERE id = ? AND user_id = ?').run(id, userId);
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
    WHERE q.user_id = ? AND q.is_active = 1
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
    return res.status(400).json({ error: '쿼리와 카테고리는 필수입니다.' });
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

  // 기존 연결 삭제
  db.prepare('DELETE FROM query_brands WHERE query_id = ?').run(id);

  // 새 연결 추가
  const insert = db.prepare('INSERT INTO query_brands (query_id, brand_id) VALUES (?, ?)');
  for (const brandId of brandIds) {
    insert.run(id, brandId);
  }

  res.json({ success: true });
});

router.delete('/queries/:id', (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  db.prepare('DELETE FROM queries WHERE id = ? AND user_id = ?').run(id, userId);
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

  res.json({
    totalTests: totalTests.count,
    citedCount: citedCount.count,
    citationRate,
    registeredBrands: brandsCount.count,
  });
});

// === 결과 API ===

router.get('/results', (req, res) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
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

  const parsed = results.map((r: any) => ({
    id: r.id,
    queryId: r.query_id,
    query: r.query,
    category: r.category,
    engine: r.engine,
    cited: !!r.cited,
    response: r.response,
    fullResponse: r.full_response,
    testedAt: r.tested_at,
  }));

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
  });
});

// === 리포트 API ===

router.get('/reports', (req, res) => {
  const userId = req.user!.id;

  const reports = db.prepare(`
    SELECT id, title, type, period, start_date, end_date, generated_at, metrics, highlights, top_queries, worst_queries
    FROM reports WHERE user_id = ?
    ORDER BY generated_at DESC
  `).all(userId);

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
  }));

  res.json({ reports: parsed });
});

router.post('/reports', (req, res) => {
  const userId = req.user!.id;
  const { type } = req.body;

  // 간단한 리포트 생성 (실제로는 더 복잡한 로직 필요)
  const now = new Date();
  const id = randomUUID();

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (type === 'weekly' ? 7 : 30));

  const title = `${type === 'weekly' ? '주간' : '월간'} 리포트`;
  const period = `${startDate.toISOString().split('T')[0]} ~ ${now.toISOString().split('T')[0]}`;

  const metrics = {
    citationRate: 0,
    citationRateChange: 0,
    totalTests: 0,
    totalTestsChange: 0,
  };

  db.prepare(`
    INSERT INTO reports (id, user_id, title, type, period, start_date, end_date, metrics)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, userId, title, type, period,
    startDate.toISOString(), now.toISOString(),
    JSON.stringify(metrics)
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
    highlights: [],
    topQueries: [],
    worstQueries: [],
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

router.post('/insights', (req, res) => {
  const userId = req.user!.id;
  const { brandId } = req.body;

  if (!brandId) {
    return res.status(400).json({ error: '브랜드 ID는 필수입니다.' });
  }

  // 브랜드 정보 조회
  const brand = db.prepare(
    'SELECT id, name FROM brands WHERE id = ? AND user_id = ?'
  ).get(brandId, userId) as { id: string; name: string } | undefined;

  if (!brand) {
    return res.status(404).json({ error: '브랜드를 찾을 수 없습니다.' });
  }

  // 간단한 인사이트 생성 (실제로는 AI 분석 필요)
  const id = randomUUID();
  const now = new Date().toISOString();

  const insight = {
    id,
    brandId: brand.id,
    brandName: brand.name,
    commonKeywords: [],
    categoryInsights: [],
    citationPatterns: { citedPatterns: [], uncitedPatterns: [] },
    actionableInsights: [],
    contentGaps: [],
    metadata: { analyzedAt: now, totalResponses: 0, citedResponses: 0, categories: [] },
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

  res.status(201).json(insight);
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

router.post('/test-query', (req, res) => {
  const userId = req.user!.id;
  const { query, queryId, category = 'general', engine = 'gpt' } = req.body;

  if (!query) {
    return res.status(400).json({ error: '쿼리는 필수입니다.' });
  }

  // 간단한 테스트 결과 생성 (실제로는 AI API 호출 필요)
  const id = randomUUID();
  const now = new Date().toISOString();
  const cited = Math.random() > 0.5 ? 1 : 0;

  db.prepare(`
    INSERT INTO results (id, user_id, query_id, query, category, engine, cited, response, tested_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, queryId || null, query, category, engine, cited, 'Test response', now);

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
    cited: !!cited,
    response: 'Test response',
    testedAt: now,
  });
});

export default router;
