import { apiGet, apiMutate } from './client';

export interface Feed {
  id: string;
  title: string;
  content: string;
  category: string;
  isPublished: boolean;
  thumbnailUrl: string | null;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedListResponse {
  feeds: Feed[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FeedInput {
  title: string;
  content: string;
  category?: string;
  thumbnailUrl?: string;
  isFeatured?: boolean;
}

export function getFeeds(page = 1, category?: string, limit = 5): Promise<FeedListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (category && category !== 'all') params.set('category', category);
  return apiGet<FeedListResponse>(`/api/feeds?${params}`);
}

export function getFeed(id: string): Promise<Feed> {
  return apiGet<Feed>(`/api/feeds/${id}`);
}

export function createFeed(data: FeedInput): Promise<Feed> {
  return apiMutate<Feed>('/api/feeds', 'POST', data);
}

export function updateFeed(id: string, data: FeedInput): Promise<Feed> {
  return apiMutate<Feed>(`/api/feeds/${id}`, 'PUT', data);
}

export function deleteFeed(id: string): Promise<{ success: boolean }> {
  return apiMutate<{ success: boolean }>(`/api/feeds/${id}`, 'DELETE');
}
