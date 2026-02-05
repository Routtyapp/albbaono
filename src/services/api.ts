import type { MonitoredQuery, TestResult, Stats, Report, Brand } from '../types';

// API Base URL
const API_BASE = 'http://localhost:3001';

// 공통 fetch 옵션 (credentials 포함)
const fetchOptions: RequestInit = {
  credentials: 'include',
};

// GET 요청 헬퍼
async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, fetchOptions);
  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    throw new Error(`Failed to fetch ${path}`);
  }
  return response.json();
}

// POST/PUT/DELETE 요청 헬퍼
async function apiMutate<T>(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    const error = await response.json().catch(() => ({ error: `Failed to ${method} ${path}` }));
    throw new Error(error.error || `Failed to ${method} ${path}`);
  }
  return response.json();
}

// Blob 응답 헬퍼 (PDF 다운로드용)
async function apiBlob(path: string, body: unknown): Promise<Blob> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    const error = await response.json().catch(() => ({ error: 'Failed to generate PDF' }));
    throw new Error(error.error || 'Failed to generate PDF');
  }
  return response.blob();
}

// === 브랜드 API ===

export async function getBrands(): Promise<{ brands: Brand[] }> {
  return apiGet('/api/brands');
}

export async function addBrand(data: {
  name: string;
  competitors: string[];
}): Promise<Brand> {
  return apiMutate('/api/brands', 'POST', data);
}

export async function updateBrand(id: string, data: {
  name: string;
  competitors: string[];
}): Promise<void> {
  return apiMutate(`/api/brands/${id}`, 'PUT', data);
}

export async function deleteBrand(id: string): Promise<void> {
  return apiMutate(`/api/brands/${id}`, 'DELETE');
}

// === 쿼리 API ===

export async function getQueries(): Promise<{ queries: MonitoredQuery[] }> {
  return apiGet('/api/queries');
}

export async function addQuery(data: {
  query: string;
  category: string;
  frequency: string;
}): Promise<MonitoredQuery> {
  return apiMutate('/api/queries', 'POST', data);
}

export async function deleteQuery(id: string): Promise<void> {
  return apiMutate(`/api/queries/${id}`, 'DELETE');
}

export async function updateQueryBrands(id: string, brandIds: string[]): Promise<void> {
  return apiMutate(`/api/queries/${id}/brands`, 'PUT', { brandIds });
}

// === 테스트 API ===

export interface TestQueryParams {
  query: string;
  queryId?: string;
  category?: string;
  engine?: 'gpt' | 'gemini';
}

export async function testQuery(params: TestQueryParams): Promise<TestResult> {
  return apiMutate('/api/test-query', 'POST', params);
}

export interface PaginatedResults {
  results: TestResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export async function getResults(): Promise<{ results: TestResult[] }> {
  return apiGet('/api/results?page=0');
}

export async function getResultsPaginated(page = 1, limit = 20): Promise<PaginatedResults> {
  return apiGet(`/api/results?page=${page}&limit=${limit}`);
}

export async function getResultById(id: string): Promise<TestResult | null> {
  try {
    return await apiGet(`/api/results/${id}`);
  } catch {
    return null;
  }
}

// === 통계 API ===

export async function getStats(): Promise<Stats> {
  return apiGet('/api/stats');
}

// === 리포트 API ===

export async function getReports(): Promise<{ reports: Report[] }> {
  return apiGet('/api/reports');
}

export async function generateReport(type: 'weekly' | 'monthly'): Promise<Report> {
  return apiMutate('/api/reports', 'POST', { type });
}

export async function deleteReport(id: string): Promise<void> {
  return apiMutate(`/api/reports?id=${id}`, 'DELETE');
}

// === GEO Score API ===

export interface GeoScoreRequest {
  url: string;
  options?: {
    includeSubpages?: boolean;
    maxSubpages?: number;
  };
}

export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

export interface ScoreItem {
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  detail: string;
}

export interface CategoryScore {
  score: number;
  maxScore: number;
  percentage: number;
  items: ScoreItem[];
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
  category: string;
  issue: string;
  suggestion: string;
  impact: string;
}

export interface GeoScoreResult {
  url: string;
  analyzedAt: string;
  totalScore: number;
  grade: Grade;
  categories: {
    structure: CategoryScore;
    schema: CategoryScore;
    url: CategoryScore;
    meta: CategoryScore;
    content: CategoryScore;
  };
  pages: PageAnalysis[];
  recommendations: Recommendation[];
}

export async function analyzeGeoScore(request: GeoScoreRequest): Promise<GeoScoreResult> {
  return apiMutate('/api/geo-score/analyze', 'POST', request);
}

export async function checkGeoScoreHealth(): Promise<{ status: string; timestamp: string }> {
  return apiGet('/api/geo-score/health');
}

// === PDF 리포트 API ===

export interface PdfReportData {
  title: string;
  type: 'weekly' | 'monthly';
  period: string;
  generatedAt?: string;
  metrics: {
    citationRate: number;
    citationRateChange: number;
    shareOfVoice: number;
    shareOfVoiceChange: number;
    avgRank: number | null;
    avgRankChange: number;
    totalTests: number;
    totalTestsChange: number;
  };
  enginePerformance: Array<{
    engine: string;
    citationRate: number;
    avgRank: number | null;
    totalTests: number;
    citations: number;
    change: number;
  }>;
  highlights: string[];
  topQueries: Array<{ query: string; citationRate: number }>;
  worstQueries: Array<{ query: string; citationRate: number }>;
  trend?: {
    dates: string[];
    citationRates: number[];
  };
  categoryDistribution?: {
    categories: string[];
    values: number[];
  };
}

export async function downloadReportPdf(reportData: PdfReportData): Promise<Blob> {
  return apiBlob('/api/reports/pdf', reportData);
}

export async function checkPdfServiceHealth(): Promise<{ status: string; timestamp: string }> {
  return apiGet('/api/reports/pdf/health');
}

// === GEO Score PDF API ===

export async function downloadGeoScorePdf(scoreData: GeoScoreResult): Promise<Blob> {
  return apiBlob('/api/reports/geo-score', scoreData);
}

// === AI 인사이트 API ===

export interface KeywordInsight {
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

export interface AIInsightsResult {
  commonKeywords: KeywordInsight[];
  categoryInsights: CategoryInsight[];
  citationPatterns: CitationPatterns;
  actionableInsights: ActionableInsight[];
  contentGaps: ContentGap[];
  metadata: {
    analyzedAt: string;
    totalResponses: number;
    citedResponses: number;
    categories: string[];
  };
  error?: string;
}

export interface SavedInsight extends AIInsightsResult {
  id: string;
  brandId: string;
  brandName: string;
}

export async function getAIInsights(brandId: string): Promise<SavedInsight> {
  return apiMutate('/api/insights', 'POST', { type: 'patterns', brandId });
}

export async function getSavedInsights(): Promise<{ insights: SavedInsight[] }> {
  return apiGet('/api/insights');
}

export async function deleteInsight(id: string): Promise<void> {
  return apiMutate(`/api/insights?id=${id}`, 'DELETE');
}

// === AI 인사이트 PDF API ===

export interface InsightsPdfData {
  id: string;
  brandId: string;
  brandName: string;
  commonKeywords: Array<{
    keyword: string;
    count: number;
    importance: 'high' | 'medium' | 'low';
    description: string;
  }>;
  categoryInsights: Array<{
    category: string;
    keyFactors: string[];
    recommendation: string;
  }>;
  citationPatterns: {
    citedPatterns: string[];
    uncitedPatterns: string[];
  };
  actionableInsights: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionItems: string[];
  }>;
  contentGaps: Array<{
    area: string;
    currentState: string;
    recommendation: string;
  }>;
  metadata: {
    analyzedAt: string;
    totalResponses: number;
    citedResponses: number;
    categories: string[];
  };
}

export async function downloadInsightsPdf(insightsData: InsightsPdfData): Promise<Blob> {
  return apiBlob('/api/reports/insights', insightsData);
}

// === 스케줄러 API ===

export interface SchedulerConfig {
  enabled: boolean;
  dailyRunTime: string;
  weeklyRunDay: number;
  weeklyRunTime: string;
  monthlyRunDay: number;
  monthlyRunTime: string;
  defaultEngine: 'gpt' | 'gemini';
  concurrentQueries: number;
}

export interface SchedulerStatus {
  isRunning: boolean;
  currentTask: string | null;
  lastCompletedAt: string | null;
}

export interface SchedulerHistory {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  startedAt: string;
  completedAt: string;
  queriesProcessed: number;
  success: number;
  failed: number;
}

export interface SchedulerData {
  config: SchedulerConfig;
  status: SchedulerStatus;
  history: SchedulerHistory[];
  nextScheduled: {
    daily: string | null;
    weekly: string | null;
    monthly: string | null;
  };
}

export async function getSchedulerStatus(): Promise<SchedulerData> {
  return apiGet('/api/scheduler');
}

export async function getSchedulerRunningStatus(): Promise<SchedulerStatus & { nextScheduled: SchedulerData['nextScheduled'] }> {
  return apiGet('/api/scheduler/status');
}

export async function startScheduler(): Promise<{ success: boolean; status: SchedulerData }> {
  return apiMutate('/api/scheduler/start', 'POST');
}

export async function stopScheduler(): Promise<{ success: boolean; status: SchedulerData }> {
  return apiMutate('/api/scheduler/stop', 'POST');
}

export async function runScheduleNow(type: 'daily' | 'weekly' | 'monthly'): Promise<{ success: boolean; history: SchedulerHistory }> {
  return apiMutate('/api/scheduler/run-now', 'POST', { type });
}

export async function updateSchedulerConfig(config: Partial<SchedulerConfig>): Promise<{ success: boolean; config: SchedulerConfig }> {
  return apiMutate('/api/scheduler/config', 'PUT', config);
}

// === GEO Score 히스토리 API ===

export interface GeoScoreHistoryItem extends GeoScoreResult {
  id: string;
  savedAt: string;
}

export async function getGeoScoreHistory(): Promise<{ scores: GeoScoreHistoryItem[] }> {
  return apiGet('/api/geo-scores');
}

export async function saveGeoScoreHistory(data: GeoScoreResult): Promise<GeoScoreHistoryItem> {
  return apiMutate('/api/geo-scores', 'POST', data);
}

export async function deleteGeoScoreHistoryItem(id: string): Promise<void> {
  return apiMutate(`/api/geo-scores/${id}`, 'DELETE');
}

export async function clearGeoScoreHistory(): Promise<void> {
  return apiMutate('/api/geo-scores', 'DELETE');
}
