import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../config/db.js';
import { isAdmin } from '../middleware/auth.js';

const router = Router();

// GET / — 피드 목록 조회 (인증 사용자)
router.get('/', (req, res) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
  const category = req.query.category as string | undefined;
  const offset = (page - 1) * limit;

  const whereClause = category ? 'WHERE is_published = 1 AND category = ?' : 'WHERE is_published = 1';
  const whereParams = category ? [category] : [];

  const feeds = db.prepare(`
    SELECT id, title, content, category, is_published, thumbnail_url, is_featured, created_at, updated_at
    FROM feeds ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...whereParams, limit, offset) as any[];

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM feeds ${whereClause}`
  ).get(...whereParams) as { count: number };

  const parsed = feeds.map((f: any) => ({
    id: f.id,
    title: f.title,
    content: f.content,
    category: f.category,
    isPublished: !!f.is_published,
    thumbnailUrl: f.thumbnail_url,
    isFeatured: !!f.is_featured,
    createdAt: f.created_at,
    updatedAt: f.updated_at,
  }));

  res.json({
    feeds: parsed,
    total: total.count,
    page,
    limit,
    hasMore: offset + feeds.length < total.count,
  });
});

// GET /:id — 피드 상세 조회 (인증 사용자)
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const feed = db.prepare(`
    SELECT id, title, content, category, is_published, thumbnail_url, is_featured, created_at, updated_at
    FROM feeds WHERE id = ?
  `).get(id) as any;

  if (!feed) {
    return res.status(404).json({ success: false, message: '피드를 찾을 수 없습니다.' });
  }

  res.json({
    id: feed.id,
    title: feed.title,
    content: feed.content,
    category: feed.category,
    isPublished: !!feed.is_published,
    thumbnailUrl: feed.thumbnail_url,
    isFeatured: !!feed.is_featured,
    createdAt: feed.created_at,
    updatedAt: feed.updated_at,
  });
});

// POST / — 피드 작성 (admin)
router.post('/', isAdmin, (req, res) => {
  const { title, content, category = 'general', thumbnailUrl, isFeatured } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: '제목과 본문은 필수입니다.' });
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO feeds (id, title, content, category, thumbnail_url, is_featured, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, content, category, thumbnailUrl || null, isFeatured ? 1 : 0, now, now);

  res.status(201).json({
    id,
    title,
    content,
    category,
    thumbnailUrl: thumbnailUrl || null,
    isFeatured: !!isFeatured,
    isPublished: true,
    createdAt: now,
    updatedAt: now,
  });
});

// PUT /:id — 피드 수정 (admin)
router.put('/:id', isAdmin, (req, res) => {
  const { id } = req.params;
  const { title, content, category, thumbnailUrl, isFeatured } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: '제목과 본문은 필수입니다.' });
  }

  const now = new Date().toISOString();

  const result = db.prepare(`
    UPDATE feeds SET title = ?, content = ?, category = ?, thumbnail_url = ?, is_featured = ?, updated_at = ?
    WHERE id = ?
  `).run(title, content, category || 'general', thumbnailUrl || null, isFeatured ? 1 : 0, now, id);

  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: '피드를 찾을 수 없습니다.' });
  }

  res.json({
    id,
    title,
    content,
    category: category || 'general',
    thumbnailUrl: thumbnailUrl || null,
    isFeatured: !!isFeatured,
    isPublished: true,
    updatedAt: now,
  });
});

// DELETE /:id — 피드 삭제 (admin)
router.delete('/:id', isAdmin, (req, res) => {
  const { id } = req.params;

  const result = db.prepare('DELETE FROM feeds WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: '피드를 찾을 수 없습니다.' });
  }

  res.json({ success: true });
});

export default router;
