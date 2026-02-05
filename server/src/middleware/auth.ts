import type { Request, Response, NextFunction } from 'express';

/**
 * 인증 필수 미들웨어
 * 로그인되지 않은 사용자는 401 에러 반환
 */
export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({
    success: false,
    message: '로그인이 필요합니다.',
  });
};

/**
 * 관리자 권한 필수 미들웨어
 * isAuthenticated 미들웨어 이후에 사용
 */
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role === 'admin') {
    return next();
  }
  res.status(403).json({
    success: false,
    message: '관리자 권한이 필요합니다.',
  });
};
