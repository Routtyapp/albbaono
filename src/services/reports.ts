import type { Report } from '../types';
import { apiBlob, apiGet, apiMutate } from './client';
import type { GeoScoreResult } from './geoScore';
import type { InsightsPdfData } from './insights';

export async function getReports(): Promise<{ reports: Report[] }> {
  return apiGet('/api/reports');
}

export async function generateReport(type: 'weekly' | 'monthly'): Promise<Report> {
  return apiMutate('/api/reports', 'POST', { type });
}

export async function deleteReport(id: string): Promise<void> {
  return apiMutate(`/api/reports?id=${id}`, 'DELETE');
}

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

export async function downloadGeoScorePdf(scoreData: GeoScoreResult): Promise<Blob> {
  return apiBlob('/api/reports/geo-score', scoreData);
}

export async function downloadInsightsPdf(insightsData: InsightsPdfData): Promise<Blob> {
  return apiBlob('/api/reports/insights', insightsData);
}
