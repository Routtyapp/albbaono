import { getDatabase } from '../index';

// 타입 정의
export interface Report {
  id: string;
  title: string;
  type: 'weekly' | 'monthly';
  period: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  metrics: Record<string, unknown>;
  highlights: string[];
  topQueries: Array<{ query: string; citationRate: number }>;
  worstQueries: Array<{ query: string; citationRate: number }>;
}

interface ReportRow {
  id: string;
  title: string;
  type: string;
  period: string;
  start_date: string;
  end_date: string;
  generated_at: string;
  metrics: string;
  highlights: string | null;
  top_queries: string | null;
  worst_queries: string | null;
}

/**
 * 모든 리포트 조회
 */
export function getAllReports(limit = 50): Report[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT id, title, type, period, start_date, end_date, generated_at, metrics, highlights, top_queries, worst_queries
    FROM reports
    ORDER BY generated_at DESC
    LIMIT ?
  `).all(limit) as ReportRow[];

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    type: row.type as 'weekly' | 'monthly',
    period: row.period,
    startDate: row.start_date,
    endDate: row.end_date,
    generatedAt: row.generated_at,
    metrics: JSON.parse(row.metrics),
    highlights: row.highlights ? JSON.parse(row.highlights) : [],
    topQueries: row.top_queries ? JSON.parse(row.top_queries) : [],
    worstQueries: row.worst_queries ? JSON.parse(row.worst_queries) : [],
  }));
}

/**
 * ID로 리포트 조회
 */
export function getReportById(id: string): Report | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT id, title, type, period, start_date, end_date, generated_at, metrics, highlights, top_queries, worst_queries
    FROM reports
    WHERE id = ?
  `).get(id) as ReportRow | undefined;

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    type: row.type as 'weekly' | 'monthly',
    period: row.period,
    startDate: row.start_date,
    endDate: row.end_date,
    generatedAt: row.generated_at,
    metrics: JSON.parse(row.metrics),
    highlights: row.highlights ? JSON.parse(row.highlights) : [],
    topQueries: row.top_queries ? JSON.parse(row.top_queries) : [],
    worstQueries: row.worst_queries ? JSON.parse(row.worst_queries) : [],
  };
}

/**
 * 리포트 생성
 */
export function createReport(data: {
  title: string;
  type: 'weekly' | 'monthly';
  period: string;
  startDate: string;
  endDate: string;
  metrics: Record<string, unknown>;
  highlights: string[];
  topQueries: Array<{ query: string; citationRate: number }>;
  worstQueries: Array<{ query: string; citationRate: number }>;
}): Report {
  const db = getDatabase();
  const id = String(Date.now());
  const generatedAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO reports (id, title, type, period, start_date, end_date, generated_at, metrics, highlights, top_queries, worst_queries)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.title,
    data.type,
    data.period,
    data.startDate,
    data.endDate,
    generatedAt,
    JSON.stringify(data.metrics),
    JSON.stringify(data.highlights),
    JSON.stringify(data.topQueries),
    JSON.stringify(data.worstQueries)
  );

  return {
    id,
    title: data.title,
    type: data.type,
    period: data.period,
    startDate: data.startDate,
    endDate: data.endDate,
    generatedAt,
    metrics: data.metrics,
    highlights: data.highlights,
    topQueries: data.topQueries,
    worstQueries: data.worstQueries,
  };
}

/**
 * 리포트 삭제
 */
export function deleteReport(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare(`DELETE FROM reports WHERE id = ?`).run(id);
  return result.changes > 0;
}

/**
 * 오래된 리포트 정리 (50개 초과시)
 */
export function cleanupOldReports(maxCount = 50): void {
  const db = getDatabase();

  const countResult = db.prepare('SELECT COUNT(*) as count FROM reports').get() as { count: number };

  if (countResult.count > maxCount) {
    db.prepare(`
      DELETE FROM reports
      WHERE id NOT IN (
        SELECT id FROM reports
        ORDER BY generated_at DESC
        LIMIT ?
      )
    `).run(maxCount);
  }
}

/**
 * 리포트 데이터 가져오기 (API 응답 형식)
 */
export function getReportsData(): { reports: Report[]; lastUpdated: string | null } {
  const reports = getAllReports();
  const lastReport = reports[0];
  return {
    reports,
    lastUpdated: lastReport?.generatedAt || null,
  };
}
