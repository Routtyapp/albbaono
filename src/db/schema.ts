// SQLite 데이터베이스 스키마 정의

export const SCHEMA = `
-- 브랜드 테이블
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  competitors TEXT, -- JSON array
  created_at TEXT NOT NULL,
  is_active INTEGER DEFAULT 1
);

-- 쿼리 테이블
CREATE TABLE IF NOT EXISTS queries (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  category TEXT NOT NULL,
  frequency TEXT NOT NULL, -- 'daily' | 'weekly' | 'monthly'
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  last_tested TEXT
);

-- 쿼리-브랜드 다대다 관계 테이블
CREATE TABLE IF NOT EXISTS query_brands (
  query_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  PRIMARY KEY (query_id, brand_id),
  FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- 결과 테이블
CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  query_id TEXT,
  query TEXT NOT NULL,
  category TEXT NOT NULL,
  engine TEXT NOT NULL, -- 'gpt' | 'gemini'
  cited INTEGER NOT NULL,
  response TEXT,
  full_response TEXT,
  tested_at TEXT NOT NULL,
  FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE SET NULL
);

-- 결과당 브랜드별 인용 정보 테이블
CREATE TABLE IF NOT EXISTS brand_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  cited INTEGER NOT NULL,
  rank INTEGER,
  competitor_mentions TEXT, -- JSON array
  FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE
);

-- 리포트 테이블
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'weekly' | 'monthly'
  period TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  metrics TEXT NOT NULL, -- JSON object
  highlights TEXT, -- JSON array
  top_queries TEXT, -- JSON array
  worst_queries TEXT -- JSON array
);

-- 인사이트 테이블
CREATE TABLE IF NOT EXISTS insights (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  common_keywords TEXT, -- JSON array
  category_insights TEXT, -- JSON array
  citation_patterns TEXT, -- JSON object
  actionable_insights TEXT, -- JSON array
  content_gaps TEXT, -- JSON array
  metadata TEXT, -- JSON object
  created_at TEXT NOT NULL,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- 스케줄러 설정 테이블 (단일 레코드)
CREATE TABLE IF NOT EXISTS scheduler_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  enabled INTEGER DEFAULT 0,
  daily_run_time TEXT DEFAULT '09:00',
  weekly_run_day INTEGER DEFAULT 1,
  weekly_run_time TEXT DEFAULT '09:00',
  monthly_run_day INTEGER DEFAULT 1,
  monthly_run_time TEXT DEFAULT '09:00',
  default_engine TEXT DEFAULT 'gpt',
  concurrent_queries INTEGER DEFAULT 1
);

-- 스케줄러 히스토리 테이블
CREATE TABLE IF NOT EXISTS scheduler_history (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'daily' | 'weekly' | 'monthly'
  started_at TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  queries_processed INTEGER NOT NULL,
  success INTEGER NOT NULL,
  failed INTEGER NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_results_query_id ON results(query_id);
CREATE INDEX IF NOT EXISTS idx_results_tested_at ON results(tested_at);
CREATE INDEX IF NOT EXISTS idx_brand_results_result_id ON brand_results(result_id);
CREATE INDEX IF NOT EXISTS idx_brand_results_brand_id ON brand_results(brand_id);
CREATE INDEX IF NOT EXISTS idx_insights_brand_id ON insights(brand_id);
CREATE INDEX IF NOT EXISTS idx_scheduler_history_type ON scheduler_history(type);
`;

// 스키마 초기화 함수 (테이블별로 분리해서 실행)
export function initializeSchema(db: import('better-sqlite3').Database): void {
  const statements = SCHEMA.split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    db.exec(statement);
  }

  // 스케줄러 기본 설정 추가 (없으면)
  const configExists = db.prepare('SELECT COUNT(*) as count FROM scheduler_config').get() as { count: number };
  if (configExists.count === 0) {
    db.prepare(`
      INSERT INTO scheduler_config (id, enabled, daily_run_time, weekly_run_day, weekly_run_time, monthly_run_day, monthly_run_time, default_engine, concurrent_queries)
      VALUES (1, 0, '09:00', 1, '09:00', 1, '09:00', 'gpt', 1)
    `).run();
  }
}
