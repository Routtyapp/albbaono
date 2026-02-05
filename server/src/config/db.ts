import Database, { Database as DatabaseType } from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 데이터베이스 파일 경로
const dbPath = resolve(__dirname, '../../../prisma/dev.db');

// SQLite 데이터베이스 연결
export const db: DatabaseType = new Database(dbPath);

// WAL 모드 활성화 (성능 향상)
db.pragma('journal_mode = WAL');

// 테이블 생성
db.exec(`
  -- 사용자 테이블
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    last_login TEXT
  );

  -- 브랜드 테이블 (사용자별)
  CREATE TABLE IF NOT EXISTS brands (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    competitors TEXT DEFAULT '[]',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 쿼리 테이블 (사용자별)
  CREATE TABLE IF NOT EXISTS queries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    query TEXT NOT NULL,
    category TEXT NOT NULL,
    frequency TEXT DEFAULT 'daily',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    last_tested TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 쿼리-브랜드 연결 테이블
  CREATE TABLE IF NOT EXISTS query_brands (
    query_id TEXT NOT NULL,
    brand_id TEXT NOT NULL,
    PRIMARY KEY (query_id, brand_id),
    FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
  );

  -- 결과 테이블 (사용자별)
  CREATE TABLE IF NOT EXISTS results (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    query_id TEXT,
    query TEXT NOT NULL,
    category TEXT NOT NULL,
    engine TEXT NOT NULL,
    cited INTEGER DEFAULT 0,
    response TEXT,
    full_response TEXT,
    tested_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE SET NULL
  );

  -- 브랜드별 결과 테이블
  CREATE TABLE IF NOT EXISTS brand_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    result_id TEXT NOT NULL,
    brand_id TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    cited INTEGER DEFAULT 0,
    rank INTEGER,
    competitor_mentions TEXT DEFAULT '[]',
    FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
  );

  -- 리포트 테이블 (사용자별)
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    period TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    generated_at TEXT DEFAULT (datetime('now')),
    metrics TEXT NOT NULL,
    highlights TEXT DEFAULT '[]',
    top_queries TEXT DEFAULT '[]',
    worst_queries TEXT DEFAULT '[]',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 인사이트 테이블 (사용자별)
  CREATE TABLE IF NOT EXISTS insights (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    brand_id TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    common_keywords TEXT DEFAULT '[]',
    category_insights TEXT DEFAULT '[]',
    citation_patterns TEXT DEFAULT '{}',
    actionable_insights TEXT DEFAULT '[]',
    content_gaps TEXT DEFAULT '[]',
    metadata TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
  );

  -- GEO Score 히스토리 테이블 (사용자별)
  CREATE TABLE IF NOT EXISTS geo_scores (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    url TEXT NOT NULL,
    total_score INTEGER NOT NULL,
    grade TEXT NOT NULL,
    categories TEXT NOT NULL,
    pages TEXT DEFAULT '[]',
    recommendations TEXT DEFAULT '[]',
    analyzed_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 인덱스 생성
  CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
  CREATE INDEX IF NOT EXISTS idx_queries_user_id ON queries(user_id);
  CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
  CREATE INDEX IF NOT EXISTS idx_results_tested_at ON results(tested_at);
  CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
  CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
  CREATE INDEX IF NOT EXISTS idx_geo_scores_user_id ON geo_scores(user_id);
`);

export default db;
