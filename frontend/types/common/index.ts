// =============================================================================
// TIPOS BÁSICOS Y COMUNES
// =============================================================================

export interface ResponseMessage {
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

// =============================================================================
// TIPOS DE PAGINACIÓN Y FILTROS
// =============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// =============================================================================
// TIPOS DE ERROR
// =============================================================================

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// =============================================================================
// TIPOS DE FILTROS GENÉRICOS
// =============================================================================

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterOptions {
  search?: string;
  sort?: SortOptions;
  page?: number;
  limit?: number;
} 