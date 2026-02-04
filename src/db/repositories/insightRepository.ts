import { getDatabase } from '../index';

// 타입 정의
export interface Keyword {
  keyword: string;
  count: number;
  importance: 'high' | 'medium' | 'low';
  description: string;
}

export interface CategoryInsight {
  category: string;
  keyFactors: string[];
  recommendation: string;
}

export interface CitationPatterns {
  citedPatterns: string[];
  uncitedPatterns: string[];
}

export interface ActionableInsight {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
}

export interface ContentGap {
  area: string;
  currentState: string;
  recommendation: string;
}

export interface InsightMetadata {
  analyzedAt: string;
  totalResponses: number;
  citedResponses: number;
  categories: string[];
}

export interface Insight {
  id: string;
  brandId: string;
  brandName: string;
  commonKeywords: Keyword[];
  categoryInsights: CategoryInsight[];
  citationPatterns: CitationPatterns;
  actionableInsights: ActionableInsight[];
  contentGaps: ContentGap[];
  metadata: InsightMetadata;
  createdAt?: string;
}

interface InsightRow {
  id: string;
  brand_id: string;
  brand_name: string;
  common_keywords: string | null;
  category_insights: string | null;
  citation_patterns: string | null;
  actionable_insights: string | null;
  content_gaps: string | null;
  metadata: string | null;
  created_at: string;
}

/**
 * 모든 인사이트 조회
 */
export function getAllInsights(limit = 50): Insight[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT id, brand_id, brand_name, common_keywords, category_insights, citation_patterns, actionable_insights, content_gaps, metadata, created_at
    FROM insights
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit) as InsightRow[];

  return rows.map(row => ({
    id: row.id,
    brandId: row.brand_id,
    brandName: row.brand_name,
    commonKeywords: row.common_keywords ? JSON.parse(row.common_keywords) : [],
    categoryInsights: row.category_insights ? JSON.parse(row.category_insights) : [],
    citationPatterns: row.citation_patterns ? JSON.parse(row.citation_patterns) : { citedPatterns: [], uncitedPatterns: [] },
    actionableInsights: row.actionable_insights ? JSON.parse(row.actionable_insights) : [],
    contentGaps: row.content_gaps ? JSON.parse(row.content_gaps) : [],
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    createdAt: row.created_at,
  }));
}

/**
 * ID로 인사이트 조회
 */
export function getInsightById(id: string): Insight | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT id, brand_id, brand_name, common_keywords, category_insights, citation_patterns, actionable_insights, content_gaps, metadata, created_at
    FROM insights
    WHERE id = ?
  `).get(id) as InsightRow | undefined;

  if (!row) return null;

  return {
    id: row.id,
    brandId: row.brand_id,
    brandName: row.brand_name,
    commonKeywords: row.common_keywords ? JSON.parse(row.common_keywords) : [],
    categoryInsights: row.category_insights ? JSON.parse(row.category_insights) : [],
    citationPatterns: row.citation_patterns ? JSON.parse(row.citation_patterns) : { citedPatterns: [], uncitedPatterns: [] },
    actionableInsights: row.actionable_insights ? JSON.parse(row.actionable_insights) : [],
    contentGaps: row.content_gaps ? JSON.parse(row.content_gaps) : [],
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    createdAt: row.created_at,
  };
}

/**
 * 브랜드별 인사이트 조회
 */
export function getInsightsByBrandId(brandId: string): Insight[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT id, brand_id, brand_name, common_keywords, category_insights, citation_patterns, actionable_insights, content_gaps, metadata, created_at
    FROM insights
    WHERE brand_id = ?
    ORDER BY created_at DESC
  `).all(brandId) as InsightRow[];

  return rows.map(row => ({
    id: row.id,
    brandId: row.brand_id,
    brandName: row.brand_name,
    commonKeywords: row.common_keywords ? JSON.parse(row.common_keywords) : [],
    categoryInsights: row.category_insights ? JSON.parse(row.category_insights) : [],
    citationPatterns: row.citation_patterns ? JSON.parse(row.citation_patterns) : { citedPatterns: [], uncitedPatterns: [] },
    actionableInsights: row.actionable_insights ? JSON.parse(row.actionable_insights) : [],
    contentGaps: row.content_gaps ? JSON.parse(row.content_gaps) : [],
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    createdAt: row.created_at,
  }));
}

/**
 * 인사이트 생성
 */
export function createInsight(data: {
  brandId: string;
  brandName: string;
  commonKeywords: Keyword[];
  categoryInsights: CategoryInsight[];
  citationPatterns: CitationPatterns;
  actionableInsights: ActionableInsight[];
  contentGaps: ContentGap[];
  metadata: InsightMetadata;
}): Insight {
  const db = getDatabase();
  const id = String(Date.now());
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO insights (id, brand_id, brand_name, common_keywords, category_insights, citation_patterns, actionable_insights, content_gaps, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.brandId,
    data.brandName,
    JSON.stringify(data.commonKeywords),
    JSON.stringify(data.categoryInsights),
    JSON.stringify(data.citationPatterns),
    JSON.stringify(data.actionableInsights),
    JSON.stringify(data.contentGaps),
    JSON.stringify(data.metadata),
    createdAt
  );

  return {
    id,
    ...data,
    createdAt,
  };
}

/**
 * 인사이트 삭제
 */
export function deleteInsight(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare(`DELETE FROM insights WHERE id = ?`).run(id);
  return result.changes > 0;
}

/**
 * 오래된 인사이트 정리 (50개 초과시)
 */
export function cleanupOldInsights(maxCount = 50): void {
  const db = getDatabase();

  const countResult = db.prepare('SELECT COUNT(*) as count FROM insights').get() as { count: number };

  if (countResult.count > maxCount) {
    db.prepare(`
      DELETE FROM insights
      WHERE id NOT IN (
        SELECT id FROM insights
        ORDER BY created_at DESC
        LIMIT ?
      )
    `).run(maxCount);
  }
}

/**
 * 인사이트 데이터 가져오기 (API 응답 형식)
 */
export function getInsightsData(): { insights: Insight[]; lastUpdated: string | null } {
  const insights = getAllInsights();
  const lastInsight = insights[0];
  return {
    insights,
    lastUpdated: lastInsight?.createdAt || null,
  };
}
