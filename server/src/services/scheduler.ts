import cron from 'node-cron';
import { randomUUID } from 'crypto';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env 파일 로드 (프로젝트 루트에서)
const envPath = join(__dirname, '..', '..', '..', '.env');
config({ path: envPath });

// 타입 정의
interface SchedulerConfig {
  enabled: boolean;
  dailyRunTime: string;
  weeklyRunDay: number;
  weeklyRunTime: string;
  monthlyRunDay: number;
  monthlyRunTime: string;
  defaultEngine: 'gpt' | 'gemini';
  concurrentQueries: number;
}

interface SchedulerHistory {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  startedAt: string;
  completedAt: string;
  queriesProcessed: number;
  success: number;
  failed: number;
}

interface SchedulerData {
  config: SchedulerConfig;
  status: {
    isRunning: boolean;
    currentTask: string | null;
    lastCompletedAt: string | null;
  };
  history: SchedulerHistory[];
  nextScheduled: {
    daily: string | null;
    weekly: string | null;
    monthly: string | null;
  };
}

interface DbSchedulerConfig {
  id: string;
  user_id: string;
  enabled: number;
  daily_run_time: string;
  weekly_run_day: number;
  weekly_run_time: string;
  monthly_run_day: number;
  monthly_run_time: string;
  default_engine: string;
  concurrent_queries: number;
  created_at: string;
  updated_at: string;
}

interface DbSchedulerHistory {
  id: string;
  user_id: string;
  type: string;
  started_at: string;
  completed_at: string;
  queries_processed: number;
  success: number;
  failed: number;
}

interface DbQuery {
  id: string;
  user_id: string;
  query: string;
  category: string;
  frequency: string;
  is_active: number;
}

interface DbBrand {
  id: string;
  user_id: string;
  name: string;
  competitors: string;
}

interface BrandResult {
  brandId: string;
  brandName: string;
  cited: boolean;
  rank: number | null;
  competitorMentions: string[];
}

export class QueryScheduler {
  private openai: OpenAI | null = null;
  private geminiModel: any = null;
  private pollingJob: cron.ScheduledTask | null = null;
  private runningUsers: Set<string> = new Set();

  constructor() {
    this.initializeAI();
  }

  private initializeAI(): void {
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    console.log('[Scheduler] Initializing AI services...');
    console.log('[Scheduler] OpenAI API Key:', openaiKey ? `${openaiKey.slice(0, 10)}...` : 'NOT SET');
    console.log('[Scheduler] Gemini API Key:', geminiKey ? `${geminiKey.slice(0, 10)}...` : 'NOT SET');

    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
      console.log('[Scheduler] OpenAI client initialized');
    }

    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      this.geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      console.log('[Scheduler] Gemini client initialized');
    }
  }

  // --- DB 접근 ---

  private getUserConfig(userId: string): DbSchedulerConfig {
    db.prepare(
      'INSERT OR IGNORE INTO scheduler_configs (id, user_id) VALUES (?, ?)'
    ).run(randomUUID(), userId);

    return db.prepare(
      'SELECT * FROM scheduler_configs WHERE user_id = ?'
    ).get(userId) as DbSchedulerConfig;
  }

  private mapDbConfigToSchedulerConfig(row: DbSchedulerConfig): SchedulerConfig {
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

  private calculateNextScheduled(config: SchedulerConfig): SchedulerData['nextScheduled'] {
    if (!config.enabled) {
      return { daily: null, weekly: null, monthly: null };
    }

    const now = new Date();

    // Daily next
    const [dailyHour, dailyMinute] = config.dailyRunTime.split(':').map(Number);
    const nextDaily = new Date(now);
    nextDaily.setHours(dailyHour, dailyMinute, 0, 0);
    if (nextDaily <= now) {
      nextDaily.setDate(nextDaily.getDate() + 1);
    }

    // Weekly next
    const [weeklyHour, weeklyMinute] = config.weeklyRunTime.split(':').map(Number);
    const nextWeekly = new Date(now);
    nextWeekly.setHours(weeklyHour, weeklyMinute, 0, 0);
    const currentDay = now.getDay();
    let daysUntilWeekly = config.weeklyRunDay - currentDay;
    if (daysUntilWeekly < 0 || (daysUntilWeekly === 0 && nextWeekly <= now)) {
      daysUntilWeekly += 7;
    }
    nextWeekly.setDate(nextWeekly.getDate() + daysUntilWeekly);

    // Monthly next
    const [monthlyHour, monthlyMinute] = config.monthlyRunTime.split(':').map(Number);
    const nextMonthly = new Date(now);
    nextMonthly.setDate(config.monthlyRunDay);
    nextMonthly.setHours(monthlyHour, monthlyMinute, 0, 0);
    if (nextMonthly <= now) {
      nextMonthly.setMonth(nextMonthly.getMonth() + 1);
    }

    return {
      daily: nextDaily.toISOString(),
      weekly: nextWeekly.toISOString(),
      monthly: nextMonthly.toISOString(),
    };
  }

  private getUserHistory(userId: string): SchedulerHistory[] {
    const rows = db.prepare(
      'SELECT * FROM scheduler_history WHERE user_id = ? ORDER BY completed_at DESC LIMIT 100'
    ).all(userId) as DbSchedulerHistory[];

    return rows.map((row) => ({
      id: row.id,
      type: row.type as 'daily' | 'weekly' | 'monthly',
      startedAt: row.started_at,
      completedAt: row.completed_at,
      queriesProcessed: row.queries_processed,
      success: row.success,
      failed: row.failed,
    }));
  }

  // --- Public API ---

  public getStatus(userId: string): SchedulerData {
    const dbConfig = this.getUserConfig(userId);
    const config = this.mapDbConfigToSchedulerConfig(dbConfig);
    const history = this.getUserHistory(userId);
    const lastCompleted = history.length > 0 ? history[0].completedAt : null;

    return {
      config,
      status: {
        isRunning: this.runningUsers.has(userId),
        currentTask: this.runningUsers.has(userId) ? 'schedule' : null,
        lastCompletedAt: lastCompleted,
      },
      history,
      nextScheduled: this.calculateNextScheduled(config),
    };
  }

  public getRunningStatus(userId: string) {
    const dbConfig = this.getUserConfig(userId);
    const config = this.mapDbConfigToSchedulerConfig(dbConfig);
    const history = this.getUserHistory(userId);
    const lastCompleted = history.length > 0 ? history[0].completedAt : null;

    return {
      isRunning: this.runningUsers.has(userId),
      currentTask: this.runningUsers.has(userId) ? 'schedule' : null,
      lastCompletedAt: lastCompleted,
      nextScheduled: this.calculateNextScheduled(config),
    };
  }

  public updateConfig(userId: string, configUpdate: Partial<SchedulerConfig>): SchedulerConfig {
    // 먼저 기존 config 보장
    this.getUserConfig(userId);

    const updates: string[] = [];
    const values: any[] = [];

    if (configUpdate.enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(configUpdate.enabled ? 1 : 0);
    }
    if (configUpdate.dailyRunTime !== undefined) {
      updates.push('daily_run_time = ?');
      values.push(configUpdate.dailyRunTime);
    }
    if (configUpdate.weeklyRunDay !== undefined) {
      updates.push('weekly_run_day = ?');
      values.push(configUpdate.weeklyRunDay);
    }
    if (configUpdate.weeklyRunTime !== undefined) {
      updates.push('weekly_run_time = ?');
      values.push(configUpdate.weeklyRunTime);
    }
    if (configUpdate.monthlyRunDay !== undefined) {
      updates.push('monthly_run_day = ?');
      values.push(configUpdate.monthlyRunDay);
    }
    if (configUpdate.monthlyRunTime !== undefined) {
      updates.push('monthly_run_time = ?');
      values.push(configUpdate.monthlyRunTime);
    }
    if (configUpdate.defaultEngine !== undefined) {
      updates.push('default_engine = ?');
      values.push(configUpdate.defaultEngine);
    }
    if (configUpdate.concurrentQueries !== undefined) {
      updates.push('concurrent_queries = ?');
      values.push(configUpdate.concurrentQueries);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(userId);
      db.prepare(
        `UPDATE scheduler_configs SET ${updates.join(', ')} WHERE user_id = ?`
      ).run(...values);
    }

    const dbConfig = this.getUserConfig(userId);
    return this.mapDbConfigToSchedulerConfig(dbConfig);
  }

  public startForUser(userId: string): SchedulerData {
    this.getUserConfig(userId);
    db.prepare(
      "UPDATE scheduler_configs SET enabled = 1, updated_at = datetime('now') WHERE user_id = ?"
    ).run(userId);
    return this.getStatus(userId);
  }

  public stopForUser(userId: string): SchedulerData {
    db.prepare(
      "UPDATE scheduler_configs SET enabled = 0, updated_at = datetime('now') WHERE user_id = ?"
    ).run(userId);
    return this.getStatus(userId);
  }

  public async runNow(userId: string, type: 'daily' | 'weekly' | 'monthly'): Promise<SchedulerHistory> {
    const dbConfig = this.getUserConfig(userId);
    const engine = dbConfig.default_engine as 'gpt' | 'gemini';
    return this.runScheduleForUser(userId, type, engine);
  }

  // --- 글로벌 폴링 ---

  public start(): void {
    if (this.pollingJob) {
      console.log('[Scheduler] Polling already running');
      return;
    }

    console.log('[Scheduler] Starting 1-minute polling loop...');

    this.pollingJob = cron.schedule('* * * * *', () => {
      this.pollAndExecute().catch((err) => {
        console.error('[Scheduler] Polling error:', err);
      });
    });

    console.log('[Scheduler] Polling started');
  }

  public stop(): void {
    if (this.pollingJob) {
      this.pollingJob.stop();
      this.pollingJob = null;
      console.log('[Scheduler] Polling stopped');
    }
  }

  private async pollAndExecute(): Promise<void> {
    const configs = db.prepare(
      `SELECT sc.* FROM scheduler_configs sc
       JOIN users u ON sc.user_id = u.id
       WHERE sc.enabled = 1 AND u.is_active = 1`
    ).all() as DbSchedulerConfig[];

    if (configs.length === 0) return;

    const now = new Date();
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDayOfWeek = now.getDay();
    const currentDayOfMonth = now.getDate();

    for (const cfg of configs) {
      const userId = cfg.user_id;

      // 이미 실행 중이면 스킵
      if (this.runningUsers.has(userId)) continue;

      const engine = cfg.default_engine as 'gpt' | 'gemini';

      // Daily 체크
      if (currentHHMM === cfg.daily_run_time) {
        this.runScheduleForUser(userId, 'daily', engine).catch((err) => {
          console.error(`[Scheduler] Daily run failed for user ${userId}:`, err);
        });
      }

      // Weekly 체크
      if (currentDayOfWeek === cfg.weekly_run_day && currentHHMM === cfg.weekly_run_time) {
        this.runScheduleForUser(userId, 'weekly', engine).catch((err) => {
          console.error(`[Scheduler] Weekly run failed for user ${userId}:`, err);
        });
      }

      // Monthly 체크
      if (currentDayOfMonth === cfg.monthly_run_day && currentHHMM === cfg.monthly_run_time) {
        this.runScheduleForUser(userId, 'monthly', engine).catch((err) => {
          console.error(`[Scheduler] Monthly run failed for user ${userId}:`, err);
        });
      }
    }
  }

  // --- 유저별 스케줄 실행 ---

  private async runScheduleForUser(
    userId: string,
    type: 'daily' | 'weekly' | 'monthly',
    engine: 'gpt' | 'gemini'
  ): Promise<SchedulerHistory> {
    if (this.runningUsers.has(userId)) {
      throw new Error('Another schedule is already running for this user');
    }

    this.runningUsers.add(userId);
    const startedAt = new Date().toISOString();
    let queriesProcessed = 0;
    let success = 0;
    let failed = 0;

    try {
      // 해당 유저의 활성 쿼리 가져오기 (frequency 일치)
      const queries = db.prepare(
        'SELECT * FROM queries WHERE user_id = ? AND is_active = 1 AND frequency = ?'
      ).all(userId, type) as DbQuery[];

      // 해당 유저의 활성 브랜드 가져오기
      const brands = db.prepare(
        'SELECT * FROM brands WHERE user_id = ? AND is_active = 1'
      ).all(userId) as DbBrand[];

      if (brands.length === 0) {
        console.log(`[Scheduler] No active brands for user ${userId}`);
      }

      if (queries.length === 0) {
        console.log(`[Scheduler] No active ${type} queries for user ${userId}`);
      }

      // 순차 처리
      for (const query of queries) {
        queriesProcessed++;
        try {
          await this.testQueryForUser(userId, query, brands, engine);
          success++;
        } catch (err) {
          failed++;
          console.error('[Scheduler] Query failed:', err);
        }
      }
    } catch (error) {
      console.error(`[Scheduler] Schedule run failed for user ${userId}:`, error);
    } finally {
      this.runningUsers.delete(userId);

      const completedAt = new Date().toISOString();
      const historyId = randomUUID();

      // 히스토리 저장
      db.prepare(
        `INSERT INTO scheduler_history (id, user_id, type, started_at, completed_at, queries_processed, success, failed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(historyId, userId, type, startedAt, completedAt, queriesProcessed, success, failed);

      const historyEntry: SchedulerHistory = {
        id: historyId,
        type,
        startedAt,
        completedAt,
        queriesProcessed,
        success,
        failed,
      };

      console.log(`[Scheduler] ${type} schedule completed for user ${userId}:`, {
        queriesProcessed,
        success,
        failed,
      });

      return historyEntry;
    }
  }

  private async testQueryForUser(
    userId: string,
    query: DbQuery,
    brands: DbBrand[],
    engine: 'gpt' | 'gemini'
  ): Promise<void> {
    let response = '';

    try {
      if (engine === 'gemini') {
        if (!this.geminiModel) {
          throw new Error('Gemini API key not configured');
        }
        const result = await this.geminiModel.generateContent(query.query);
        response = result.response.text() || '';
      } else {
        if (!this.openai) {
          throw new Error('OpenAI API key not configured');
        }
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: query.query }],
          max_tokens: 1000,
        });
        response = completion.choices[0]?.message?.content || '';
      }
    } catch (error) {
      console.error(`[Scheduler] AI API error for query "${query.query}":`, error);
      throw error;
    }

    const responseLower = response.toLowerCase();

    // 브랜드별 인용 체크
    const brandResults: BrandResult[] = [];

    for (const brand of brands) {
      const cited = responseLower.includes(brand.name.toLowerCase());
      let rank: number | null = null;

      if (cited) {
        const lines = response.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(brand.name.toLowerCase())) {
            const match = lines[i].match(/^[\s]*(\d+)[.)\]]/);
            if (match) {
              rank = parseInt(match[1]);
            }
            break;
          }
        }
      }

      const competitors: string[] = JSON.parse(brand.competitors || '[]');
      const competitorMentions: string[] = [];
      for (const competitor of competitors) {
        if (responseLower.includes(competitor.toLowerCase())) {
          competitorMentions.push(competitor);
        }
      }

      brandResults.push({
        brandId: brand.id,
        brandName: brand.name,
        cited,
        rank,
        competitorMentions,
      });
    }

    const anyCited = brandResults.some((br) => br.cited);
    const resultId = randomUUID();
    const testedAt = new Date().toISOString();

    // 결과를 results 테이블에 저장
    db.prepare(
      `INSERT INTO results (id, user_id, query_id, query, category, engine, cited, response, full_response, tested_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      resultId,
      userId,
      query.id,
      query.query,
      query.category,
      engine,
      anyCited ? 1 : 0,
      response.slice(0, 500),
      response,
      testedAt
    );

    // 브랜드별 결과를 brand_results 테이블에 저장
    const insertBrandResult = db.prepare(
      `INSERT INTO brand_results (result_id, brand_id, brand_name, cited, rank, competitor_mentions)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    for (const br of brandResults) {
      insertBrandResult.run(
        resultId,
        br.brandId,
        br.brandName,
        br.cited ? 1 : 0,
        br.rank,
        JSON.stringify(br.competitorMentions)
      );
    }

    // 쿼리의 lastTested 업데이트
    db.prepare(
      'UPDATE queries SET last_tested = ? WHERE id = ?'
    ).run(testedAt, query.id);
  }
}

// 싱글톤 인스턴스
export const scheduler = new QueryScheduler();
