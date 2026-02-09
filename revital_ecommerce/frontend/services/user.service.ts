/**
 * Servicio de Usuarios
 * 
 * Contiene todas las funciones relacionadas con gestión de usuarios,
 * perfiles, roles, etc.
 */

import { get, post, put, del } from '@/utils/apiWrapper';
import type {
  User,
  UserCreate,
  UserUpdate,
  UserProfile,
  UpdateProfileRequest,
  PaginationParams,
  PaginatedResponse,
  UserFilters,
  ApiResponse,
} from '@/types';

// =============================================================================
// FUNCIONES DE PERFIL DE USUARIO
// =============================================================================

/**
 * Obtener perfil del usuario actual
 */
export async function getCurrentUser(): Promise<User> {
  return await get<User>('/users/me');
}

/**
 * Actualizar perfil del usuario actual
 */
export async function updateCurrentUser(userData: UserUpdate): Promise<User> {
  return await put<User>('/users/me', userData);
}

/**
 * Obtener perfil público de usuario
 */
export async function getUserProfile(id: number): Promise<UserProfile> {
  return await get<UserProfile>(`/users/${id}/profile`);
}

/**
 * Actualizar perfil público
 */
export async function updateProfile(profileData: UpdateProfileRequest): Promise<UserProfile> {
  return await put<UserProfile>('/users/me/profile', profileData);
}

/**
 * Subir avatar del usuario
 */
export async function uploadAvatar(file: File): Promise<{ avatar_url: string }> {
  const formData = new FormData();
  formData.append('avatar', file);
  
  return await post<{ avatar_url: string }>('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// =============================================================================
// FUNCIONES DE GESTIÓN DE USUARIOS (ADMIN)
// =============================================================================

/**
 * Obtener lista de usuarios (para admin)
 */
export async function getUsers(params?: UserFilters): Promise<PaginatedResponse<User>> {
  // La API requiere JWT; apiWrapper ya inserta Authorization si hay token
  // Este método solo reenvía los params
  return await get<PaginatedResponse<User>>('/users', { params });
}

/**
 * Obtener usuario por ID (admin)
 */
export async function getUserById(id: number): Promise<User> {
  return await get<User>(`/users/${id}`);
}

/**
 * Crear nuevo usuario (admin)
 */
export async function createUser(userData: UserCreate): Promise<User> {
  return await post<User>('/users', userData);
}

/**
 * Actualizar usuario (admin)
 */
export async function updateUser(id: number, userData: UserUpdate): Promise<User> {
  return await put<User>(`/users/${id}`, userData);
}

/**
 * Eliminar usuario (admin)
 */
export async function deleteUser(id: number): Promise<ApiResponse> {
  return await del<ApiResponse>(`/users/${id}`);
}

/**
 * Activar/Desactivar usuario (admin)
 */
export async function toggleUserStatus(id: number, active: boolean): Promise<User> {
  return await put<User>(`/users/${id}/status`, { active });
}

/**
 * Cambiar rol de usuario (admin)
 */
export async function changeUserRole(id: number, roleId: number): Promise<User> {
  return await put<User>(`/users/${id}/role`, { id_rol: roleId });
}

// =============================================================================
// FUNCIONES DE BÚSQUEDA Y FILTROS
// =============================================================================

/**
 * Buscar usuarios
 */
export async function searchUsers(query: string, params?: PaginationParams): Promise<PaginatedResponse<User>> {
  return await get<PaginatedResponse<User>>('/users/search', { 
    params: { ...params, q: query } 
  });
}

/**
 * Obtener usuarios por rol
 */
export async function getUsersByRole(roleId: number, params?: PaginationParams): Promise<PaginatedResponse<User>> {
  return await get<PaginatedResponse<User>>(`/users/role/${roleId}`, { params });
}

/**
 * Obtener estadísticas de usuarios (admin)
 */
export async function getUserStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  new_this_month: number;
  by_role: Record<string, number>;
}> {
  return await get('/users/stats');
}

// =============================================================================
// EXPORT COMO OBJETO PARA COMPATIBILIDAD
// =============================================================================

const userService = {
  // Perfil
  getCurrentUser,
  updateCurrentUser,
  getUserProfile,
  updateProfile,
  uploadAvatar,
  
  // Gestión (Admin)
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  changeUserRole,
  
  // Búsqueda
  searchUsers,
  getUsersByRole,
  getUserStats,
};

export default userService; 