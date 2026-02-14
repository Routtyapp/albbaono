import { apiGet, apiMutate } from './client';

export type SiteType = 'general' | 'ecommerce' | 'blog' | 'corporate' | 'portfolio';

export interface GeoScoreRequest {
  url: string;
  options?: {
    includeSubpages?: boolean;
    maxSubpages?: number;
    siteType?: SiteType;
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
