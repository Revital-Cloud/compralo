/**
 * Servicio de Categorías
 * 
 * Contiene todas las funciones relacionadas con categorías
 */

import { get, post, put, del } from '@/utils/apiWrapper';
import { Category } from '@/types/category';
import type { ApiResponse } from '@/types';

// =============================================================================
// FUNCIONES DE CATEGORÍAS
// =============================================================================

/**
 * Obtener todas las categorías
 */
export async function getCategories(): Promise<Category[]> {
  console.log('Category service: Fetching categories from /categories');
  try {
    const categories = await get<Category[]>('/categories');
    console.log('Category service: Raw response:', categories);
    
    const isActive = (c: Category) => (c.ind_activo ?? c.is_active) !== false
    const activeCategories = categories.filter(isActive);
    console.log('Category service: Active categories:', activeCategories);
    
    return activeCategories;
  } catch (error) {
    console.error('Category service: Error fetching categories:', error);
    throw error;
  }
}

/**
 * Obtener todas las categorías (incluyendo inactivas)
 */
export async function getAllCategories(): Promise<Category[]> {
  return await get<Category[]>('/categories');
}

/**
 * Obtener categoría por ID
 */
export async function getCategoryById(id: string | number): Promise<Category> {
  return await get<Category>(`/categories/${id}`);
}

export interface CategoryAttributeResponse {
  id: number;
  category_id: number;
  attribute_id: number;
  is_required: boolean;
  is_filterable: boolean;
  attribute_name?: string;
  data_type?: string;
  has_predefined_values?: boolean;
}

export interface AttributeValueSummary {
  id: number;
  value: string;
  hex_color?: string | null;
  sort_order: number;
}

export interface CategoryAttributeWithValuesResponse extends CategoryAttributeResponse {
  values?: AttributeValueSummary[];
}

/**
 * Obtener atributos de una categoría con sus valores predefinidos (para formulario de producto).
 */
export async function getCategoryAttributesWithValues(
  categoryId: string | number
): Promise<CategoryAttributeWithValuesResponse[]> {
  return await get<CategoryAttributeWithValuesResponse[]>(
    `/categories/${categoryId}/attributes-with-values`
  );
}

export interface CategoryAttributeItem {
  attribute_id: number;
  is_required: boolean;
  is_filterable: boolean;
}

/**
 * Crear nueva categoría (acepta parent_id). Devuelve message e id_categoria.
 */
export async function createCategory(categoryData: {
  name: string;
  is_active?: boolean;
  parent_id?: number | null;
}): Promise<ApiResponse & { id?: number }> {
  return await post<ApiResponse & { id?: number }>('/categories', categoryData);
}

/**
 * Actualizar categoría (acepta parent_id)
 */
export async function updateCategory(
  id: string | number, 
  categoryData: {
    name?: string;
    is_active?: boolean;
    parent_id?: number | null;
  }
): Promise<ApiResponse> {
  console.log('Updating category with ID:', id, 'Data:', categoryData);
  try {
    const result = await put<ApiResponse>(`/categories/${id}`, categoryData);
    console.log('Category updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

/**
 * Obtener atributos de una categoría
 */
export async function getCategoryAttributes(categoryId: string | number): Promise<CategoryAttributeResponse[]> {
  return await get<CategoryAttributeResponse[]>(`/categories/${categoryId}/attributes`);
}

/**
 * Actualizar atributos de una categoría (reemplaza la lista)
 */
export async function updateCategoryAttributes(
  categoryId: string | number,
  attributes: CategoryAttributeItem[]
): Promise<ApiResponse> {
  return await put<ApiResponse>(`/categories/${categoryId}/attributes`, { attributes });
}

/**
 * Activar o desactivar categoría
 */
export async function deactivateActivateCategory(id: string | number, activar: boolean): Promise<ApiResponse> {
  console.log(`${activar ? 'Activating' : 'Deactivating'} category with ID:`, id, 'Type:', typeof id);
  try {
    const result = await put<ApiResponse>(`/categories/${id}/toggle`, { activar });
    console.log(`Category ${activar ? 'activated' : 'deactivated'} successfully:`, result);
    return result;
  } catch (error) {
    console.error(`Error ${activar ? 'activating' : 'deactivating'} category:`, error);
    throw error;
  }
}

/**
 * Desactivar categoría (mantener compatibilidad)
 */
export async function deactivateCategory(id: string | number): Promise<ApiResponse> {
  return deactivateActivateCategory(id, false);
}

/**
 * Obtener categorías activas solamente
 */
export async function getActiveCategories(): Promise<Category[]> {
  return await getCategories(); // Ya filtra por activas
}

// =============================================================================
// EXPORT COMO OBJETO PARA COMPATIBILIDAD
// =============================================================================

const categoryService = {
  getCategories,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deactivateActivateCategory,
  deactivateCategory,
  getActiveCategories,
};

export default categoryService;
