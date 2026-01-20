import apiWrapper from '@/utils/apiWrapper';
import type { Brand } from '@/types/product';

class BrandService {
  async getAllBrands(): Promise<Brand[]> {
    return apiWrapper.get(`/brands`);
  }

  async getBrand(brandId: number): Promise<Brand> {
    return apiWrapper.get(`/brands/${brandId}`);
  }

  async updateBrand(brandId: number, payload: { nom_marca?: string; des_marca?: string; ind_activo?: boolean }): Promise<{ message: string }> {
    return apiWrapper.put(`/brands/${brandId}`, payload);
  }

  async deactivateActivateBrand(brandId: number, activar: boolean): Promise<{ message: string }> {
    return apiWrapper.put(`/brands/${brandId}/toggle`, { activar });
  }

  async deactivateBrand(brandId: number): Promise<{ message: string }> {
    return this.deactivateActivateBrand(brandId, false);
  }

  async createBrand(payload: { nom_marca: string; des_marca?: string; ind_activo?: boolean }): Promise<Brand> {
    return apiWrapper.post(`/brands`, payload);
  }
}

export const brandService = new BrandService();
