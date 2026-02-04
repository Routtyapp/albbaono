/**
 * JSON 데이터를 SQLite로 마이그레이션하는 스크립트
 *
 * 실행 방법:
 * npx tsx scripts/migrate-json-to-sqlite.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import { initializeSchema } from '../src/db/schema';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const DB_PATH = path.join(DATA_DIR, 'geo-tracker.db');

// JSON 파일 읽기 함수
function readJsonFile(filename: string): any {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    console.log(`[SKIP] ${filename} not found or invalid`);
    return null;
  }
}

// 마이그레이션 실행
async function migrate() {
  console.log('=== JSON to SQLite Migration ===\n');

  // 기존 DB 파일이 있으면 백업 후 새 파일로 작업
  const tempDbPath = `${DB_PATH}.new.${Date.now()}`;
  let finalDbPath = DB_PATH;

  if (fs.existsSync(DB_PATH)) {
    console.log(`[INFO] Existing DB found. Creating new DB for migration...`);
    finalDbPath = tempDbPath;
  }

  // 새 데이터베이스 생성
  const db = new Database(finalDbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 스키마 초기화
  console.log('[INIT] Creating database schema...');
  initializeSchema(db);
  console.log('[DONE] Schema created\n');

  // 1. 브랜드 마이그레이션
  console.log('[MIGRATE] Brands...');
  const brandsData = readJsonFile('brands.json');
  if (brandsData?.brands) {
    const insertBrand = db.prepare(`
      INSERT INTO brands (id, name, competitors, created_at, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);

    let count = 0;
    for (const brand of brandsData.brands) {
      insertBrand.run(
        brand.id,
        brand.name,
        JSON.stringify(brand.competitors || []),
        brand.createdAt
      );
      count++;
    }
    console.log(`  [DONE] ${count} brands migrated`);
  }

  // 2. 쿼리 마이그레이션
  console.log('[MIGRATE] Queries...');
  const queriesData = readJsonFile('queries.json');
  if (queriesData?.queries) {
    const insertQuery = db.prepare(`
      INSERT INTO queries (id, query, category, frequency, is_active, created_at, last_tested)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertQueryBrand = db.prepare(`
      INSERT INTO query_brands (query_id, brand_id) VALUES (?, ?)
    `);

    let count = 0;
    for (const query of queriesData.queries) {
      insertQuery.run(
        query.id,
        query.query,
        query.category || '기타',
        query.frequency || 'daily',
        query.isActive !== false ? 1 : 0,
        query.createdAt,
        query.lastTested || null
      );

      // 브랜드 연결
      if (query.brandIds?.length > 0) {
        for (const brandId of query.brandIds) {
          try {
            insertQueryBrand.run(query.id, brandId);
          } catch (e) {
            // 브랜드가 없으면 무시
          }
        }
      }
      count++;
    }
    console.log(`  [DONE] ${count} queries migrated`);
  }

  // 3. 결과 마이그레이션
  console.log('[MIGRATE] Results...');
  const resultsData = readJsonFile('results.json');
  if (resultsData?.results) {
    const insertResult = db.prepare(`
      INSERT INTO results (id, query_id, query, category, engine, cited, response, full_response, tested_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertBrandResult = db.prepare(`
      INSERT INTO brand_results (result_id, brand_id, brand_name, cited, rank, competitor_mentions)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    const transaction = db.transaction((results: any[]) => {
      for (const result of results) {
        insertResult.run(
          result.id,
          result.queryId || null,
          result.query,
          result.category || '기타',
          result.engine || 'gpt',
          result.cited ? 1 : 0,
          result.response || '',
          result.fullResponse || '',
          result.testedAt
        );

        // 브랜드별 결과 저장
        if (result.brandResults?.length > 0) {
          for (const br of result.brandResults) {
            insertBrandResult.run(
              result.id,
              br.brandId,
              br.brandName,
              br.cited ? 1 : 0,
              br.rank || null,
              JSON.stringify(br.competitorMentions || [])
            );
          }
        }
        count++;
      }
    });

    transaction(resultsData.results);
    console.log(`  [DONE] ${count} results migrated`);
  }

  // 4. 리포트 마이그레이션
  console.log('[MIGRATE] Reports...');
  const reportsData = readJsonFile('reports.json');
  if (reportsData?.reports) {
    const insertReport = db.prepare(`
      INSERT INTO reports (id, title, type, period, start_date, end_date, generated_at, metrics, highlights, top_queries, worst_queries)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    for (const report of reportsData.reports) {
      insertReport.run(
        report.id,
        report.title,
        report.type,
        report.period,
        report.startDate,
        report.endDate,
        report.generatedAt,
        JSON.stringify(report.metrics || {}),
        JSON.stringify(report.highlights || []),
        JSON.stringify(report.topQueries || []),
        JSON.stringify(report.worstQueries || [])
      );
      count++;
    }
    console.log(`  [DONE] ${count} reports migrated`);
  }

  // 5. 인사이트 마이그레이션
  console.log('[MIGRATE] Insights...');
  const insightsData = readJsonFile('insights.json');
  if (insightsData?.insights) {
    const insertInsight = db.prepare(`
      INSERT INTO insights (id, brand_id, brand_name, common_keywords, category_insights, citation_patterns, actionable_insights, content_gaps, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    for (const insight of insightsData.insights) {
      insertInsight.run(
        insight.id,
        insight.brandId,
        insight.brandName,
        JSON.stringify(insight.commonKeywords || []),
        JSON.stringify(insight.categoryInsights || []),
        JSON.stringify(insight.citationPatterns || {}),
        JSON.stringify(insight.actionableInsights || []),
        JSON.stringify(insight.contentGaps || []),
        JSON.stringify(insight.metadata || {}),
        insight.metadata?.analyzedAt || new Date().toISOString()
      );
      count++;
    }
    console.log(`  [DONE] ${count} insights migrated`);
  }

  // 6. 스케줄러 마이그레이션
  console.log('[MIGRATE] Scheduler...');
  const schedulerData = readJsonFile('scheduler.json');
  if (schedulerData?.config) {
    const config = schedulerData.config;

    db.prepare(`
      UPDATE scheduler_config
      SET enabled = ?, daily_run_time = ?, weekly_run_day = ?, weekly_run_time = ?,
          monthly_run_day = ?, monthly_run_time = ?, default_engine = ?, concurrent_queries = ?
      WHERE id = 1
    `).run(
      config.enabled ? 1 : 0,
      config.dailyRunTime || '09:00',
      config.weeklyRunDay || 1,
      config.weeklyRunTime || '09:00',
      config.monthlyRunDay || 1,
      config.monthlyRunTime || '09:00',
      config.defaultEngine || 'gpt',
      config.concurrentQueries || 1
    );
    console.log('  [DONE] Scheduler config migrated');

    // 히스토리 마이그레이션
    if (schedulerData.history?.length > 0) {
      const insertHistory = db.prepare(`
        INSERT INTO scheduler_history (id, type, started_at, completed_at, queries_processed, success, failed)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      let historyCount = 0;
      for (const history of schedulerData.history) {
        insertHistory.run(
          history.id,
          history.type,
          history.startedAt,
          history.completedAt,
          history.queriesProcessed,
          history.success,
          history.failed
        );
        historyCount++;
      }
      console.log(`  [DONE] ${historyCount} history records migrated`);
    }
  }

  // 통계 출력
  console.log('\n=== Migration Summary ===');
  const stats = {
    brands: db.prepare('SELECT COUNT(*) as count FROM brands').get() as { count: number },
    queries: db.prepare('SELECT COUNT(*) as count FROM queries').get() as { count: number },
    results: db.prepare('SELECT COUNT(*) as count FROM results').get() as { count: number },
    brandResults: db.prepare('SELECT COUNT(*) as count FROM brand_results').get() as { count: number },
    reports: db.prepare('SELECT COUNT(*) as count FROM reports').get() as { count: number },
    insights: db.prepare('SELECT COUNT(*) as count FROM insights').get() as { count: number },
    history: db.prepare('SELECT COUNT(*) as count FROM scheduler_history').get() as { count: number },
  };

  console.log(`Brands: ${stats.brands.count}`);
  console.log(`Queries: ${stats.queries.count}`);
  console.log(`Results: ${stats.results.count}`);
  console.log(`Brand Results: ${stats.brandResults.count}`);
  console.log(`Reports: ${stats.reports.count}`);
  console.log(`Insights: ${stats.insights.count}`);
  console.log(`Scheduler History: ${stats.history.count}`);

  db.close();
  console.log(`\n[SUCCESS] Migration completed!`);
  console.log(`Database file: ${finalDbPath}`);

  if (finalDbPath !== DB_PATH) {
    console.log(`\n[ACTION REQUIRED]`);
    console.log(`1. Stop the Vite dev server`);
    console.log(`2. Delete or rename the old database: ${DB_PATH}`);
    console.log(`3. Rename the new database: mv "${finalDbPath}" "${DB_PATH}"`);
    console.log(`4. Restart the Vite dev server`);
  }
}

migrate().catch((error) => {
  console.error('[ERROR] Migration failed:', error);
  process.exit(1);
});
