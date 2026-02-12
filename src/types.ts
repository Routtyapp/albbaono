// ============================================
// 브랜드 관련 타입
// ============================================

export interface Brand {
  id: string;
  name: string;
  competitors: string[];
  marketingPoints?: string[];
  keywords?: string[];
  createdAt?: string;
  isActive?: boolean;
}

export interface BrandStats {
  brandId?: string;
  brandName?: string;
  citedCount?: number;
  totalTests: number;
  citationRate: number;
  avgRank: number | null;
  linkedQueries?: number;
}

export interface CompetitorStats {
  name: string;
  citationRate: number;
}

export interface BrandActivity {
  type: 'test' | 'insight' | 'report' | string;
  title: string;
  timestamp: string;
}

export interface BrandDetail extends Brand {
  stats?: BrandStats;
  recentResults?: TestResult[];
  competitorStats?: CompetitorStats[];
  recentActivity?: BrandActivity[];
}

// ============================================
// 쿼리 관련 타입
// ============================================

export interface MonitoredQuery {
  id: string;
  query: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  createdAt: string;
  lastTested: string | null;
  brandIds?: string[];
}

// ============================================
// 테스트 결과 관련 타입
// ============================================

export interface BrandResult {
  brandId: string;
  brandName: string;
  cited: boolean;
  rank: number | null;
  competitorMentions: string[];
}

export interface TestResult {
  id: string;
  queryId: string | null;
  query: string;
  category: string;
  engine: 'gpt' | 'gemini';
  cited: boolean;
  brandResults?: BrandResult[];
  response: string;
  fullResponse: string;
  testedAt: string;
}

// ============================================
// 트렌드 관련 타입
// ============================================

export interface TrendDataPoint {
  date: string;          // "2026-01-27" or "2026-W05"
  totalTests: number;
  citedCount: number;
  citationRate: number;
}

export interface TrendData {
  overall: TrendDataPoint[];
  byEngine: Record<string, TrendDataPoint[]>;
  byCategory: Record<string, TrendDataPoint[]>;
}

// ============================================
// 통계 관련 타입
// ============================================

export interface EngineStats {
  engine: string;
  totalTests: number;
  citedCount: number;
  citationRate: number;
}

export interface Stats {
  totalTests: number;
  citationRate: number;
  citedCount: number;
  avgRank?: number | null;
  brandStats: BrandStats[];
  engineStats?: EngineStats[];
  recentResults: TestResult[];
}

// ============================================
// 리포트 관련 타입
// ============================================

export interface EnginePerformance {
  engine: string;
  citationRate: number;
  avgRank: number | null;
  totalTests: number;
  citations: number;
  change: number;
}

export interface BrandPerformance {
  brandId: string;
  brandName: string;
  citationRate: number;
  avgRank: number | null;
  totalTests: number;
  citations: number;
}

export interface ReportMetrics {
  citationRate: number;
  citationRateChange: number;
  shareOfVoice: number;
  shareOfVoiceChange: number;
  avgRank: number | null;
  avgRankChange: number;
  totalTests: number;
  totalTestsChange: number;
  enginePerformance: EnginePerformance[];
  brandPerformance: BrandPerformance[];
}

export interface AIAnalysis {
  summary: string;
  categoryAnalysis: Array<{ category: string; insight: string; citationRate: number }>;
  competitorAnalysis: string;
  actionItems: string[];
  highlights: string[];
}

export interface Report {
  id: string;
  title: string;
  type: 'weekly' | 'monthly';
  period: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  metrics: ReportMetrics;
  highlights: string[];
  topQueries: Array<{ query: string; citationRate: number }>;
  worstQueries: Array<{ query: string; citationRate: number }>;
  aiAnalysis?: AIAnalysis | null;
}

// ============================================
// 상수
// ============================================

export const AI_ENGINES = [
  { value: 'gpt', label: 'ChatGPT', color: 'teal' },
  { value: 'gemini', label: 'Gemini', color: 'blue' },
] as const;

export type AIEngine = (typeof AI_ENGINES)[number]['value'];

export const QUERY_CATEGORIES = [
  { value: '제품 추천', label: '제품 추천' },
  { value: '서비스 비교', label: '서비스 비교' },
  { value: '기술 문의', label: '기술 문의' },
  { value: '가격 문의', label: '가격 문의' },
  { value: '브랜드 평판', label: '브랜드 평판' },
  { value: '기타', label: '기타' },
] as const;

export type QueryCategory = (typeof QUERY_CATEGORIES)[number]['value'];
