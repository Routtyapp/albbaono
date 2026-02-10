// User 타입 정의
export interface User {
  id: string;
  email: string;
  password: string;
  name: string | null;
  role: string;
  is_active: number; // SQLite boolean
  created_at: string;
  updated_at: string;
  last_login: string | null;
  onboarding_step: number;
}

// Express 세션에 사용자 정보 확장
declare module 'express-session' {
  interface SessionData {
    passport: {
      user: string; // user id
    };
  }
}

// Express Request에 user 타입 확장
declare global {
  namespace Express {
    interface User {
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
  }
}

// 회원가입 요청 DTO
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

// 로그인 요청 DTO
export interface LoginRequest {
  email: string;
  password: string;
}

// 비밀번호 변경 요청 DTO
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// 인증 응답 (비밀번호 제외)
export type SafeUser = Omit<User, 'password'>;

// API 응답 타입
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: SafeUser;
}
