import cron from 'node-cron';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 파일 로드 (프로젝트 루트에서)
const envPath = path.join(__dirname, '..', '..', '..', '.env');
config({ path: envPath });

// 데이터 디렉토리 경로 (src/data)
const DATA_DIR = path.join(__dirname, '..', '..', '..', 'src', 'data');

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

interface SchedulerStatus {
  isRunning: boolean;
  currentTask: string | null;
  lastCompletedAt: string | null;
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
  status: SchedulerStatus;
  history: SchedulerHistory[];
  nextScheduled: {
    daily: string | null;
    weekly: string | null;
    monthly: string | null;
  };
}

interface Query {
  id: string;
  query: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  brandIds?: string[];
  lastTested?: string;
}

interface Brand {
  id: string;
  name: string;
  competitors: string[];
}

interface BrandResult {
  brandId: string;
  brandName: string;
  cited: boolean;
  rank: number | null;
  competitorMentions: string[];
}

interface TestResult {
  id: string;
  queryId: string | null;
  query: string;
  category: string;
  engine: string;
  cited: boolean;
  brandResults: BrandResult[];
  response: string;
  fullResponse: string;
  testedAt: string;
}

// JSON 파일 헬퍼
function readJsonFile<T>(filename: string): T | null {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function writeJsonFile(filename: string, data: unknown): void {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export class QueryScheduler {
  private openai: OpenAI | null = null;
  private geminiModel: any = null;
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private isInitialized = false;

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

  private getSchedulerData(): SchedulerData {
    const data = readJsonFile<SchedulerData>('scheduler.json');
    if (!data) {
      const defaultData: SchedulerData = {
        config: {
          enabled: true,
          dailyRunTime: '09:00',
          weeklyRunDay: 1,
          weeklyRunTime: '09:00',
          monthlyRunDay: 1,
          monthlyRunTime: '09:00',
          defaultEngine: 'gpt',
          concurrentQueries: 3,
        },
        status: {
          isRunning: false,
          currentTask: null,
          lastCompletedAt: null,
        },
        history: [],
        nextScheduled: {
          daily: null,
          weekly: null,
          monthly: null,
        },
      };
      writeJsonFile('scheduler.json', defaultData);
      return defaultData;
    }
    return data;
  }

  private saveSchedulerData(data: SchedulerData): void {
    writeJsonFile('scheduler.json', data);
  }

  public getStatus(): SchedulerData {
    return this.getSchedulerData();
  }

  public getRunningStatus(): SchedulerStatus & { nextScheduled: SchedulerData['nextScheduled'] } {
    const data = this.getSchedulerData();
    return {
      ...data.status,
      nextScheduled: data.nextScheduled,
    };
  }

  public updateConfig(config: Partial<SchedulerConfig>): SchedulerConfig {
    const data = this.getSchedulerData();
    data.config = { ...data.config, ...config };
    this.saveSchedulerData(data);

    // 설정 변경 시 크론 잡 재시작
    if (data.config.enabled) {
      this.stop();
      this.start();
    }

    return data.config;
  }

  public start(manualStart: boolean = false): void {
    if (this.isInitialized) {
      console.log('[Scheduler] Already running');
      return;
    }

    const data = this.getSchedulerData();

    // 수동 시작이면 enabled를 true로 설정
    if (manualStart) {
      data.config.enabled = true;
      this.saveSchedulerData(data);
    } else if (!data.config.enabled) {
      // 자동 시작(서버 부팅)인데 비활성화 상태면 시작하지 않음
      console.log('[Scheduler] Disabled, not starting');
      return;
    }

    console.log('[Scheduler] Starting scheduler...');

    // Daily 스케줄 설정
    const [dailyHour, dailyMinute] = data.config.dailyRunTime.split(':');
    const dailyCron = `${dailyMinute} ${dailyHour} * * *`;
    const dailyJob = cron.schedule(dailyCron, () => {
      console.log('[Scheduler] Running daily schedule');
      this.runSchedule('daily');
    });
    this.cronJobs.set('daily', dailyJob);

    // Weekly 스케줄 설정 (weeklyRunDay: 0=일요일, 1=월요일, ...)
    const [weeklyHour, weeklyMinute] = data.config.weeklyRunTime.split(':');
    const weeklyCron = `${weeklyMinute} ${weeklyHour} * * ${data.config.weeklyRunDay}`;
    const weeklyJob = cron.schedule(weeklyCron, () => {
      console.log('[Scheduler] Running weekly schedule');
      this.runSchedule('weekly');
    });
    this.cronJobs.set('weekly', weeklyJob);

    // Monthly 스케줄 설정
    const [monthlyHour, monthlyMinute] = data.config.monthlyRunTime.split(':');
    const monthlyCron = `${monthlyMinute} ${monthlyHour} ${data.config.monthlyRunDay} * *`;
    const monthlyJob = cron.schedule(monthlyCron, () => {
      console.log('[Scheduler] Running monthly schedule');
      this.runSchedule('monthly');
    });
    this.cronJobs.set('monthly', monthlyJob);

    this.isInitialized = true;
    this.updateNextScheduled();
    console.log('[Scheduler] Started with schedules:', {
      daily: dailyCron,
      weekly: weeklyCron,
      monthly: monthlyCron,
    });
  }

  public stop(): void {
    console.log('[Scheduler] Stopping scheduler...');
    this.cronJobs.forEach((job, key) => {
      job.stop();
      console.log(`[Scheduler] Stopped ${key} job`);
    });
    this.cronJobs.clear();
    this.isInitialized = false;

    // enabled 상태 업데이트
    const data = this.getSchedulerData();
    data.config.enabled = false;
    this.saveSchedulerData(data);

    console.log('[Scheduler] Stopped');
  }

  private updateNextScheduled(): void {
    const data = this.getSchedulerData();
    const now = new Date();

    // Daily next
    const [dailyHour, dailyMinute] = data.config.dailyRunTime.split(':').map(Number);
    const nextDaily = new Date(now);
    nextDaily.setHours(dailyHour, dailyMinute, 0, 0);
    if (nextDaily <= now) {
      nextDaily.setDate(nextDaily.getDate() + 1);
    }

    // Weekly next
    const [weeklyHour, weeklyMinute] = data.config.weeklyRunTime.split(':').map(Number);
    const nextWeekly = new Date(now);
    nextWeekly.setHours(weeklyHour, weeklyMinute, 0, 0);
    const currentDay = now.getDay();
    let daysUntilWeekly = data.config.weeklyRunDay - currentDay;
    if (daysUntilWeekly < 0 || (daysUntilWeekly === 0 && nextWeekly <= now)) {
      daysUntilWeekly += 7;
    }
    nextWeekly.setDate(nextWeekly.getDate() + daysUntilWeekly);

    // Monthly next
    const [monthlyHour, monthlyMinute] = data.config.monthlyRunTime.split(':').map(Number);
    const nextMonthly = new Date(now);
    nextMonthly.setDate(data.config.monthlyRunDay);
    nextMonthly.setHours(monthlyHour, monthlyMinute, 0, 0);
    if (nextMonthly <= now) {
      nextMonthly.setMonth(nextMonthly.getMonth() + 1);
    }

    data.nextScheduled = {
      daily: nextDaily.toISOString(),
      weekly: nextWeekly.toISOString(),
      monthly: nextMonthly.toISOString(),
    };

    this.saveSchedulerData(data);
  }

  public async runNow(type: 'daily' | 'weekly' | 'monthly'): Promise<SchedulerHistory> {
    return this.runSchedule(type);
  }

  private async runSchedule(type: 'daily' | 'weekly' | 'monthly'): Promise<SchedulerHistory> {
    const schedulerData = this.getSchedulerData();

    if (schedulerData.status.isRunning) {
      throw new Error('Another schedule is already running');
    }

    // 상태 업데이트
    schedulerData.status.isRunning = true;
    schedulerData.status.currentTask = `${type} schedule`;
    this.saveSchedulerData(schedulerData);

    const startedAt = new Date().toISOString();
    let queriesProcessed = 0;
    let success = 0;
    let failed = 0;

    try {
      // 해당 frequency의 활성 쿼리 가져오기
      const queriesData = readJsonFile<{ queries: Query[] }>('queries.json');
      const brandsData = readJsonFile<{ brands: Brand[] }>('brands.json');

      if (!queriesData || !brandsData || brandsData.brands.length === 0) {
        throw new Error('No queries or brands found');
      }

      const activeQueries = queriesData.queries.filter(
        (q) => q.isActive && q.frequency === type
      );

      if (activeQueries.length === 0) {
        console.log(`[Scheduler] No active ${type} queries found`);
      }

      const engine = schedulerData.config.defaultEngine;

      // 순차 처리 (하나씩 실행)
      for (const query of activeQueries) {
        queriesProcessed++;
        try {
          await this.testQuery(query, brandsData.brands, engine);
          success++;
        } catch (err) {
          failed++;
          console.error('[Scheduler] Query failed:', err);
        }
      }
    } catch (error) {
      console.error('[Scheduler] Schedule run failed:', error);
    } finally {
      // 상태 및 히스토리 업데이트
      const updatedData = this.getSchedulerData();
      const completedAt = new Date().toISOString();

      const historyEntry: SchedulerHistory = {
        id: String(Date.now()),
        type,
        startedAt,
        completedAt,
        queriesProcessed,
        success,
        failed,
      };

      updatedData.status.isRunning = false;
      updatedData.status.currentTask = null;
      updatedData.status.lastCompletedAt = completedAt;
      updatedData.history.unshift(historyEntry);

      // 히스토리 최대 100개 유지
      if (updatedData.history.length > 100) {
        updatedData.history = updatedData.history.slice(0, 100);
      }

      this.saveSchedulerData(updatedData);
      this.updateNextScheduled();

      console.log(`[Scheduler] ${type} schedule completed:`, {
        queriesProcessed,
        success,
        failed,
      });

      return historyEntry;
    }
  }

  private async testQuery(
    query: Query,
    brands: Brand[],
    engine: 'gpt' | 'gemini'
  ): Promise<TestResult> {
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

      const competitorMentions: string[] = [];
      for (const competitor of brand.competitors || []) {
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

    const result: TestResult = {
      id: String(Date.now()),
      queryId: query.id,
      query: query.query,
      category: query.category,
      engine,
      cited: anyCited,
      brandResults,
      response: response.slice(0, 500),
      fullResponse: response,
      testedAt: new Date().toISOString(),
    };

    // 결과 저장
    const resultsData = readJsonFile<{ results: TestResult[] }>('results.json') || {
      results: [],
    };
    resultsData.results.unshift(result);
    if (resultsData.results.length > 500) {
      resultsData.results = resultsData.results.slice(0, 500);
    }
    writeJsonFile('results.json', { ...resultsData, lastUpdated: new Date().toISOString() });

    // 쿼리의 lastTested 업데이트
    const queriesData = readJsonFile<{ queries: Query[] }>('queries.json');
    if (queriesData) {
      queriesData.queries = queriesData.queries.map((q) =>
        q.id === query.id ? { ...q, lastTested: result.testedAt } : q
      );
      writeJsonFile('queries.json', { ...queriesData, lastUpdated: new Date().toISOString() });
    }

    return result;
  }
}

// 싱글톤 인스턴스
export const scheduler = new QueryScheduler();
