const API_BASE = import.meta.env.VITE_API_URL || '';

const fetchOptions: RequestInit = {
  credentials: 'include',
};

export interface RequestOptions {
  redirectOnUnauthorized?: boolean;
}

interface ApiErrorPayload {
  error?: string;
  message?: string;
  code?: string;
}

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  const payload = await response.json().catch(() => null) as ApiErrorPayload | null;
  return payload?.message || payload?.error || fallback;
}

export async function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { redirectOnUnauthorized = true } = options;
  const response = await fetch(`${API_BASE}${path}`, fetchOptions);
  if (!response.ok) {
    if (response.status === 401 && redirectOnUnauthorized) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    throw new Error(await getErrorMessage(response, `Failed to fetch ${path}`));
  }
  return response.json();
}

export async function apiMutate<T>(
  path: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const { redirectOnUnauthorized = true } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    if (response.status === 401 && redirectOnUnauthorized) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    throw new Error(await getErrorMessage(response, `Failed to ${method} ${path}`));
  }
  return response.json();
}

export async function apiBlob(path: string, body: unknown, options: RequestOptions = {}): Promise<Blob> {
  const { redirectOnUnauthorized = true } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    if (response.status === 401 && redirectOnUnauthorized) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    throw new Error(await getErrorMessage(response, 'Failed to generate PDF'));
  }
  return response.blob();
}
