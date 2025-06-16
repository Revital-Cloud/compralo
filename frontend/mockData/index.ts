/**
 * Mock Data Central - Reexportación de todos los datos de ejemplo
 * 
 * Este archivo centraliza todos los datos mock de la aplicación
 * para facilitar el acceso y mantenimiento.
 */

import { Category } from '@/components/layout/shop/categories';
import { Product } from '@/components/layout/shop/new-drops';

// Shop sections mock data
export { 
  newDropsProducts, 
  type Product 
} from '@/components/layout/shop/new-drops/mockData';

export { 
  categories, 
  type Category 
} from '@/components/layout/shop/categories/mockData';

// Configuración de mock data
export const mockConfig = {
  useRealImages: false, // Si es true, usa imágenes reales de Unsplash
  apiDelay: 1000, // Simular delay de API en milisegundos
  itemsPerPage: {
    newDrops: 4,
    categories: 2,
    products: 12
  },
  currency: 'COP',
  currencySymbol: '$'
} as const;

// Utilidades para mock data
export const getMockImageUrl = (width: number, height: number, keyword: string = 'shoes') => {
  return mockConfig.useRealImages 
    ? `https://images.unsplash.com/${width}x${height}/?${keyword}`
    : `/api/placeholder/${width}/${height}`;
};

// Simular delay de API
export const mockApiDelay = () => 
  new Promise(resolve => setTimeout(resolve, mockConfig.apiDelay));

// Generar datos de ejemplo dinámicamente
export const generateMockProduct = (id: string, overrides: Partial<Product> = {}): Product => ({
  id,
  name: "SAMPLE PRODUCT NAME",
  brand: "SAMPLE BRAND",
  price: Math.floor(Math.random() * 200) + 50,
  image: getMockImageUrl(300, 300),
  badge: "NEW",
  rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // Rating entre 3.0 y 5.0
  ...overrides
});

export const generateMockCategory = (id: string, overrides: Partial<Category> = {}): Category => ({
  id,
  name: "SAMPLE CATEGORY",
  image: getMockImageUrl(400, 400),
  productCount: Math.floor(Math.random() * 200) + 20,
  featured: Math.random() > 0.5,
  ...overrides
}); 