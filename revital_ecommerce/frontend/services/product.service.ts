/**
 * Servicio de Productos
 * 
 * Contiene todas las funciones relacionadas con productos,
 * categorías, marcas, inventario, etc.
 *
 * Mapa:
 * - Storefront: catálogo, búsqueda, filtros avanzados y detalle por slug/id.
 * - Admin: listado avanzado, creación/edición compuesta y toggles de estado.
 * - Catálogos auxiliares: categorías, marcas, proveedores.
 */

import { get, post, put, del } from '@/utils/apiWrapper';
import type {
  ProductCreate,
  ProductCreateComposite,
  ProductUpdate,
  ProductFilters,
  ProductFilterParams,
  ProductFilterResponse,
  ProductFilterStats,
  FilterOptions,
  Category,
  Brand,
  Provider,
  StockUpdate,
  StockMovement,
  Product,
  ProductAdmin,
  ProductAdminParams,
} from '@/types/product';
import type { PaginatedResponse, ApiResponse, PaginationParams } from '@/types/common';

// =============================================================================
// FUNCIONES DE PRODUCTOS
// =============================================================================

/**
 * Obtener lista de productos
 */
export async function getProducts(params?: ProductFilters): Promise<Product[] | PaginatedResponse<Product>> {
  if (params) {
    return await get<PaginatedResponse<Product>>('/products', { params });
  }
  return await get<Product[]>('/products');
}

/**
 * Obtener productos para administración (solo admin)
 */
export async function getProductsAdmin(params?: ProductAdminParams): Promise<ProductAdmin[]> {
  return await get<ProductAdmin[]>('/products-admin', { params });
}

/**
 * Obtener producto por slug o ID (tienda: GET /products/{slug_or_id})
 */
export async function getProductBySlugOrId(slugOrId: string): Promise<Product> {
  return await get<Product>(`/products/${slugOrId}`);
}

/**
 * Sube una imagen y devuelve la URL. Usado para imágenes de variantes en el admin.
 */
export async function uploadProductImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const { post } = await import('@/utils/apiWrapper');
  return await post<{ url: string }>('/products/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** Detalle para edición: producto + variantes + image_urls (solo product_id) */
export interface ProductAdminDetailComposite {
  product: { name: string; category_id: number; id_marca?: number | null; id_proveedor?: number | null; description?: string | null; is_active: boolean }
  variants: Array<{
    id?: number
    sku?: string | null
    price: number
    stock: number
    is_active: boolean
    tipo_clasificacion?: string | null
    attributes?: Record<string, string | number | boolean>
  }>
  image_urls: string[]
  images_by_variant?: Record<string, Array<{ image_url: string; is_main: boolean; sort_order: number }>>
}

export async function getProductAdminDetailById(productId: string | number): Promise<ProductAdminDetailComposite> {
  return await get<ProductAdminDetailComposite>(`/products/${productId}/admin-detail`)
}

/**
 * Actualizar producto compuesto (producto + variantes + imágenes)
 */
export async function updateProductComposite(
  productId: string | number,
  payload: ProductCreateComposite,
  imageFiles?: File[]
): Promise<ApiResponse & { message?: string }> {
  if (imageFiles && imageFiles.length > 0) {
    const formData = new FormData()
    formData.append('payload', JSON.stringify(payload))
    imageFiles.forEach((f) => formData.append('image_files', f))
    return await put<ApiResponse & { message?: string }>(`/products/${productId}/composite`, formData)
  }
  return await put<ApiResponse & { message?: string }>(`/products/${productId}/composite`, payload)
}

/**
 * Activar o desactivar producto por product_id
 */
export async function deactivateActivateProductById(
  productId: number,
  activar: boolean
): Promise<ApiResponse> {
  return await put<ApiResponse>(`/products/${productId}/toggle`, { activar })
}

/**
 * Crear producto compuesto (producto + variantes + imágenes)
 */
export async function createProductComposite(
  payload: ProductCreateComposite,
  imageFiles?: File[]
): Promise<ApiResponse & { message?: string }> {
  if (imageFiles && imageFiles.length > 0) {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));
    imageFiles.forEach((f) => formData.append('image_files', f));
    return await post<ApiResponse & { message?: string }>('/products/composite', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return await post<ApiResponse & { message?: string }>('/products/composite', payload);
}

/**
 * Eliminar producto por ID
 */
export async function deleteProduct(id: number): Promise<ApiResponse> {
  return await del<ApiResponse>(`/products/${id}`);
}

/**
 * Buscar productos
 */
export async function searchProducts(query: string, params?: ProductFilters): Promise<PaginatedResponse<Product>> {
  return await get<PaginatedResponse<Product>>('/products/search', { 
    params: { ...params, q: query } 
  });
}

// =============================================================================
// FUNCIONES DE FILTROS AVANZADOS (NUEVOS)
// =============================================================================

/**
 * Filtrar productos con criterios avanzados.
 * Backend: category_id (uno), include_subcategories, precio_min/max, atributos (JSON), id_marca.
 *
 * Endpoint:
 * - `GET /products/filter`
 */
export async function filterProducts(filters: ProductFilterParams): Promise<ProductFilterResponse> {
  const params = new URLSearchParams();

  if (filters.nombre_producto) params.append('nombre_producto', filters.nombre_producto);
  if (filters.precio_min !== undefined) params.append('precio_min', filters.precio_min.toString());
  if (filters.precio_max !== undefined) params.append('precio_max', filters.precio_max.toString());
  if (filters.solo_con_stock !== undefined) params.append('solo_con_stock', filters.solo_con_stock.toString());
  if (filters.solo_en_oferta !== undefined) params.append('solo_en_oferta', filters.solo_en_oferta.toString());
  if (filters.ordenar_por) params.append('ordenar_por', filters.ordenar_por);
  if (filters.orden) params.append('orden', filters.orden);
  if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
  if (filters.offset !== undefined) params.append('offset', filters.offset.toString());

  if (filters.category_id !== undefined) params.append('category_id', filters.category_id.toString());
  if (filters.include_subcategories !== undefined) params.append('include_subcategories', filters.include_subcategories.toString());
  if (filters.id_marca !== undefined) params.append('id_marca', filters.id_marca.toString());

  if (filters.atributos && Object.keys(filters.atributos).length > 0) {
    params.append('atributos', JSON.stringify(filters.atributos));
  }

  return await get<ProductFilterResponse>(`/products/filter?${params.toString()}`);
}

/**
 * Obtener estadísticas de productos filtrados (mismos params que filter)
 */
export async function getFilterStats(filters: ProductFilterParams): Promise<ProductFilterStats> {
  const params = new URLSearchParams();

  if (filters.nombre_producto) params.append('nombre_producto', filters.nombre_producto);
  if (filters.precio_min !== undefined) params.append('precio_min', filters.precio_min.toString());
  if (filters.precio_max !== undefined) params.append('precio_max', filters.precio_max.toString());
  if (filters.solo_con_stock !== undefined) params.append('solo_con_stock', filters.solo_con_stock.toString());
  if (filters.solo_en_oferta !== undefined) params.append('solo_en_oferta', filters.solo_en_oferta.toString());
  if (filters.ordenar_por) params.append('ordenar_por', filters.ordenar_por);
  if (filters.orden) params.append('orden', filters.orden);
  if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
  if (filters.offset !== undefined) params.append('offset', filters.offset.toString());

  if (filters.category_id !== undefined) params.append('category_id', filters.category_id.toString());
  if (filters.include_subcategories !== undefined) params.append('include_subcategories', filters.include_subcategories.toString());
  if (filters.id_marca !== undefined) params.append('id_marca', filters.id_marca.toString());

  if (filters.atributos && Object.keys(filters.atributos).length > 0) {
    params.append('atributos', JSON.stringify(filters.atributos));
  }

  return await get<ProductFilterStats>(`/products/filter/stats?${params.toString()}`);
}

/**
 * Obtener opciones disponibles para los filtros (tienda: solo activos).
 * Si se pasa categoryId, el backend devuelve atributos filtrables solo de esa categoría.
 *
 * Endpoint:
 * - `GET /products/filter/options`
 */
export async function getFilterOptions(categoryId?: number | null): Promise<FilterOptions> {
  const params = categoryId != null ? { category_id: categoryId } : {};
  return await get<FilterOptions>('/products/filter/options', { params });
}

/**
 * Obtener opciones de filtro para admin (incluye activos e inactivos)
 */
export async function getFilterOptionsAdmin(): Promise<FilterOptions> {
  return await get<FilterOptions>('/products-admin/filter-options');
}

/**
 * Búsqueda rápida de productos por nombre
 */
export async function quickSearchProducts(query: string, limit: number = 20): Promise<ProductFilterResponse> {
  return await get<ProductFilterResponse>('/products/search', { 
    params: { q: query, limit } 
  });
}

/**
 * Obtener productos por categoría
 */
export async function getProductsByCategory(categoryId: number, params?: PaginationParams): Promise<PaginatedResponse<Product>> {
  return await get<PaginatedResponse<Product>>(`/products/category/${categoryId}`, { params });
}

/**
 * Obtener productos por marca
 */
export async function getProductsByBrand(brandId: number, params?: PaginationParams): Promise<PaginatedResponse<Product>> {
  return await get<PaginatedResponse<Product>>(`/products/brand/${brandId}`, { params });
}

/**
 * Obtener productos destacados
 */
export async function getFeaturedProducts(limit?: number): Promise<Product[]> {
  return await get<Product[]>('/products', { params: { limit } });
}

/**
 * Obtener productos en oferta
 */
export async function getProductsOnSale(params?: PaginationParams): Promise<PaginatedResponse<Product>> {
  return await get<PaginatedResponse<Product>>('/products/sale', { params });
}

// =============================================================================
// FUNCIONES DE INVENTARIO
// =============================================================================

/**
 * Actualizar stock de producto
 */
export async function updateProductStock(stockData: StockUpdate): Promise<Product> {
  return await put<Product>(`/products/${stockData.id}/stock`, stockData);
}

/**
 * Obtener movimientos de stock
 */
export async function getStockMovements(productId: number, params?: PaginationParams): Promise<PaginatedResponse<StockMovement>> {
  return await get<PaginatedResponse<StockMovement>>(`/products/${productId}/stock/movements`, { params });
}

/**
 * Obtener productos con stock bajo
 */
export async function getLowStockProducts(threshold?: number): Promise<Product[]> {
  return await get<Product[]>('/products/low-stock', { params: { threshold } });
}

/**
 * Obtener reporte de inventario
 */
export async function getInventoryReport(): Promise<{
  total_products: number;
  total_stock: number;
  low_stock_count: number;
  out_of_stock_count: number;
  by_category: Record<string, number>;
}> {
  return await get('/products/inventory/report');
}

// =============================================================================
// FUNCIONES DE CATEGORÍAS
// =============================================================================

/**
 * Obtener todas las categorías
 */
export async function getCategories(): Promise<Category[]> {
  return await get<Category[]>('/categories');
}

/**
 * Obtener categoría por ID
 */
export async function getCategoryById(id: number): Promise<Category> {
  return await get<Category>(`/categories/${id}`);
}

/**
 * Crear nueva categoría
 */
export async function createCategory(categoryData: Omit<Category, 'id_categoria'>): Promise<Category> {
  return await post<Category>('/categories', categoryData);
}

/**
 * Actualizar categoría
 */
export async function updateCategory(id: number, categoryData: Partial<Category>): Promise<Category> {
  return await put<Category>(`/categories/${id}`, categoryData);
}

/**
 * Eliminar categoría
 */
export async function deleteCategory(id: number): Promise<ApiResponse> {
  return await del<ApiResponse>(`/categories/${id}`);
}

// =============================================================================
// FUNCIONES DE MARCAS
// =============================================================================

/**
 * Obtener todas las marcas
 */
export async function getBrands(): Promise<Brand[]> {
  return await get<Brand[]>('/brands');
}

/**
 * Obtener marca por ID
 */
export async function getBrandById(id: number): Promise<Brand> {
  return await get<Brand>(`/brands/${id}`);
}

/**
 * Crear nueva marca
 */
export async function createBrand(brandData: Omit<Brand, 'id_marca'>): Promise<Brand> {
  return await post<Brand>('/brands', brandData);
}

/**
 * Actualizar marca
 */
export async function updateBrand(id: number, brandData: Partial<Brand>): Promise<Brand> {
  return await put<Brand>(`/brands/${id}`, brandData);
}

/**
 * Eliminar marca
 */
export async function deleteBrand(id: number): Promise<ApiResponse> {
  return await del<ApiResponse>(`/brands/${id}`);
}

// =============================================================================
// FUNCIONES DE PROVEEDORES
// =============================================================================

/**
 * Obtener todos los proveedores
 */
export async function getProviders(): Promise<Provider[]> {
  return await get<Provider[]>('/providers');
}

/**
 * Obtener proveedor por ID
 */
export async function getProviderById(id: number): Promise<Provider> {
  return await get<Provider>(`/providers/${id}`);
}

/**
 * Crear nuevo proveedor
 */
export async function createProvider(providerData: Omit<Provider, 'id_proveedor'>): Promise<Provider> {
  return await post<Provider>('/providers', providerData);
}

/**
 * Actualizar proveedor
 */
export async function updateProvider(id: number, providerData: Partial<Provider>): Promise<Provider> {
  return await put<Provider>(`/providers/${id}`, providerData);
}

/**
 * Eliminar proveedor
 */
export async function deleteProvider(id: number): Promise<ApiResponse> {
  return await del<ApiResponse>(`/providers/${id}`);
}

// =============================================================================
// EXPORT COMO OBJETO PARA COMPATIBILIDAD
// =============================================================================

const productService = {
  getProducts,
  getProductBySlugOrId,
  getProductAdminDetailById,
  createProductComposite,
  updateProductComposite,
  deactivateActivateProductById,
  deleteProduct,
  searchProducts,
  getProductsByCategory,
  getProductsByBrand,
  getFeaturedProducts,
  getProductsOnSale,
  
  // Filtros avanzados
  filterProducts,
  getFilterStats,
  getFilterOptions,
  quickSearchProducts,
  
  // Inventario
  updateProductStock,
  getStockMovements,
  getLowStockProducts,
  getInventoryReport,
  
  // Categorías
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Marcas
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  
  // Proveedores
  getProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
};

export default productService; 