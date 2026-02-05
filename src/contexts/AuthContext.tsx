import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// 사용자 타입
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

// 인증 컨텍스트 타입
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = 'http://localhost:3001';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 인증 상태 확인
  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 인증 상태 확인
  useEffect(() => {
    checkAuth();
  }, []);

  // 로그인
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || '로그인에 실패했습니다.' };
    } catch {
      return { success: false, message: '서버 연결에 실패했습니다.' };
    }
  };

  // 회원가입
  const register = async (email: string, password: string, name?: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      });
      const data = await response.json();

      if (data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || '회원가입에 실패했습니다.' };
    } catch {
      return { success: false, message: '서버 연결에 실패했습니다.' };
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
