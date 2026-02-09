import { apiGet, apiMutate } from './client';

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
