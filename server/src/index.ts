import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import geoScoreRouter from './routes/geoScore.js';
import reportsRouter from './routes/reports.js';
import schedulerRouter from './routes/scheduler.js';
import { closeBrowser } from './services/crawler.js';
import { scheduler } from './services/scheduler.js';

// 환경 변수 로드
config();

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 라우터
app.use('/api/geo-score', geoScoreRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/scheduler', schedulerRouter);

// 기본 라우트
app.get('/', (_req, res) => {
  res.json({
    name: 'GEO Tracker API',
    version: '1.0.0',
    endpoints: {
      'POST /api/geo-score/analyze': 'GEO 점수 분석',
      'GET /api/geo-score/health': '헬스 체크',
      'POST /api/reports/pdf': 'PDF 리포트 생성',
      'POST /api/reports/geo-score': 'GEO Score PDF 리포트 생성',
      'POST /api/reports/insights': 'AI 인사이트 PDF 리포트 생성',
      'GET /api/reports/pdf/health': '리포트 서비스 헬스 체크',
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
  console.log(`🚀 GEO Tracker API 서버 시작: http://localhost:${PORT}`);

  // 스케줄러 초기화 및 시작
  try {
    scheduler.start();
    console.log('📅 스케줄러 초기화 완료');
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
