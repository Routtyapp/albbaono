import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 업로드 디렉토리 설정
const uploadDir = resolve(__dirname, '../../../uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// 허용 이미지 확장자
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다. (JPEG, PNG, GIF, WebP, SVG만 가능)'));
    }
  },
});

const router = Router();

// POST /api/upload — 이미지 업로드 (인증 사용자)
router.post('/', upload.single('image'), (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '파일이 없습니다.' });
  }

  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

// 에러 핸들링 (multer 에러)
router.use((err: any, _req: any, res: any, _next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: '파일 크기는 5MB 이하여야 합니다.' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
