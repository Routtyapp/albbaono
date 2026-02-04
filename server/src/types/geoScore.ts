// GEO Score 분석 결과 타입 정의

export interface GeoScoreRequest {
  url: string;
  options?: {
    includeSubpages?: boolean;
    maxSubpages?: number;
  };
}

export interface GeoScoreResult {
  url: string;
  analyzedAt: string;
  totalScore: number;
  grade: Grade;
  categories: Categories;
  pages: PageAnalysis[];
  recommendations: Recommendation[];
}

export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

export interface Categories {
  structure: CategoryScore;
  schema: CategoryScore;
  url: CategoryScore;
  meta: CategoryScore;
  content: CategoryScore;
}

export interface CategoryScore {
  score: number;
  maxScore: number;
  percentage: number;
  items: ScoreItem[];
}

export interface ScoreItem {
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  detail: string;
}

export interface PageAnalysis {
  url: string;
  title: string;
  scores: {
    structure: number;
    schema: number;
    url: number;
    meta: number;
    content: number;
    total: number;
  };
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: keyof Categories;
  issue: string;
  suggestion: string;
  impact: string;
}

// 크롤링 결과 타입
export interface PageData {
  url: string;
  html: string;
  title: string;
  loadTime: number;
  statusCode: number;
}

// 개별 분석기 결과 타입
export interface StructureAnalysis {
  listContent: ScoreItem;
  tableUsage: ScoreItem;
  headingFirst: ScoreItem;
  freshness: ScoreItem;
}

export interface SchemaAnalysis {
  productSchema: ScoreItem;
  faqSchema: ScoreItem;
  howToSchema: ScoreItem;
  reviewSchema: ScoreItem;
}

export interface UrlAnalysis {
  usesHyphens: ScoreItem;
  isLowercase: ScoreItem;
  noEncodedChars: ScoreItem;
}

export interface MetaAnalysis {
  titleOptimization: ScoreItem;
  descriptionOptimization: ScoreItem;
  openGraph: ScoreItem;
  canonicalUrl: ScoreItem;
}

export interface ContentAnalysis {
  hasStatistics: ScoreItem;
  hasCitations: ScoreItem;
  htmlVsImage: ScoreItem;
}
