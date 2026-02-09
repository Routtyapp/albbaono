import { describe, expect, it, vi, afterEach } from 'vitest';
import { getCurrentUser, loginUser, logoutUser, registerUser } from './auth';

describe('auth service', () => {
  const originalFetch = global.fetch;
  const originalHref = window.location.href;

  afterEach(() => {
    global.fetch = originalFetch;
    window.location.href = originalHref;
    vi.restoreAllMocks();
  });

  it('calls /api/auth/me with credentials include', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'ok', user: { id: 'u1' } }),
    } as Response);

    await getCurrentUser();

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('does not redirect on 401 for login flow', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' }),
    } as Response);

    await expect(loginUser('a@b.com', 'badpass')).rejects.toThrow('Invalid credentials');
    expect(window.location.href).toBe(originalHref);
  });

  it('sends expected payloads for register and logout', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'registered' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'logout' }),
      } as Response);

    await registerUser('x@y.com', 'password', 'name');
    await logoutUser();

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      '/api/auth/register',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ email: 'x@y.com', password: 'password', name: 'name' }),
      })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      '/api/auth/logout',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      })
    );
  });
});
