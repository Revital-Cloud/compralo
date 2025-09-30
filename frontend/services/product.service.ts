/**
 * Servicio de Productos
 * 
 * Contiene todas las funciones relacionadas con productos,
 * categorías, marcas, inventario, etc.
 */

import { get, post, put, del } from '@/utils/apiWrapper';
import type {
  ProductCreate,
  ProductUpdate,
  ProductFilters,
  ProductFilterParams,
  ProductFilterResponse,
  ProductFilterStats,
  FilterOptions,
  Category,
  Brand,
  Provider,
  ProductLine,
  ProductSubline,
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
 * Obtener producto por ID compuesto
 * Formato esperado: "{id_categoria}-{id_linea}-{id_sublinea}-{id_producto}"
 */
export async function getProductByIds(
  ids:
    | string
    | {
        id_categoria: string | number
        id_linea: string | number
        id_sublinea: string | number
        id_producto: string | number
      }
): Promise<Product> {
  const slug =
    typeof ids === 'string'
      ? ids
      : `${ids.id_categoria}-${ids.id_linea}-${ids.id_sublinea}-${ids.id_producto}`

  return await get<Product>(`/products/${slug}`)
}

/**
 * Crear nuevo producto
 */
export async function createProduct(productData: ProductCreate): Promise<Product> {
  return await post<Product>('/products', productData);
}

/**
 * Crear nuevo producto con imágenes
 */
export async function createProductWithImages(
  productData: ProductCreate, 
  imageFiles: File[]
): Promise<Product> {
  const formData = new FormData();
  
  // Agregar datos del producto
  formData.append('id_categoria', productData.id_categoria.toString());
  formData.append('id_linea', productData.id_linea.toString());
  formData.append('id_sublinea', productData.id_sublinea.toString());
  formData.append('nom_producto', productData.nom_producto);
  formData.append('spcf_producto', JSON.stringify(productData.spcf_producto));
  formData.append('val_precio', productData.val_precio.toString());
  formData.append('id_proveedor', productData.id_proveedor.toString());
  formData.append('id_marca', productData.id_marca.toString());
  formData.append('num_stock', productData.num_stock?.toString() || '0');
  formData.append('ind_activo', 'true');
  
  // Agregar archivos de imagen
  imageFiles.forEach((file, index) => {
    formData.append('image_files', file);
  });
  
  return await post<Product>('/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * Actualizar producto
 */
export async function updateProduct(id: number, productData: ProductUpdate): Promise<Product> {
  return await put<Product>(`/products/${id}`, productData);
}

/**
 * Eliminar producto
 */
export async function deleteProduct(id: number): Promise<ApiResponse> {
  return await del<ApiResponse>(`/products/${id}`);
}

/**
 * Desactivar producto por IDs compuestos
 */
export async function deactivateProduct(params: {
  id_categoria: number;
  id_linea: number;
  id_sublinea: number;
  id_producto: number;
}): Promise<ApiResponse> {
  const slug = `${params.id_categoria}-${params.id_linea}-${params.id_sublinea}-${params.id_producto}`;
  return await put<ApiResponse>(`/products/${slug}/deactivate`);
}

/**
 * Activar producto (actualiza ind_activo=true) con endpoint dedicado
 */
export async function activateProduct(product: Product): Promise<ApiResponse> {
  const slug = `${product.id_categoria}-${product.id_linea}-${product.id_sublinea}-${product.id_producto}`;
  const formData = new FormData();
  formData.append('active', 'true');
  return await put<ApiResponse>(`/products/${slug}/active`, formData);
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
 * Filtrar productos con criterios avanzados
 */
export async function filterProducts(filters: ProductFilterParams): Promise<ProductFilterResponse> {
  // Convertir arrays a la sintaxis que espera el backend
  const params = new URLSearchParams();
  
  // Agregar parámetros básicos
  if (filters.nombre_producto) params.append('nombre_producto', filters.nombre_producto);
  if (filters.precio_min !== undefined) params.append('precio_min', filters.precio_min.toString());
  if (filters.precio_max !== undefined) params.append('precio_max', filters.precio_max.toString());
  if (filters.stock_min !== undefined) params.append('stock_min', filters.stock_min.toString());
  if (filters.solo_con_stock !== undefined) params.append('solo_con_stock', filters.solo_con_stock.toString());
  if (filters.ordenar_por) params.append('ordenar_por', filters.ordenar_por);
  if (filters.orden) params.append('orden', filters.orden);
  if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
  if (filters.offset !== undefined) params.append('offset', filters.offset.toString());
  
  // Agregar arrays con sintaxis correcta (sin [])
  if (filters.id_categoria) {
    const categories = Array.isArray(filters.id_categoria) ? filters.id_categoria : [filters.id_categoria];
    categories.forEach(id => params.append('id_categoria', id.toString()));
  }
  if (filters.id_linea) {
    const lines = Array.isArray(filters.id_linea) ? filters.id_linea : [filters.id_linea];
    lines.forEach(id => params.append('id_linea', id.toString()));
  }
  if (filters.id_sublinea) {
    const sublines = Array.isArray(filters.id_sublinea) ? filters.id_sublinea : [filters.id_sublinea];
    sublines.forEach(id => params.append('id_sublinea', id.toString()));
  }
  if (filters.id_marca) {
    const brands = Array.isArray(filters.id_marca) ? filters.id_marca : [filters.id_marca];
    brands.forEach(id => params.append('id_marca', id.toString()));
  }
  if (filters.id_proveedor) {
    const providers = Array.isArray(filters.id_proveedor) ? filters.id_proveedor : [filters.id_proveedor];
    providers.forEach(id => params.append('id_proveedor', id.toString()));
  }
  
  return await get<ProductFilterResponse>(`/products/filter?${params.toString()}`);
}

/**
 * Obtener estadísticas de productos filtrados
 */
export async function getFilterStats(filters: ProductFilterParams): Promise<ProductFilterStats> {
  // Convertir arrays a la sintaxis que espera el backend
  const params = new URLSearchParams();
  
  // Agregar parámetros básicos
  if (filters.nombre_producto) params.append('nombre_producto', filters.nombre_producto);
  if (filters.precio_min !== undefined) params.append('precio_min', filters.precio_min.toString());
  if (filters.precio_max !== undefined) params.append('precio_max', filters.precio_max.toString());
  if (filters.stock_min !== undefined) params.append('stock_min', filters.stock_min.toString());
  if (filters.solo_con_stock !== undefined) params.append('solo_con_stock', filters.solo_con_stock.toString());
  if (filters.ordenar_por) params.append('ordenar_por', filters.ordenar_por);
  if (filters.orden) params.append('orden', filters.orden);
  if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
  if (filters.offset !== undefined) params.append('offset', filters.offset.toString());
  
  // Agregar arrays con sintaxis correcta (sin [])
  if (filters.id_categoria) {
    const categories = Array.isArray(filters.id_categoria) ? filters.id_categoria : [filters.id_categoria];
    categories.forEach(id => params.append('id_categoria', id.toString()));
  }
  if (filters.id_linea) {
    const lines = Array.isArray(filters.id_linea) ? filters.id_linea : [filters.id_linea];
    lines.forEach(id => params.append('id_linea', id.toString()));
  }
  if (filters.id_sublinea) {
    const sublines = Array.isArray(filters.id_sublinea) ? filters.id_sublinea : [filters.id_sublinea];
    sublines.forEach(id => params.append('id_sublinea', id.toString()));
  }
  if (filters.id_marca) {
    const brands = Array.isArray(filters.id_marca) ? filters.id_marca : [filters.id_marca];
    brands.forEach(id => params.append('id_marca', id.toString()));
  }
  if (filters.id_proveedor) {
    const providers = Array.isArray(filters.id_proveedor) ? filters.id_proveedor : [filters.id_proveedor];
    providers.forEach(id => params.append('id_proveedor', id.toString()));
  }
  
  return await get<ProductFilterStats>(`/products/filter/stats?${params.toString()}`);
}

/**
 * Obtener opciones disponibles para los filtros
 */
export async function getFilterOptions(): Promise<FilterOptions> {
  return await get<FilterOptions>('/products/filter/options');
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
 * Obtener productos por sublínea
 */
export async function getProductsBySubline(sublineId: number, params?: PaginationParams): Promise<PaginatedResponse<Product>> {
  return await get<PaginatedResponse<Product>>(`/products/subline/${sublineId}`, { params });
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
  return await put<Product>(`/products/${stockData.id_producto}/stock`, stockData);
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
// FUNCIONES DE LÍNEAS Y SUBLÍNEAS
// =============================================================================

/**
 * Obtener todas las líneas
 */
export async function getProductLines(): Promise<ProductLine[]> {
  return await get<ProductLine[]>('/lines');
}

/**
 * Obtener sublíneas por línea
 */
export async function getSublinesByLine(lineId: number): Promise<ProductSubline[]> {
  return await get<ProductSubline[]>(`/lines/${lineId}/sublines`);
}

// =============================================================================
// EXPORT COMO OBJETO PARA COMPATIBILIDAD
// =============================================================================

const productService = {
  // Productos
  getProducts,
  getProductByIds,
  createProduct,
  updateProduct,
  deleteProduct,
  deactivateProduct,
  activateProduct,
  searchProducts,
  getProductsByCategory,
  getProductsByBrand,
  getProductsBySubline,
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
  
  // Líneas
  getProductLines,
  getSublinesByLine,
};

export default productService; 