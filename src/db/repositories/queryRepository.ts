import { getDatabase } from '../index';

// 타입 정의
export interface Query {
  id: string;
  query: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  createdAt: string;
  lastTested: string | null;
  brandIds?: string[];
}

interface QueryRow {
  id: string;
  query: string;
  category: string;
  frequency: string;
  is_active: number;
  created_at: string;
  last_tested: string | null;
}

/**
 * 모든 쿼리 조회
 */
export function getAllQueries(): Query[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT id, query, category, frequency, is_active, created_at, last_tested
    FROM queries
    WHERE is_active = 1
    ORDER BY created_at DESC
  `).all() as QueryRow[];

  return rows.map(row => {
    // 연결된 브랜드 ID 조회
    const brandIds = db.prepare(`
      SELECT brand_id FROM query_brands WHERE query_id = ?
    `).all(row.id) as { brand_id: string }[];

    return {
      id: row.id,
      query: row.query,
      category: row.category,
      frequency: row.frequency as 'daily' | 'weekly' | 'monthly',
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      lastTested: row.last_tested,
      brandIds: brandIds.map(b => b.brand_id),
    };
  });
}

/**
 * ID로 쿼리 조회
 */
export function getQueryById(id: string): Query | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT id, query, category, frequency, is_active, created_at, last_tested
    FROM queries
    WHERE id = ?
  `).get(id) as QueryRow | undefined;

  if (!row) return null;

  const brandIds = db.prepare(`
    SELECT brand_id FROM query_brands WHERE query_id = ?
  `).all(row.id) as { brand_id: string }[];

  return {
    id: row.id,
    query: row.query,
    category: row.category,
    frequency: row.frequency as 'daily' | 'weekly' | 'monthly',
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    lastTested: row.last_tested,
    brandIds: brandIds.map(b => b.brand_id),
  };
}

/**
 * 쿼리 생성
 */
export function createQuery(data: {
  query: string;
  category?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
}): Query {
  const db = getDatabase();
  const id = String(Date.now());
  const createdAt = new Date().toISOString();
  const category = data.category || '기타';
  const frequency = data.frequency || 'daily';

  db.prepare(`
    INSERT INTO queries (id, query, category, frequency, is_active, created_at, last_tested)
    VALUES (?, ?, ?, ?, 1, ?, NULL)
  `).run(id, data.query, category, frequency, createdAt);

  return {
    id,
    query: data.query,
    category,
    frequency,
    isActive: true,
    createdAt,
    lastTested: null,
    brandIds: [],
  };
}

/**
 * 쿼리 업데이트
 */
export function updateQuery(
  id: string,
  data: { query?: string; category?: string; frequency?: string; isActive?: boolean }
): boolean {
  const db = getDatabase();
  const query = getQueryById(id);
  if (!query) return false;

  db.prepare(`
    UPDATE queries
    SET query = ?, category = ?, frequency = ?, is_active = ?
    WHERE id = ?
  `).run(
    data.query ?? query.query,
    data.category ?? query.category,
    data.frequency ?? query.frequency,
    data.isActive !== undefined ? (data.isActive ? 1 : 0) : (query.isActive ? 1 : 0),
    id
  );

  return true;
}

/**
 * 쿼리에 브랜드 연결
 */
export function updateQueryBrands(queryId: string, brandIds: string[]): boolean {
  const db = getDatabase();

  // 기존 연결 삭제
  db.prepare(`DELETE FROM query_brands WHERE query_id = ?`).run(queryId);

  // 새 연결 추가
  const insertStmt = db.prepare(`INSERT INTO query_brands (query_id, brand_id) VALUES (?, ?)`);
  for (const brandId of brandIds) {
    insertStmt.run(queryId, brandId);
  }

  return true;
}

/**
 * 쿼리의 lastTested 업데이트
 */
export function updateQueryLastTested(id: string, testedAt: string): void {
  const db = getDatabase();
  db.prepare(`UPDATE queries SET last_tested = ? WHERE id = ?`).run(testedAt, id);
}

/**
 * 쿼리 삭제
 */
export function deleteQuery(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare(`DELETE FROM queries WHERE id = ?`).run(id);
  return result.changes > 0;
}

/**
 * 쿼리 데이터 가져오기 (API 응답 형식)
 */
export function getQueriesData(): { queries: Query[]; lastUpdated: string | null } {
  const queries = getAllQueries();
  const lastQuery = queries[0];
  return {
    queries,
    lastUpdated: lastQuery?.createdAt || null,
  };
}
