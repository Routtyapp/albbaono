import type {
  PageData,
  Categories,
  CategoryScore,
  PageAnalysis,
  ScoreItem,
  SiteType,
} from '../../types/geoScore.js';

import { analyzeStructure, getStructureScore } from './structure.js';
import { analyzeSchema, getSchemaScore } from './schema.js';
import { analyzeUrl, getUrlScore } from './url.js';
import { analyzeMeta, getMetaScore } from './meta.js';
import { analyzeContent, getContentScore } from './content.js';

export interface AnalysisResult {
  categories: Categories;
  pages: PageAnalysis[];
  totalScore: number;
}

/**
 * 여러 페이지를 분석하고 종합 점수 계산
 */
export function analyzePages(pages: PageData[], siteType: SiteType = 'general'): AnalysisResult {
  const pageAnalyses: PageAnalysis[] = [];
  const aggregatedScores = {
    structure: 0,
    schema: 0,
    url: 0,
    meta: 0,
    content: 0,
  };

  // 모든 구조 분석 결과 수집 (카테고리별 아이템 집계용)
  const allStructureItems: ScoreItem[] = [];
  const allSchemaItems: ScoreItem[] = [];
  const allUrlItems: ScoreItem[] = [];
  const allMetaItems: ScoreItem[] = [];
  const allContentItems: ScoreItem[] = [];

  for (const page of pages) {
    const structureAnalysis = analyzeStructure(page.html);
    const schemaAnalysis = analyzeSchema(page.html, siteType);
    const urlAnalysis = analyzeUrl(page.url);
    const metaAnalysis = analyzeMeta(page.html, page.url);
    const contentAnalysis = analyzeContent(page.html);

    const structureScore = getStructureScore(structureAnalysis);
    const schemaScore = getSchemaScore(schemaAnalysis);
    const urlScore = getUrlScore(urlAnalysis);
    const metaScore = getMetaScore(metaAnalysis);
    const contentScore = getContentScore(contentAnalysis);

    aggregatedScores.structure += structureScore;
    aggregatedScores.schema += schemaScore;
    aggregatedScores.url += urlScore;
    aggregatedScores.meta += metaScore;
    aggregatedScores.content += contentScore;

    // 아이템 수집
    allStructureItems.push(
      structureAnalysis.listContent,
      structureAnalysis.tableUsage,
      structureAnalysis.headingFirst,
      structureAnalysis.freshness
    );
    allSchemaItems.push(
      schemaAnalysis.productSchema,
      schemaAnalysis.faqSchema,
      schemaAnalysis.howToSchema,
      schemaAnalysis.reviewSchema
    );
    allUrlItems.push(
      urlAnalysis.usesHyphens,
      urlAnalysis.isLowercase,
      urlAnalysis.noEncodedChars
    );
    allMetaItems.push(
      metaAnalysis.titleOptimization,
      metaAnalysis.descriptionOptimization,
      metaAnalysis.openGraph,
      metaAnalysis.canonicalUrl
    );
    allContentItems.push(
      contentAnalysis.hasStatistics,
      contentAnalysis.hasCitations,
      contentAnalysis.htmlVsImage
    );

    const total = structureScore + schemaScore + urlScore + metaScore + contentScore;

    pageAnalyses.push({
      url: page.url,
      title: page.title,
      scores: {
        structure: structureScore,
        schema: schemaScore,
        url: urlScore,
        meta: metaScore,
        content: contentScore,
        total,
      },
    });
  }

  const pageCount = pages.length || 1;

  // 평균 점수 계산
  const avgScores = {
    structure: Math.round(aggregatedScores.structure / pageCount),
    schema: Math.round(aggregatedScores.schema / pageCount),
    url: Math.round(aggregatedScores.url / pageCount),
    meta: Math.round(aggregatedScores.meta / pageCount),
    content: Math.round(aggregatedScores.content / pageCount),
  };

  // 카테고리별 결과 생성
  const categories: Categories = {
    structure: createCategoryScore(avgScores.structure, 25, allStructureItems),
    schema: createCategoryScore(avgScores.schema, 25, allSchemaItems),
    url: createCategoryScore(avgScores.url, 15, allUrlItems),
    meta: createCategoryScore(avgScores.meta, 20, allMetaItems),
    content: createCategoryScore(avgScores.content, 15, allContentItems),
  };

  const totalScore =
    avgScores.structure +
    avgScores.schema +
    avgScores.url +
    avgScores.meta +
    avgScores.content;

  return {
    categories,
    pages: pageAnalyses,
    totalScore,
  };
}

function createCategoryScore(
  score: number,
  maxScore: number,
  items: ScoreItem[]
): CategoryScore {
  // 중복 아이템 제거 (같은 이름의 가장 낮은 점수 사용)
  const uniqueItems = new Map<string, ScoreItem>();
  for (const item of items) {
    const existing = uniqueItems.get(item.name);
    if (!existing || item.score < existing.score) {
      uniqueItems.set(item.name, item);
    }
  }

  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    items: Array.from(uniqueItems.values()),
  };
}

export { analyzeStructure, analyzeSchema, analyzeUrl, analyzeMeta, analyzeContent };
