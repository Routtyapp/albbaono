import type { Brand } from '../types';
import { apiGet, apiMutate } from './client';

export async function getBrands(): Promise<{ brands: Brand[] }> {
  return apiGet('/api/brands');
}

export async function addBrand(data: {
  name: string;
  competitors: string[];
  marketingPoints?: string[];
  keywords?: string[];
}): Promise<Brand> {
  return apiMutate('/api/brands', 'POST', data);
}

export async function updateBrand(id: string, data: {
  name: string;
  competitors: string[];
  marketingPoints?: string[];
  keywords?: string[];
}): Promise<void> {
  return apiMutate(`/api/brands/${id}`, 'PUT', data);
}

export async function deleteBrand(id: string): Promise<void> {
  return apiMutate(`/api/brands/${id}`, 'DELETE');
}
