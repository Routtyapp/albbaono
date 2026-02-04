import type { MonitoredQuery, TestResult, Stats, Report, Brand } from '../data/mockData';

// === 브랜드 API ===

export async function getBrands(): Promise<{ brands: Brand[] }> {
  const response = await fetch('/api/brands');
  if (!response.ok) throw new Error('Failed to fetch brands');
  return response.json();
}

export async function addBrand(data: {
  name: string;
  competitors: string[];
}): Promise<Brand> {
  const response = await fetch('/api/brands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to add brand');
  return response.json();
}

export async function updateBrand(id: string, data: {
  name: string;
  competitors: string[];
}): Promise<void> {
  const response = await fetch(`/api/brands/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update brand');
}

export async function deleteBrand(id: string): Promise<void> {
  const response = await fetch(`/api/brands/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete brand');
}

// === 쿼리 API ===

export async function getQueries(): Promise<{ queries: MonitoredQuery[] }> {
  const response = await fetch('/api/queries');
  if (!response.ok) throw new Error('Failed to fetch queries');
  return response.json();
}

export async function addQuery(data: {
  query: string;
  category: string;
  frequency: string;
}): Promise<MonitoredQuery> {
  const response = await fetch('/api/queries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to add query');
  return response.json();
}

export async function deleteQuery(id: string): Promise<void> {
  const response = await fetch(`/api/queries/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete query');
}

export async function updateQueryBrands(id: string, brandIds: string[]): Promise<void> {
  const response = await fetch(`/api/queries/${id}/brands`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brandIds }),
  });
  if (!response.ok) throw new Error('Failed to update query brands');
}

// === 테스트 API ===

export interface TestQueryParams {
  query: string;
  queryId?: string;
  category?: string;
  engine?: 'gpt' | 'gemini';
}

export async function testQuery(params: TestQueryParams): Promise<TestResult> {
  const response = await fetch('/api/test-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to test query');
  }
  return response.json();
}

export interface PaginatedResults {
  results: TestResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export async function getResults(): Promise<{ results: TestResult[] }> {
  const response = await fetch('/api/results?page=0');
  if (!response.ok) throw new Error('Failed to fetch results');
  return response.json();
}

export async function getResultsPaginated(page = 1, limit = 20): Promise<PaginatedResults> {
  const response = await fetch(`/api/results?page=${page}&limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch results');
  return response.json();
}

export async function getResultById(id: string): Promise<TestResult | null> {
  const response = await fetch(`/api/results/${id}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch result');
  }
  return response.json();
}

// === 통계 API ===

export async function getStats(): Promise<Stats> {
  const response = await fetch('/api/stats');
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

// === 리포트 API ===

export async function getReports(): Promise<{ reports: Report[] }> {
  const response = await fetch('/api/reports');
  if (!response.ok) throw new Error('Failed to fetch reports');
  return response.json();
}

export async function generateReport(type: 'weekly' | 'monthly'): Promise<Report> {
  const response = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate report');
  }
  return response.json();
}

export async function deleteReport(id: string): Promise<void> {
  const response = await fetch(`/api/reports?id=${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete report');
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
  const response = await fetch('/api/geo-score/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze site');
  }
  return response.json();
}

export async function checkGeoScoreHealth(): Promise<{ status: string; timestamp: string }> {
  const response = await fetch('/api/geo-score/health');
  if (!response.ok) {
    throw new Error('GEO Score service unavailable');
  }
  return response.json();
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
    avgRank: number;
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
  const response = await fetch('/api/reports/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to generate PDF' }));
    throw new Error(error.error || 'Failed to generate PDF');
  }

  return response.blob();
}

export async function checkPdfServiceHealth(): Promise<{ status: string; timestamp: string }> {
  const response = await fetch('/api/reports/pdf/health');
  if (!response.ok) {
    throw new Error('PDF service unavailable');
  }
  return response.json();
}

// === GEO Score PDF API ===

export async function downloadGeoScorePdf(scoreData: GeoScoreResult): Promise<Blob> {
  const response = await fetch('/api/reports/geo-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scoreData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to generate PDF' }));
    throw new Error(error.error || 'Failed to generate PDF');
  }

  return response.blob();
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
  const response = await fetch('/api/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'patterns', brandId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to analyze' }));
    throw new Error(error.error || 'Failed to get AI insights');
  }

  return response.json();
}

export async function getSavedInsights(): Promise<{ insights: SavedInsight[] }> {
  const response = await fetch('/api/insights');
  if (!response.ok) throw new Error('Failed to fetch insights');
  return response.json();
}

export async function deleteInsight(id: string): Promise<void> {
  const response = await fetch(`/api/insights?id=${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete insight');
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
  const response = await fetch('/api/reports/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(insightsData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to generate PDF' }));
    throw new Error(error.error || 'Failed to generate PDF');
  }

  return response.blob();
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
  const response = await fetch('/api/scheduler');
  if (!response.ok) throw new Error('Failed to fetch scheduler status');
  return response.json();
}

export async function getSchedulerRunningStatus(): Promise<SchedulerStatus & { nextScheduled: SchedulerData['nextScheduled'] }> {
  const response = await fetch('/api/scheduler/status');
  if (!response.ok) throw new Error('Failed to fetch scheduler running status');
  return response.json();
}

export async function startScheduler(): Promise<{ success: boolean; status: SchedulerData }> {
  const response = await fetch('/api/scheduler/start', {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to start scheduler');
  return response.json();
}

export async function stopScheduler(): Promise<{ success: boolean; status: SchedulerData }> {
  const response = await fetch('/api/scheduler/stop', {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to stop scheduler');
  return response.json();
}

export async function runScheduleNow(type: 'daily' | 'weekly' | 'monthly'): Promise<{ success: boolean; history: SchedulerHistory }> {
  const response = await fetch('/api/scheduler/run-now', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to run schedule' }));
    throw new Error(error.error || 'Failed to run schedule');
  }
  return response.json();
}

export async function updateSchedulerConfig(config: Partial<SchedulerConfig>): Promise<{ success: boolean; config: SchedulerConfig }> {
  const response = await fetch('/api/scheduler/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error('Failed to update scheduler config');
  return response.json();
}
