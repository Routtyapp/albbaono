#!/bin/bash
# 마이그레이션 완료 스크립트
# Vite 서버를 중지한 후 실행하세요

DATA_DIR="src/data"
DB_FILE="geo-tracker.db"
NEW_DB=$(ls -t $DATA_DIR/geo-tracker.db.new.* 2>/dev/null | head -1)

if [ -z "$NEW_DB" ]; then
  echo "새로 마이그레이션된 DB 파일을 찾을 수 없습니다."
  exit 1
fi

echo "기존 DB 백업 중..."
if [ -f "$DATA_DIR/$DB_FILE" ]; then
  mv "$DATA_DIR/$DB_FILE" "$DATA_DIR/$DB_FILE.old.$(date +%s)"
fi

# WAL 파일들도 정리
rm -f "$DATA_DIR/$DB_FILE-wal" "$DATA_DIR/$DB_FILE-shm" 2>/dev/null

echo "새 DB로 교체 중..."
mv "$NEW_DB" "$DATA_DIR/$DB_FILE"

echo "완료! 이제 'npm run dev'로 서버를 시작하세요."
