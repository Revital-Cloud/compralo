// =============================================================================
// AUTO-IMPORTS DE TODOS LOS TIPOS
// =============================================================================

// Re-export de tipos comunes (incl. ResponseMessage, ApiResponse, PaginationParams, PaginatedResponse, FilterOptions)
export * from './common';

// Re-export de tipos de autenticación
export * from './auth';

// Re-export de tipos de usuario
export * from './user';

// Re-export de tipos de producto (FilterOptions con alias para no chocar con common)
export type {
  ProductBase as ProductBaseFromProduct,
  ProductImages as ProductImagesFromProduct,
  Product as ProductFromProduct,
  ProductCreate as ProductCreateFromProduct,
  ProductUpdate as ProductUpdateFromProduct,
  ProductAdmin,
  ProductAdminParams,
  ProductFilters,
  ProductFilterParams,
  ProductFiltered,
  ProductFilterResponse,
  ProductFilterStats,
  FilterOptions as ProductFilterOptions,
  Category as CategoryFromProduct,
  Brand,
  Provider,
  ProductLine,
  ProductSubline,
  StockUpdate,
  StockMovement,
  CartItem,
  Cart,
  FavoriteItem,
} from './product';

// Re-export de tipos de datos (Excel/CSV)
export * from './data';
// Re-export de tipos jerárquicos (categorías, líneas, sublíneas)
export type { Category } from './hierarchical';
export type { Line } from './hierarchical';
export type { Subline } from './hierarchical';
// Re-export de tipos de filtros
export * from './filters';

// =============================================================================
// TIPOS ADICIONALES PARA LA APLICACIÓN
// =============================================================================

export interface AppConfig {
  apiUrl: string;
  appName: string;
  version: string;
}

export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  icon?: string;
  label?: string;
}

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    twitter: string;
    github: string;
  };
}

// =============================================================================
// ENUMS GLOBALES
// =============================================================================

export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

// =============================================================================
// TIPOS DE AUTENTICACIÓN
// =============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface TokenData {
  user_id?: number;
  email?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface UserInToken {
  id_usuario: number;
  email_usuario: string;
  nom_usuario: string;
  ape_usuario: string;
  id_rol: number;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirm {
  token: string;
  new_password: string;
}

// =============================================================================
// TIPOS DE USUARIO
// =============================================================================

export interface UserBase {
  id_usuario: number;
  nom_usuario: string;
  ape_usuario: string;
  email_usuario: string;
  password_usuario: string;
  des_direccion?: string;
  id_rol: number;
  ind_genero: boolean;
  cel_usuario: string;
  fec_nacimiento?: string;
  ind_activo: boolean;
}

export interface UserCreate extends UserBase {}

export interface UserUpdate {
  nom_usuario?: string;
  ape_usuario?: string;
  email_usuario?: string;
  password_usuario?: string;
  des_direccion?: string;
  id_rol?: number;
  ind_genero?: boolean;
  cel_usuario?: string;
  fec_nacimiento?: string;
  ind_activo?: boolean;
  avatar_seed?: string | null;
  avatar_colors?: string | null;
}

export interface User extends UserBase {
  id_usuario: number;
  fec_nacimiento?: string;
}

// =============================================================================
// TIPOS DE PRODUCTO
// =============================================================================

export interface ProductBase {
  id_producto: number;
  nom_producto: string;
  spcf_producto: Record<string, any>; // Equivalente a Dict[str, Any] de Python
  img_producto?: ProductImages;
  val_precio: number; // Convertimos Decimal a number para TS
  id_proveedor: number;
  id_marca: number;
  id_sublinea: number;
  id_linea: number;
  id_categoria: number;
  num_stock: number;
}

export interface ProductImages {
  main: string;
  gallery: string[];
  thumbnails: string[];
}

export interface ProductCreate extends ProductBase {}

export interface ProductUpdate {
  nom_producto?: string;
  spcf_producto?: Record<string, any>;
  img_producto?: ProductImages;
  val_precio?: number;
  id_proveedor?: number;
  id_marca?: number;
  id_sublinea?: number;
  id_linea?: number;
  id_categoria?: number;
  num_stock?: number;
}

export interface Product extends ProductBase {
  id_producto: number;
  usr_insert: string;
  fec_insert: string; // Fecha como string, ya que viene del JSON
  usr_update?: string;
  fec_update?: string;
  rating?: number; // Promedio de calificaciones del producto (1-5 estrellas)
  review_count?: number; // Cantidad de reseñas con calificación
}
