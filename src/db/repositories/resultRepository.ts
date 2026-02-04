import { getDatabase, transaction } from '../index';

// 타입 정의
export interface BrandResult {
  brandId: string;
  brandName: string;
  cited: boolean;
  rank: number | null;
  competitorMentions: string[];
}

export interface Result {
  id: string;
  queryId: string | null;
  query: string;
  category: string;
  engine: 'gpt' | 'gemini';
  cited: boolean;
  brandResults: BrandResult[];
  response: string;
  fullResponse: string;
  testedAt: string;
}

interface ResultRow {
  id: string;
  query_id: string | null;
  query: string;
  category: string;
  engine: string;
  cited: number;
  response: string | null;
  full_response: string | null;
  tested_at: string;
}

interface BrandResultRow {
  id: number;
  result_id: string;
  brand_id: string;
  brand_name: string;
  cited: number;
  rank: number | null;
  competitor_mentions: string | null;
}

/**
 * 모든 결과 조회
 */
export function getAllResults(limit = 500): Result[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT id, query_id, query, category, engine, cited, response, full_response, tested_at
    FROM results
    ORDER BY tested_at DESC
    LIMIT ?
  `).all(limit) as ResultRow[];

  return rows.map(row => {
    const brandResults = db.prepare(`
      SELECT id, result_id, brand_id, brand_name, cited, rank, competitor_mentions
      FROM brand_results
      WHERE result_id = ?
    `).all(row.id) as BrandResultRow[];

    return {
      id: row.id,
      queryId: row.query_id,
      query: row.query,
      category: row.category,
      engine: row.engine as 'gpt' | 'gemini',
      cited: row.cited === 1,
      brandResults: brandResults.map(br => ({
        brandId: br.brand_id,
        brandName: br.brand_name,
        cited: br.cited === 1,
        rank: br.rank,
        competitorMentions: br.competitor_mentions ? JSON.parse(br.competitor_mentions) : [],
      })),
      response: row.response || '',
      fullResponse: row.full_response || '',
      testedAt: row.tested_at,
    };
  });
}

/**
 * ID로 결과 조회
 */
export function getResultById(id: string): Result | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT id, query_id, query, category, engine, cited, response, full_response, tested_at
    FROM results
    WHERE id = ?
  `).get(id) as ResultRow | undefined;

  if (!row) return null;

  const brandResults = db.prepare(`
    SELECT id, result_id, brand_id, brand_name, cited, rank, competitor_mentions
    FROM brand_results
    WHERE result_id = ?
  `).all(row.id) as BrandResultRow[];

  return {
    id: row.id,
    queryId: row.query_id,
    query: row.query,
    category: row.category,
    engine: row.engine as 'gpt' | 'gemini',
    cited: row.cited === 1,
    brandResults: brandResults.map(br => ({
      brandId: br.brand_id,
      brandName: br.brand_name,
      cited: br.cited === 1,
      rank: br.rank,
      competitorMentions: br.competitor_mentions ? JSON.parse(br.competitor_mentions) : [],
    })),
    response: row.response || '',
    fullResponse: row.full_response || '',
    testedAt: row.tested_at,
  };
}

/**
 * 결과 생성
 */
export function createResult(data: {
  queryId?: string | null;
  query: string;
  category: string;
  engine: 'gpt' | 'gemini';
  cited: boolean;
  brandResults: BrandResult[];
  response: string;
  fullResponse: string;
}): Result {
  const db = getDatabase();
  const id = String(Date.now());
  const testedAt = new Date().toISOString();

  return transaction(() => {
    // 결과 저장
    db.prepare(`
      INSERT INTO results (id, query_id, query, category, engine, cited, response, full_response, tested_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.queryId || null,
      data.query,
      data.category,
      data.engine,
      data.cited ? 1 : 0,
      data.response,
      data.fullResponse,
      testedAt
    );

    // 브랜드별 결과 저장
    const insertBrandResult = db.prepare(`
      INSERT INTO brand_results (result_id, brand_id, brand_name, cited, rank, competitor_mentions)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const br of data.brandResults) {
      insertBrandResult.run(
        id,
        br.brandId,
        br.brandName,
        br.cited ? 1 : 0,
        br.rank,
        JSON.stringify(br.competitorMentions)
      );
    }

    return {
      id,
      queryId: data.queryId || null,
      query: data.query,
      category: data.category,
      engine: data.engine,
      cited: data.cited,
      brandResults: data.brandResults,
      response: data.response,
      fullResponse: data.fullResponse,
      testedAt,
    };
  });
}

/**
 * 오래된 결과 정리 (500개 초과시)
 */
export function cleanupOldResults(maxCount = 500): void {
  const db = getDatabase();

  // 결과 개수 확인
  const countResult = db.prepare('SELECT COUNT(*) as count FROM results').get() as { count: number };

  if (countResult.count > maxCount) {
    // 삭제할 결과 ID 목록 조회
    const toDelete = db.prepare(`
      SELECT id FROM results
      ORDER BY tested_at DESC
      LIMIT -1 OFFSET ?
    `).all(maxCount) as { id: string }[];

    if (toDelete.length > 0) {
      const deleteStmt = db.prepare('DELETE FROM results WHERE id = ?');
      for (const row of toDelete) {
        deleteStmt.run(row.id);
      }
    }
  }
}

/**
 * 결과 데이터 가져오기 (API 응답 형식)
 */
export function getResultsData(): { results: Result[]; lastUpdated: string | null } {
  const results = getAllResults();
  const lastResult = results[0];
  return {
    results,
    lastUpdated: lastResult?.testedAt || null,
  };
}

/**
 * 페이지네이션된 결과 조회
 */
export function getResultsPaginated(page = 1, limit = 20): {
  results: Result[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
} {
  const db = getDatabase();
  const offset = (page - 1) * limit;

  // 전체 개수 조회
  const countResult = db.prepare('SELECT COUNT(*) as count FROM results').get() as { count: number };
  const total = countResult.count;

  // 페이지네이션된 결과 조회
  const rows = db.prepare(`
    SELECT id, query_id, query, category, engine, cited, response, full_response, tested_at
    FROM results
    ORDER BY tested_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as ResultRow[];

  const results = rows.map(row => {
    const brandResults = db.prepare(`
      SELECT id, result_id, brand_id, brand_name, cited, rank, competitor_mentions
      FROM brand_results
      WHERE result_id = ?
    `).all(row.id) as BrandResultRow[];

    return {
      id: row.id,
      queryId: row.query_id,
      query: row.query,
      category: row.category,
      engine: row.engine as 'gpt' | 'gemini',
      cited: row.cited === 1,
      brandResults: brandResults.map(br => ({
        brandId: br.brand_id,
        brandName: br.brand_name,
        cited: br.cited === 1,
        rank: br.rank,
        competitorMentions: br.competitor_mentions ? JSON.parse(br.competitor_mentions) : [],
      })),
      response: row.response || '',
      fullResponse: row.full_response || '',
      testedAt: row.tested_at,
    };
  });

  return {
    results,
    total,
    page,
    limit,
    hasMore: offset + results.length < total,
  };
}

/**
 * 특정 기간 내 결과 조회
 */
export function getResultsByDateRange(startDate: Date, endDate?: Date): Result[] {
  const db = getDatabase();
  const endDateStr = endDate ? endDate.toISOString() : new Date().toISOString();

  const rows = db.prepare(`
    SELECT id, query_id, query, category, engine, cited, response, full_response, tested_at
    FROM results
    WHERE tested_at >= ? AND tested_at <= ?
    ORDER BY tested_at DESC
  `).all(startDate.toISOString(), endDateStr) as ResultRow[];

  return rows.map(row => {
    const brandResults = db.prepare(`
      SELECT id, result_id, brand_id, brand_name, cited, rank, competitor_mentions
      FROM brand_results
      WHERE result_id = ?
    `).all(row.id) as BrandResultRow[];

    return {
      id: row.id,
      queryId: row.query_id,
      query: row.query,
      category: row.category,
      engine: row.engine as 'gpt' | 'gemini',
      cited: row.cited === 1,
      brandResults: brandResults.map(br => ({
        brandId: br.brand_id,
        brandName: br.brand_name,
        cited: br.cited === 1,
        rank: br.rank,
        competitorMentions: br.competitor_mentions ? JSON.parse(br.competitor_mentions) : [],
      })),
      response: row.response || '',
      fullResponse: row.full_response || '',
      testedAt: row.tested_at,
    };
  });
}

/**
 * 특정 브랜드의 결과 조회
 */
export function getResultsByBrandId(brandId: string, limit = 100): Result[] {
  const db = getDatabase();

  // 해당 브랜드가 포함된 결과 ID 조회
  const resultIds = db.prepare(`
    SELECT DISTINCT result_id
    FROM brand_results
    WHERE brand_id = ?
  `).all(brandId) as { result_id: string }[];

  if (resultIds.length === 0) return [];

  const ids = resultIds.map(r => r.result_id);
  const placeholders = ids.map(() => '?').join(',');

  const rows = db.prepare(`
    SELECT id, query_id, query, category, engine, cited, response, full_response, tested_at
    FROM results
    WHERE id IN (${placeholders})
    ORDER BY tested_at DESC
    LIMIT ?
  `).all(...ids, limit) as ResultRow[];

  return rows.map(row => {
    const brandResults = db.prepare(`
      SELECT id, result_id, brand_id, brand_name, cited, rank, competitor_mentions
      FROM brand_results
      WHERE result_id = ?
    `).all(row.id) as BrandResultRow[];

    return {
      id: row.id,
      queryId: row.query_id,
      query: row.query,
      category: row.category,
      engine: row.engine as 'gpt' | 'gemini',
      cited: row.cited === 1,
      brandResults: brandResults.map(br => ({
        brandId: br.brand_id,
        brandName: br.brand_name,
        cited: br.cited === 1,
        rank: br.rank,
        competitorMentions: br.competitor_mentions ? JSON.parse(br.competitor_mentions) : [],
      })),
      response: row.response || '',
      fullResponse: row.full_response || '',
      testedAt: row.tested_at,
    };
  });
}
