import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import db from '../config/db.js';
import type { User, RegisterRequest, SafeUser } from '../types/auth.js';

const SALT_ROUNDS = 12;

/**
 * 회원가입 처리
 */
export async function registerUser(data: RegisterRequest): Promise<SafeUser> {
  const { email, password, name } = data;

  // 이메일 중복 확인
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());

  if (existingUser) {
    throw new Error('이미 등록된 이메일입니다.');
  }

  // 비밀번호 해시
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // 사용자 생성
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, email, password, name, role, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'user', 1, ?, ?)
  `).run(id, email.toLowerCase(), hashedPassword, name || null, now, now);

  // 생성된 사용자 조회
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User;

  // 비밀번호 제외하고 반환
  const { password: _, ...safeUser } = user;
  return safeUser as SafeUser;
}

/**
 * 비밀번호 변경
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // 현재 사용자 조회
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;

  if (!user) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }

  // 현재 비밀번호 확인
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error('현재 비밀번호가 올바르지 않습니다.');
  }

  // 새 비밀번호 해시
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // 비밀번호 업데이트
  db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?")
    .run(hashedPassword, userId);
}

/**
 * 프로필 수정 (이름 변경)
 */
export function updateProfile(userId: string, name: string): SafeUser {
  db.prepare("UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ?")
    .run(name, userId);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
  const { password: _, ...safeUser } = user;
  return safeUser as SafeUser;
}

/**
 * 계정 삭제 (비밀번호 확인 후)
 */
export async function deleteAccount(userId: string, password: string): Promise<void> {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;

  if (!user) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('비밀번호가 올바르지 않습니다.');
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
}

/**
 * 사용자 ID로 조회 (비밀번호 제외)
 */
export function getUserById(userId: string): SafeUser | null {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;

  if (!user) {
    return null;
  }

  const { password: _, ...safeUser } = user;
  return safeUser as SafeUser;
}
