import type { TestResult } from '../types';
import { apiGet } from './client';

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

export async function getResultsPaginated(page = 1, limit = 20, queryId?: string): Promise<PaginatedResults> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (queryId) params.set('queryId', queryId);
  return apiGet(`/api/results?${params}`);
}

export async function getResultsByQuery(queryId: string, page = 1, limit = 20): Promise<PaginatedResults> {
  return getResultsPaginated(page, limit, queryId);
}

export async function getResultById(id: string): Promise<TestResult | null> {
  try {
    return await apiGet(`/api/results/${id}`);
  } catch {
    return null;
  }
}
