import { getDatabase } from '../index';

// 타입 정의
export interface SchedulerConfig {
  enabled: boolean;
  dailyRunTime: string;
  weeklyRunDay: number;
  weeklyRunTime: string;
  monthlyRunDay: number;
  monthlyRunTime: string;
  defaultEngine: 'gpt' | 'gemini';
  concurrentQueries: number;
}

export interface SchedulerHistory {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  startedAt: string;
  completedAt: string;
  queriesProcessed: number;
  success: number;
  failed: number;
}

export interface SchedulerStatus {
  isRunning: boolean;
  currentTask: string | null;
  lastCompletedAt: string | null;
}

interface ConfigRow {
  id: number;
  enabled: number;
  daily_run_time: string;
  weekly_run_day: number;
  weekly_run_time: string;
  monthly_run_day: number;
  monthly_run_time: string;
  default_engine: string;
  concurrent_queries: number;
}

interface HistoryRow {
  id: string;
  type: string;
  started_at: string;
  completed_at: string;
  queries_processed: number;
  success: number;
  failed: number;
}

// 상태 관리 (메모리)
let schedulerStatus: SchedulerStatus = {
  isRunning: false,
  currentTask: null,
  lastCompletedAt: null,
};

let nextScheduled = {
  daily: '',
  weekly: '',
  monthly: '',
};

/**
 * 스케줄러 설정 조회
 */
export function getConfig(): SchedulerConfig {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT id, enabled, daily_run_time, weekly_run_day, weekly_run_time, monthly_run_day, monthly_run_time, default_engine, concurrent_queries
    FROM scheduler_config
    WHERE id = 1
  `).get() as ConfigRow | undefined;

  if (!row) {
    // 기본 설정 반환
    return {
      enabled: false,
      dailyRunTime: '09:00',
      weeklyRunDay: 1,
      weeklyRunTime: '09:00',
      monthlyRunDay: 1,
      monthlyRunTime: '09:00',
      defaultEngine: 'gpt',
      concurrentQueries: 1,
    };
  }

  return {
    enabled: row.enabled === 1,
    dailyRunTime: row.daily_run_time,
    weeklyRunDay: row.weekly_run_day,
    weeklyRunTime: row.weekly_run_time,
    monthlyRunDay: row.monthly_run_day,
    monthlyRunTime: row.monthly_run_time,
    defaultEngine: row.default_engine as 'gpt' | 'gemini',
    concurrentQueries: row.concurrent_queries,
  };
}

/**
 * 스케줄러 설정 업데이트
 */
export function updateConfig(data: Partial<SchedulerConfig>): SchedulerConfig {
  const db = getDatabase();
  const current = getConfig();

  const newConfig = {
    ...current,
    ...data,
  };

  db.prepare(`
    UPDATE scheduler_config
    SET enabled = ?, daily_run_time = ?, weekly_run_day = ?, weekly_run_time = ?, monthly_run_day = ?, monthly_run_time = ?, default_engine = ?, concurrent_queries = ?
    WHERE id = 1
  `).run(
    newConfig.enabled ? 1 : 0,
    newConfig.dailyRunTime,
    newConfig.weeklyRunDay,
    newConfig.weeklyRunTime,
    newConfig.monthlyRunDay,
    newConfig.monthlyRunTime,
    newConfig.defaultEngine,
    newConfig.concurrentQueries
  );

  return newConfig;
}

/**
 * 스케줄러 히스토리 조회
 */
export function getHistory(limit = 100): SchedulerHistory[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT id, type, started_at, completed_at, queries_processed, success, failed
    FROM scheduler_history
    ORDER BY started_at DESC
    LIMIT ?
  `).all(limit) as HistoryRow[];

  return rows.map(row => ({
    id: row.id,
    type: row.type as 'daily' | 'weekly' | 'monthly',
    startedAt: row.started_at,
    completedAt: row.completed_at,
    queriesProcessed: row.queries_processed,
    success: row.success,
    failed: row.failed,
  }));
}

/**
 * 히스토리 추가
 */
export function addHistory(data: {
  type: 'daily' | 'weekly' | 'monthly';
  startedAt: string;
  completedAt: string;
  queriesProcessed: number;
  success: number;
  failed: number;
}): SchedulerHistory {
  const db = getDatabase();
  const id = String(Date.now());

  db.prepare(`
    INSERT INTO scheduler_history (id, type, started_at, completed_at, queries_processed, success, failed)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.type,
    data.startedAt,
    data.completedAt,
    data.queriesProcessed,
    data.success,
    data.failed
  );

  return {
    id,
    ...data,
  };
}

/**
 * 스케줄러 상태 조회
 */
export function getStatus(): SchedulerStatus {
  return { ...schedulerStatus };
}

/**
 * 스케줄러 상태 업데이트
 */
export function updateStatus(data: Partial<SchedulerStatus>): void {
  schedulerStatus = {
    ...schedulerStatus,
    ...data,
  };
}

/**
 * 다음 예정 시간 조회
 */
export function getNextScheduled(): { daily: string; weekly: string; monthly: string } {
  return { ...nextScheduled };
}

/**
 * 다음 예정 시간 업데이트
 */
export function updateNextScheduled(data: Partial<{ daily: string; weekly: string; monthly: string }>): void {
  nextScheduled = {
    ...nextScheduled,
    ...data,
  };
}

/**
 * 스케줄러 전체 데이터 (API 응답 형식)
 */
export function getSchedulerData(): {
  config: SchedulerConfig;
  status: SchedulerStatus;
  history: SchedulerHistory[];
  nextScheduled: { daily: string; weekly: string; monthly: string };
} {
  return {
    config: getConfig(),
    status: getStatus(),
    history: getHistory(),
    nextScheduled: getNextScheduled(),
  };
}

/**
 * 마지막 완료 시간 업데이트
 */
export function updateLastCompletedAt(timestamp: string): void {
  schedulerStatus.lastCompletedAt = timestamp;
}

/**
 * 오래된 히스토리 정리
 */
export function cleanupOldHistory(maxCount = 100): void {
  const db = getDatabase();

  const countResult = db.prepare('SELECT COUNT(*) as count FROM scheduler_history').get() as { count: number };

  if (countResult.count > maxCount) {
    db.prepare(`
      DELETE FROM scheduler_history
      WHERE id NOT IN (
        SELECT id FROM scheduler_history
        ORDER BY started_at DESC
        LIMIT ?
      )
    `).run(maxCount);
  }
}
