import { getDatabase } from '../index';

// 타입 정의
export interface Brand {
  id: string;
  name: string;
  competitors: string[];
  createdAt: string;
  isActive?: boolean;
}

interface BrandRow {
  id: string;
  name: string;
  competitors: string | null;
  created_at: string;
  is_active: number;
}

/**
 * 모든 브랜드 조회
 */
export function getAllBrands(): Brand[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT id, name, competitors, created_at, is_active
    FROM brands
    WHERE is_active = 1
    ORDER BY created_at DESC
  `).all() as BrandRow[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    competitors: row.competitors ? JSON.parse(row.competitors) : [],
    createdAt: row.created_at,
    isActive: row.is_active === 1,
  }));
}

/**
 * ID로 브랜드 조회
 */
export function getBrandById(id: string): Brand | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT id, name, competitors, created_at, is_active
    FROM brands
    WHERE id = ?
  `).get(id) as BrandRow | undefined;

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    competitors: row.competitors ? JSON.parse(row.competitors) : [],
    createdAt: row.created_at,
    isActive: row.is_active === 1,
  };
}

/**
 * 브랜드 생성
 */
export function createBrand(data: { name: string; competitors?: string[] }): Brand {
  const db = getDatabase();
  const id = String(Date.now());
  const createdAt = new Date().toISOString();
  const competitors = data.competitors || [];

  db.prepare(`
    INSERT INTO brands (id, name, competitors, created_at, is_active)
    VALUES (?, ?, ?, ?, 1)
  `).run(id, data.name, JSON.stringify(competitors), createdAt);

  return {
    id,
    name: data.name,
    competitors,
    createdAt,
    isActive: true,
  };
}

/**
 * 브랜드 업데이트
 */
export function updateBrand(id: string, data: { name?: string; competitors?: string[] }): boolean {
  const db = getDatabase();
  const brand = getBrandById(id);
  if (!brand) return false;

  const name = data.name ?? brand.name;
  const competitors = data.competitors ?? brand.competitors;

  db.prepare(`
    UPDATE brands
    SET name = ?, competitors = ?
    WHERE id = ?
  `).run(name, JSON.stringify(competitors), id);

  return true;
}

/**
 * 브랜드 삭제 (소프트 삭제)
 */
export function deleteBrand(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare(`
    DELETE FROM brands WHERE id = ?
  `).run(id);

  return result.changes > 0;
}

/**
 * 브랜드 데이터 가져오기 (API 응답 형식)
 */
export function getBrandsData(): { brands: Brand[]; lastUpdated: string | null } {
  const brands = getAllBrands();
  const lastBrand = brands[0];
  return {
    brands,
    lastUpdated: lastBrand?.createdAt || null,
  };
}
