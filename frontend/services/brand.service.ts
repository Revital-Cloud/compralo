import apiWrapper from '@/utils/apiWrapper';
import type { Brand } from '@/types/product';

class BrandService {
  async getAllBrands(): Promise<Brand[]> {
    return apiWrapper.get(`/brands`);
  }

  async getBrand(brandId: number): Promise<Brand> {
    return apiWrapper.get(`/brands/${brandId}`);
  }
}

export const brandService = new BrandService();
