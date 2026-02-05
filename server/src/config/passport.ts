import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import db from './db.js';
import type { User, SafeUser } from '../types/auth.js';

// Local Strategy 설정 (email/password 인증)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        // 이메일로 사용자 조회
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as User | undefined;

        if (!user) {
          return done(null, false, { message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        }

        // 계정 활성화 여부 확인
        if (!user.is_active) {
          return done(null, false, { message: '비활성화된 계정입니다.' });
        }

        // 비밀번호 검증
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        }

        // 마지막 로그인 시간 업데이트
        db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

        // 비밀번호 제외하고 반환
        const { password: _, ...safeUser } = user;
        return done(null, safeUser as SafeUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// 세션에 사용자 ID 저장
passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

// 세션에서 사용자 정보 복원
passport.deserializeUser((id: string, done) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;

    if (!user) {
      return done(null, false);
    }

    // 비밀번호 제외하고 반환
    const { password: _, ...safeUser } = user;
    done(null, safeUser as SafeUser);
  } catch (error) {
    done(error);
  }
});

export default passport;
