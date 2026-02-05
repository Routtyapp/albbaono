import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { config } from 'dotenv';
import passport from './config/passport.js';
import geoScoreRouter from './routes/geoScore.js';
import reportsRouter from './routes/reports.js';
import schedulerRouter from './routes/scheduler.js';
import authRouter from './routes/auth.js';
import dataRouter from './routes/data.js';
import { isAuthenticated } from './middleware/auth.js';
import { closeBrowser } from './services/crawler.js';
import { scheduler } from './services/scheduler.js';

// 환경 변수 로드
config();

const app = express();
const PORT = process.env.PORT || 3001;

// 세션 시크릿 확인
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.error('SESSION_SECRET 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

// CORS 설정 (credentials 허용)
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// 세션 미들웨어
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    sameSite: 'lax',
  },
}));

// Passport 미들웨어
app.use(passport.initialize());
app.use(passport.session());

// 인증 라우터 (인증 불필요)
app.use('/api/auth', authRouter);

// 데이터 라우터 (인증 필요, 자체 인증 미들웨어 포함)
app.use('/api', dataRouter);

// 보호된 라우터 (인증 필요)
app.use('/api/geo-score', isAuthenticated, geoScoreRouter);
app.use('/api/reports', isAuthenticated, reportsRouter);
app.use('/api/scheduler', isAuthenticated, schedulerRouter);

// 기본 라우트
app.get('/', (_req, res) => {
  res.json({
    name: 'GEO Tracker API',
    version: '1.0.0',
    endpoints: {
      // 인증 API
      'POST /api/auth/register': '회원가입',
      'POST /api/auth/login': '로그인',
      'POST /api/auth/logout': '로그아웃',
      'GET /api/auth/me': '현재 사용자 정보',
      // GEO Score API (인증 필요)
      'POST /api/geo-score/analyze': 'GEO 점수 분석',
      'GET /api/geo-score/health': '헬스 체크',
      // 리포트 API (인증 필요)
      'POST /api/reports/pdf': 'PDF 리포트 생성',
      'POST /api/reports/geo-score': 'GEO Score PDF 리포트 생성',
      'POST /api/reports/insights': 'AI 인사이트 PDF 리포트 생성',
      'GET /api/reports/pdf/health': '리포트 서비스 헬스 체크',
      // 스케줄러 API (인증 필요)
      'GET /api/scheduler': '스케줄러 상태 조회',
      'POST /api/scheduler/start': '스케줄러 시작',
      'POST /api/scheduler/stop': '스케줄러 중지',
      'POST /api/scheduler/run-now': '즉시 실행',
      'PUT /api/scheduler/config': '스케줄러 설정 변경',
    },
  });
});

// 서버 시작
const server = app.listen(PORT, () => {
  console.log(`GEO Tracker API 서버 시작: http://localhost:${PORT}`);

  // 스케줄러 초기화 및 시작
  try {
    scheduler.start();
    console.log('스케줄러 초기화 완료');
  } catch (error) {
    console.error('스케줄러 초기화 실패:', error);
  }
});

// 종료 처리
const shutdown = async () => {
  console.log('\n서버 종료 중...');
  scheduler.stop();
  await closeBrowser();
  server.close(() => {
    console.log('서버 종료 완료');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
