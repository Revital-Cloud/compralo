/**
 * Tipos comunes utilizados en toda la aplicación
 */

export type IdentificationType =
  | 'NIT'
  | 'EIN'
  | 'RFC'
  | 'CUIT'
  | 'RUT'
  | 'NIF'
  | 'CIF'
  | 'CNPJ'
  | 'RUC'
  | 'OTRO';

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  success?: boolean;
}

export interface ResponseMessage {
  message: string;
  success: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
