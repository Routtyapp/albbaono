import type { Stats, TrendData } from '../types';
import { apiGet } from './client';

export async function getStats(): Promise<Stats> {
  return apiGet('/api/stats');
}

export async function getTrends(range: 'week' | 'month' | 'quarter' = 'month'): Promise<TrendData> {
  return apiGet(`/api/trends?range=${range}`);
}
