import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type User,
} from '../services/auth';

interface AuthResult {
  success: boolean;
  message: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, name?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const data = await getCurrentUser();
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

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const data = await loginUser(email, password);

      if (data.success && data.user) {
        setUser(data.user);
        return { success: true, message: data.message };
      }

      return { success: false, message: data.message || '로그인에 실패했습니다.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : '서버 연결에 실패했습니다.';
      return { success: false, message };
    }
  };

  const register = async (email: string, password: string, name?: string): Promise<AuthResult> => {
    try {
      const data = await registerUser(email, password, name);

      if (data.success && data.user) {
        // 서버에서 자동 로그인(세션 생성)이 되었으므로 바로 user 설정
        setUser(data.user);
        return { success: true, message: data.message };
      }

      return { success: false, message: data.message || '회원가입에 실패했습니다.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : '서버 연결에 실패했습니다.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
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
