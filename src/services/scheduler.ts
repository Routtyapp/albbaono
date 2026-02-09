import { apiGet, apiMutate } from './client';

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

export interface SchedulerStatus {
  isRunning: boolean;
  currentTask: string | null;
  lastCompletedAt: string | null;
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

export interface SchedulerData {
  config: SchedulerConfig;
  status: SchedulerStatus;
  history: SchedulerHistory[];
  nextScheduled: {
    daily: string | null;
    weekly: string | null;
    monthly: string | null;
  };
}

export async function getSchedulerStatus(): Promise<SchedulerData> {
  return apiGet('/api/scheduler');
}

export async function getSchedulerRunningStatus(): Promise<SchedulerStatus & { nextScheduled: SchedulerData['nextScheduled'] }> {
  return apiGet('/api/scheduler/status');
}

export async function startScheduler(): Promise<{ success: boolean; status: SchedulerData }> {
  return apiMutate('/api/scheduler/start', 'POST');
}

export async function stopScheduler(): Promise<{ success: boolean; status: SchedulerData }> {
  return apiMutate('/api/scheduler/stop', 'POST');
}

export async function runScheduleNow(type: 'daily' | 'weekly' | 'monthly'): Promise<{ success: boolean; history: SchedulerHistory }> {
  return apiMutate('/api/scheduler/run-now', 'POST', { type });
}

export async function updateSchedulerConfig(config: Partial<SchedulerConfig>): Promise<{ success: boolean; config: SchedulerConfig }> {
  return apiMutate('/api/scheduler/config', 'PUT', config);
}
