import type { MonitoredQuery, TestResult } from '../types';
import { apiGet, apiMutate } from './client';

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

export async function updateQueryActive(id: string, isActive: boolean): Promise<{ success: boolean; id: string; isActive: boolean }> {
  return apiMutate(`/api/queries/${id}/active`, 'PATCH', { isActive });
}

export async function updateQueryFrequency(id: string, frequency: 'daily' | 'weekly' | 'monthly'): Promise<{ success: boolean; id: string; frequency: string }> {
  return apiMutate(`/api/queries/${id}/frequency`, 'PATCH', { frequency });
}

export interface TestQueryParams {
  query: string;
  queryId?: string;
  category?: string;
  engine?: 'gpt' | 'gemini';
}

export async function testQuery(params: TestQueryParams): Promise<TestResult> {
  return apiMutate('/api/test-query', 'POST', params);
}
