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
  PaginationParams,
  Category,
  Brand,
  Provider,
  ProductLine,
  ProductSubline,
  StockUpdate,
  StockMovement,
  ApiResponse,
  Product,
} from '@/types/product';
import type { PaginatedResponse } from '@/types/common';

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
  formData.append('ind_activo', productData.ind_activo?.toString() || 'true');
  
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
 * Buscar productos
 */
export async function searchProducts(query: string, params?: ProductFilters): Promise<PaginatedResponse<Product>> {
  return await get<PaginatedResponse<Product>>('/products/search', { 
    params: { ...params, q: query } 
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
  searchProducts,
  getProductsByCategory,
  getProductsByBrand,
  getProductsBySubline,
  getFeaturedProducts,
  getProductsOnSale,
  
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