import { Router, Request, Response } from 'express';
import { scheduler } from '../services/scheduler.js';

const router = Router();

// GET /api/scheduler - 전체 상태 조회
router.get('/', (_req: Request, res: Response) => {
  try {
    const status = scheduler.getStatus();
    res.json(status);
  } catch (error) {
    console.error('[Scheduler API] Get status error:', error);
    res.status(500).json({ error: 'Failed to get scheduler status' });
  }
});

// GET /api/scheduler/status - 실행 상태만 조회
router.get('/status', (_req: Request, res: Response) => {
  try {
    const status = scheduler.getRunningStatus();
    res.json(status);
  } catch (error) {
    console.error('[Scheduler API] Get running status error:', error);
    res.status(500).json({ error: 'Failed to get scheduler running status' });
  }
});

// POST /api/scheduler/start - 스케줄러 시작
router.post('/start', (_req: Request, res: Response) => {
  try {
    scheduler.start(true); // 수동 시작
    const status = scheduler.getStatus();
    res.json({ success: true, status });
  } catch (error) {
    console.error('[Scheduler API] Start error:', error);
    res.status(500).json({ error: 'Failed to start scheduler' });
  }
});

// POST /api/scheduler/stop - 스케줄러 중지
router.post('/stop', (_req: Request, res: Response) => {
  try {
    scheduler.stop();
    const status = scheduler.getStatus();
    res.json({ success: true, status });
  } catch (error) {
    console.error('[Scheduler API] Stop error:', error);
    res.status(500).json({ error: 'Failed to stop scheduler' });
  }
});

// POST /api/scheduler/run-now - 즉시 실행
router.post('/run-now', async (req: Request, res: Response) => {
  try {
    const { type } = req.body as { type?: 'daily' | 'weekly' | 'monthly' };

    if (!type || !['daily', 'weekly', 'monthly'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be daily, weekly, or monthly' });
    }

    const history = await scheduler.runNow(type);
    res.json({ success: true, history });
  } catch (error) {
    console.error('[Scheduler API] Run now error:', error);
    const message = error instanceof Error ? error.message : 'Failed to run schedule';
    res.status(500).json({ error: message });
  }
});

// PUT /api/scheduler/config - 설정 변경
router.put('/config', (req: Request, res: Response) => {
  try {
    const config = req.body;
    const updatedConfig = scheduler.updateConfig(config);
    res.json({ success: true, config: updatedConfig });
  } catch (error) {
    console.error('[Scheduler API] Update config error:', error);
    res.status(500).json({ error: 'Failed to update scheduler config' });
  }
});

export default router;
