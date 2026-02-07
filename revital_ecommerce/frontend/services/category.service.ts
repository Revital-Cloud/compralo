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
    
    const activeCategories = categories.filter(category => category.ind_activo);
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

/**
 * Crear nueva categoría
 */
export async function createCategory(categoryData: {
  nom_categoria: string;
  ind_activo?: boolean;
}): Promise<ApiResponse> {
  return await post<ApiResponse>('/categories', categoryData);
}

/**
 * Actualizar categoría
 */
export async function updateCategory(
  id: string | number, 
  categoryData: {
    nom_categoria?: string;
    ind_activo?: boolean;
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
