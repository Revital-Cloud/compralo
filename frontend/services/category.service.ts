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
  const categories = await get<Category[]>('/categories');
  return categories.filter(category => category.ind_activo); // Solo categorías activas
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
  return await put<ApiResponse>(`/categories/${id}`, categoryData);
}

/**
 * Desactivar categoría
 */
export async function deactivateCategory(id: string | number): Promise<ApiResponse> {
  return await put<ApiResponse>(`/categories/${id}/deactivate`);
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
  deactivateCategory,
  getActiveCategories,
};

export default categoryService;
