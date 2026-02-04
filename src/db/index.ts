import Database from 'better-sqlite3';
import * as path from 'path';
import { initializeSchema } from './schema';

// 데이터베이스 파일 경로
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const DB_PATH = path.join(DATA_DIR, 'geo-tracker.db');

// 데이터베이스 인스턴스 (싱글톤)
let db: Database.Database | null = null;

/**
 * 데이터베이스 인스턴스 가져오기 (싱글톤 패턴)
 */
export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    // WAL 모드 활성화 (성능 향상)
    db.pragma('journal_mode = WAL');
    // 외래 키 제약조건 활성화
    db.pragma('foreign_keys = ON');
    // 스키마 초기화
    initializeSchema(db);
  }
  return db;
}

/**
 * 데이터베이스 연결 종료
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * 트랜잭션 래퍼
 */
export function transaction<T>(fn: () => T): T {
  const database = getDatabase();
  return database.transaction(fn)();
}

// 편의를 위한 기본 export
export { Database };
export default getDatabase;
