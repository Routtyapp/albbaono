import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/auth';

vi.mock('../services/auth', () => ({
  getCurrentUser: vi.fn(),
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  registerUser: vi.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('loads authenticated user on mount', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      success: true,
      message: 'ok',
      user: {
        id: 'u1',
        email: 'a@b.com',
        name: 'Alex',
        role: 'user',
        is_active: 1,
        created_at: '',
        updated_at: '',
        last_login: null,
        onboarding_step: 3,
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.id).toBe('u1');
  });

  it('login success sets user and returns success message', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      success: false,
      message: 'not logged in',
    });
    vi.mocked(loginUser).mockResolvedValue({
      success: true,
      message: 'logged in',
      user: {
        id: 'u2',
        email: 'login@x.com',
        name: null,
        role: 'user',
        is_active: 1,
        created_at: '',
        updated_at: '',
        last_login: null,
        onboarding_step: 3,
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let response: { success: boolean; message: string } | undefined;
    await act(async () => {
      response = await result.current.login('login@x.com', 'pw');
    });

    expect(response).toEqual({ success: true, message: 'logged in' });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.id).toBe('u2');
  });

  it('login failure does not set user', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      success: false,
      message: 'not logged in',
    });
    vi.mocked(loginUser).mockResolvedValue({
      success: false,
      message: 'invalid credentials',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let response: { success: boolean; message: string } | undefined;
    await act(async () => {
      response = await result.current.login('bad@x.com', 'bad');
    });

    expect(response).toEqual({ success: false, message: 'invalid credentials' });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('logout clears user state', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      success: true,
      message: 'ok',
      user: {
        id: 'u1',
        email: 'a@b.com',
        name: 'Alex',
        role: 'user',
        is_active: 1,
        created_at: '',
        updated_at: '',
        last_login: null,
        onboarding_step: 3,
      },
    });
    vi.mocked(logoutUser).mockResolvedValue({
      success: true,
      message: 'logged out',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('register proxies backend response message', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      success: false,
      message: 'not logged in',
    });
    vi.mocked(registerUser).mockResolvedValue({
      success: true,
      message: 'registered',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let response: { success: boolean; message: string } | undefined;
    await act(async () => {
      response = await result.current.register('new@x.com', 'pw123', 'New');
    });

    expect(response).toEqual({ success: true, message: 'registered' });
  });
});
