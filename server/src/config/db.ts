import Database, { Database as DatabaseType } from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
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

// 외래 키 제약 활성화 (CASCADE 삭제 동작에 필수)
db.pragma('foreign_keys = ON');

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
    marketing_points TEXT DEFAULT '[]',
    keywords TEXT DEFAULT '[]',
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

  -- 스케줄러 설정 테이블 (사용자별)
  CREATE TABLE IF NOT EXISTS scheduler_configs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    enabled INTEGER DEFAULT 0,
    daily_run_time TEXT DEFAULT '09:00',
    weekly_run_day INTEGER DEFAULT 1,
    weekly_run_time TEXT DEFAULT '09:00',
    monthly_run_day INTEGER DEFAULT 1,
    monthly_run_time TEXT DEFAULT '09:00',
    default_engine TEXT DEFAULT 'gpt',
    concurrent_queries INTEGER DEFAULT 3,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 스케줄러 히스토리 테이블 (사용자별)
  CREATE TABLE IF NOT EXISTS scheduler_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    queries_processed INTEGER DEFAULT 0,
    success INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 피드 테이블 (관리자 전용 글로벌 콘텐츠)
  CREATE TABLE IF NOT EXISTS feeds (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_published INTEGER DEFAULT 1,
    thumbnail_url TEXT,
    is_featured INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- 인덱스 생성
  CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
  CREATE INDEX IF NOT EXISTS idx_queries_user_id ON queries(user_id);
  CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
  CREATE INDEX IF NOT EXISTS idx_results_tested_at ON results(tested_at);
  CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
  CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
  CREATE INDEX IF NOT EXISTS idx_geo_scores_user_id ON geo_scores(user_id);
  CREATE INDEX IF NOT EXISTS idx_scheduler_configs_user_id ON scheduler_configs(user_id);
  CREATE INDEX IF NOT EXISTS idx_scheduler_history_user_id ON scheduler_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_feeds_created_at ON feeds(created_at);
`);

// reports 테이블에 ai_analysis 컬럼 추가 (기존 DB 호환)
try {
  db.exec(`ALTER TABLE reports ADD COLUMN ai_analysis TEXT DEFAULT NULL`);
} catch {
  // 이미 컬럼이 존재하면 무시
}

// users 테이블에 onboarding_step 컬럼 추가 (기존 DB 호환)
try {
  db.exec(`ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0`);
} catch {
  // 이미 컬럼이 존재하면 무시
}

// brands 테이블에 marketing_points, keywords 컬럼 추가 (기존 DB 호환)
try {
  db.exec(`ALTER TABLE brands ADD COLUMN marketing_points TEXT DEFAULT '[]'`);
} catch {
  // 이미 컬럼이 존재하면 무시
}
try {
  db.exec(`ALTER TABLE brands ADD COLUMN keywords TEXT DEFAULT '[]'`);
} catch {
  // 이미 컬럼이 존재하면 무시
}

// feeds 테이블에 thumbnail_url, is_featured 컬럼 추가 (기존 DB 호환)
try {
  db.exec(`ALTER TABLE feeds ADD COLUMN thumbnail_url TEXT`);
} catch {
  // 이미 컬럼이 존재하면 무시
}
try {
  db.exec(`ALTER TABLE feeds ADD COLUMN is_featured INTEGER DEFAULT 0`);
} catch {
  // 이미 컬럼이 존재하면 무시
}

// 피드 샘플 데이터 삽입 (비어있을 때만)
const feedCount = db.prepare('SELECT COUNT(*) as count FROM feeds').get() as { count: number };
if (feedCount.count === 0) {
  const now = new Date().toISOString();
  const seedFeeds = [
    {
      title: 'AI 검색 시대, GEO(Generative Engine Optimization)가 SEO를 대체할까?',
      content: 'ChatGPT, Gemini 등 생성형 AI 검색엔진이 보편화되면서 기존 SEO 전략만으로는 부족합니다. GEO는 AI가 생성하는 답변에 브랜드가 인용되도록 최적화하는 새로운 접근법입니다. 구조화된 데이터, 인용 가능한 문장, 전문성 있는 콘텐츠가 핵심 요소입니다.',
      category: 'geo',
      thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
      is_featured: 1,
    },
    {
      title: 'Google SGE 업데이트: 검색 결과 페이지가 완전히 바뀐다',
      content: 'Google의 Search Generative Experience(SGE)가 정식 출시를 앞두고 있습니다. AI 요약이 검색 결과 최상단에 배치되며, 기존 10개 블루링크 중심의 SERP가 근본적으로 변화합니다. 마케터들이 준비해야 할 사항을 정리했습니다.',
      category: 'update',
      thumbnail_url: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=800&q=80',
      is_featured: 1,
    },
    {
      title: '브랜드 가시성을 높이는 5가지 GEO 최적화 전략',
      content: 'AI 검색 결과에서 브랜드가 더 자주 인용되려면? 첫째, FAQ 구조화 데이터 적용. 둘째, 통계와 수치 기반 콘텐츠 작성. 셋째, 전문가 인용 추가. 넷째, 최신 정보 지속 업데이트. 다섯째, 멀티모달 콘텐츠 제작. 각 전략의 구체적 실행 방법을 살펴봅니다.',
      category: 'tip',
      thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      is_featured: 1,
    },
    {
      title: '2025년 SEO 트렌드: E-E-A-T에서 N-E-E-A-T로',
      content: 'Google의 품질 평가 기준이 진화하고 있습니다. 기존 E-E-A-T(경험, 전문성, 권위, 신뢰)에 Notability(주목성)가 추가된 N-E-E-A-T 프레임워크가 부상하고 있습니다. 브랜드의 온라인 존재감과 언급 빈도가 랭킹에 미치는 영향을 분석합니다.',
      category: 'seo',
      thumbnail_url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80',
      is_featured: 0,
    },
    {
      title: 'AI 챗봇 최적화: Perplexity와 ChatGPT에서 인용되는 법',
      content: 'Perplexity AI와 ChatGPT 검색에서 우리 사이트가 출처로 인용되기 위한 실전 가이드입니다. 메타 설명 최적화, 명확한 답변형 콘텐츠, 신뢰할 수 있는 출처 링크 등 AI 크롤러 친화적인 사이트를 만드는 방법을 소개합니다.',
      category: 'geo',
      thumbnail_url: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&q=80',
      is_featured: 0,
    },
    {
      title: '로컬 SEO 완벽 가이드: 지역 비즈니스 검색 노출 극대화',
      content: '지역 기반 비즈니스의 검색 노출을 극대화하는 로컬 SEO 전략을 총정리했습니다. Google 비즈니스 프로필 최적화, 지역 키워드 리서치, 리뷰 관리, 로컬 백링크 구축까지 실행 가능한 체크리스트를 제공합니다.',
      category: 'seo',
      thumbnail_url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80',
      is_featured: 0,
    },
    {
      title: 'Core Web Vitals 2025 업데이트 요약',
      content: 'Google Core Web Vitals의 2025년 변경 사항을 정리합니다. INP(Interaction to Next Paint)가 FID를 완전히 대체했으며, 새로운 메트릭 기준값이 적용됩니다. 사이트 성능 개선을 위한 최우선 과제를 확인하세요.',
      category: 'update',
      thumbnail_url: null,
      is_featured: 0,
    },
    {
      title: '콘텐츠 마케팅과 GEO의 시너지 효과',
      content: '양질의 콘텐츠 마케팅은 GEO 성과를 극대화하는 핵심 동력입니다. AI가 참고할 수 있는 권위 있는 콘텐츠를 지속적으로 생산하면, 생성형 검색에서의 브랜드 인용률이 크게 향상됩니다. 실제 사례와 데이터를 통해 확인해봅니다.',
      category: 'tip',
      thumbnail_url: null,
      is_featured: 0,
    },
  ];

  const insertStmt = db.prepare(`
    INSERT INTO feeds (id, title, content, category, thumbnail_url, is_featured, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  for (let i = 0; i < seedFeeds.length; i++) {
    const f = seedFeeds[i];
    // 날짜를 약간씩 다르게 설정
    const d = new Date();
    d.setDate(d.getDate() - i * 2);
    const dateStr = d.toISOString();
    insertStmt.run(randomUUID(), f.title, f.content, f.category, f.thumbnail_url, f.is_featured, dateStr, dateStr);
  }
  console.log(`피드 샘플 데이터 ${seedFeeds.length}개 삽입 완료`);
}

export default db;
