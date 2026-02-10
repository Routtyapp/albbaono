import { apiGet, apiMutate } from './client';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  onboarding_step: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

const authRequestOptions = { redirectOnUnauthorized: false };

export async function getCurrentUser(): Promise<AuthResponse> {
  return apiGet<AuthResponse>('/api/auth/me', authRequestOptions);
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return apiMutate<AuthResponse>(
    '/api/auth/login',
    'POST',
    { email, password },
    authRequestOptions
  );
}

export async function registerUser(email: string, password: string, name?: string): Promise<AuthResponse> {
  return apiMutate<AuthResponse>(
    '/api/auth/register',
    'POST',
    { email, password, name },
    authRequestOptions
  );
}

export async function logoutUser(): Promise<AuthResponse> {
  return apiMutate<AuthResponse>('/api/auth/logout', 'POST', undefined, authRequestOptions);
}

export async function updateProfile(name: string): Promise<AuthResponse> {
  return apiMutate<AuthResponse>('/api/auth/profile', 'PATCH', { name });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
  return apiMutate<AuthResponse>('/api/auth/change-password', 'POST', { currentPassword, newPassword });
}

export async function deleteAccount(password: string): Promise<AuthResponse> {
  return apiMutate<AuthResponse>('/api/auth/account', 'DELETE', { password });
}
