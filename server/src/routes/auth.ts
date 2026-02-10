import { Router } from 'express';
import passport from '../config/passport.js';
import { isAuthenticated } from '../middleware/auth.js';
import { registerUser, changePassword, updateProfile, deleteAccount } from '../services/authService.js';
import type { RegisterRequest, ChangePasswordRequest, AuthResponse } from '../types/auth.js';

const router = Router();

/**
 * POST /api/auth/register
 * 회원가입
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body as RegisterRequest;

    // 유효성 검사
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호는 필수입니다.',
      } as AuthResponse);
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '올바른 이메일 형식이 아닙니다.',
      } as AuthResponse);
    }

    // 비밀번호 최소 길이 검사
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '비밀번호는 최소 6자 이상이어야 합니다.',
      } as AuthResponse);
    }

    const user = await registerUser({ email, password, name });

    // 가입 후 자동 로그인 — 세션 생성
    await new Promise<void>((resolve, reject) => {
      req.logIn(user as any, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user,
    } as AuthResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : '회원가입에 실패했습니다.';
    res.status(400).json({
      success: false,
      message,
    } as AuthResponse);
  }
});

/**
 * POST /api/auth/login
 * 로그인
 */
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err: Error | null, user: Express.User | false, info: { message: string }) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({
        success: false,
        message: '로그인 처리 중 오류가 발생했습니다.',
      } as AuthResponse);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || '로그인에 실패했습니다.',
      } as AuthResponse);
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.status(500).json({
          success: false,
          message: '세션 생성에 실패했습니다.',
        } as AuthResponse);
      }

      res.json({
        success: true,
        message: '로그인 성공',
        user,
      } as AuthResponse);
    });
  })(req, res, next);
});

/**
 * POST /api/auth/logout
 * 로그아웃
 */
router.post('/logout', isAuthenticated, (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '로그아웃에 실패했습니다.',
      } as AuthResponse);
    }

    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        return res.status(500).json({
          success: false,
          message: '세션 삭제에 실패했습니다.',
        } as AuthResponse);
      }

      res.clearCookie('connect.sid');
      res.json({
        success: true,
        message: '로그아웃 되었습니다.',
      } as AuthResponse);
    });
  });
});

/**
 * GET /api/auth/me
 * 현재 로그인한 사용자 정보
 */
router.get('/me', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.json({
      success: true,
      message: '사용자 정보 조회 성공',
      user: req.user,
    } as AuthResponse);
  } else {
    res.json({
      success: false,
      message: '로그인되지 않았습니다.',
    } as AuthResponse);
  }
});

/**
 * PATCH /api/auth/profile
 * 프로필 수정 (이름 변경)
 */
router.patch('/profile', isAuthenticated, (req, res) => {
  try {
    const { name } = req.body as { name: string };

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: '이름을 입력해주세요.',
      } as AuthResponse);
    }

    const user = updateProfile(req.user!.id, name.trim());

    res.json({
      success: true,
      message: '프로필이 수정되었습니다.',
      user,
    } as AuthResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : '프로필 수정에 실패했습니다.';
    res.status(400).json({
      success: false,
      message,
    } as AuthResponse);
  }
});

/**
 * POST /api/auth/change-password
 * 비밀번호 변경
 */
router.post('/change-password', isAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body as ChangePasswordRequest;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호를 입력해주세요.',
      } as AuthResponse);
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '새 비밀번호는 최소 6자 이상이어야 합니다.',
      } as AuthResponse);
    }

    await changePassword(req.user!.id, currentPassword, newPassword);

    res.json({
      success: true,
      message: '비밀번호가 변경되었습니다.',
    } as AuthResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.';
    res.status(400).json({
      success: false,
      message,
    } as AuthResponse);
  }
});

/**
 * DELETE /api/auth/account
 * 계정 삭제 (회원 탈퇴)
 */
router.delete('/account', isAuthenticated, async (req, res) => {
  try {
    const { password } = req.body as { password: string };

    if (!password) {
      return res.status(400).json({
        success: false,
        message: '비밀번호를 입력해주세요.',
      } as AuthResponse);
    }

    const userId = req.user!.id;

    await deleteAccount(userId, password);

    req.logout((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '계정은 삭제되었으나 세션 정리에 실패했습니다.',
        } as AuthResponse);
      }

      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({
          success: true,
          message: '계정이 삭제되었습니다.',
        } as AuthResponse);
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '계정 삭제에 실패했습니다.';
    res.status(400).json({
      success: false,
      message,
    } as AuthResponse);
  }
});

export default router;
