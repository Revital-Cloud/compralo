// =============================================================================
// TIPOS DE PRODUCTO
// =============================================================================

export interface ProductBase {
  nom_producto: string;
  spcf_producto: Record<string, any>; // Equivalente a Dict[str, Any] de Python
  img_producto?: ProductImages;
  val_precio: string; // Cambiado a string porque el API devuelve string
  id_proveedor: string; // Cambiado a string porque el API devuelve string
  id_marca: string; // Cambiado a string porque el API devuelve string
  id_sublinea: string; // Cambiado a string porque el API devuelve string
  id_linea: string; // Cambiado a string porque el API devuelve string
  id_categoria: string; // Cambiado a string porque el API devuelve string
  num_stock: number;
  images?: any; // Campo que viene del backend
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
  id_producto: string; // Cambiado a string porque el API devuelve string
  usr_insert: string;
  fec_insert: string; // Fecha como string, ya que viene del JSON
  usr_update?: string | null;
  fec_update?: string | null;
  ind_activo: boolean; // Agregado campo que viene del API
  // Nombres opcionales del endpoint admin
  nom_categoria?: string;
  nom_linea?: string;
  nom_sublinea?: string;
  nom_proveedor?: string;
  nom_marca?: string;
}

// =============================================================================
// TIPOS PARA ADMINISTRACIÓN
// =============================================================================

export interface ProductAdmin {
  id_categoria: string;
  id_linea: string;
  id_sublinea: string;
  id_producto: string;
  nom_categoria: string;
  nom_linea: string;
  nom_sublinea: string;
  nom_producto: string;
  spcf_producto: Record<string, any>;
  img_producto?: ProductImages;
  val_precio: string;
  num_stock: number;
  id_proveedor: string;
  id_marca: string;
  nom_proveedor: string;
  nom_marca: string;
  fec_insert: string;
  ind_activo_producto: boolean;
  ind_activo_categoria: boolean;
  ind_activo_linea: boolean;
  ind_activo_sublinea: boolean;
  ind_activo_proveedor: boolean;
  ind_activo_marca: boolean;
  total_registros: number;
}

export interface ProductAdminParams {
  ordenar_por?: 'precio' | 'nombre' | 'stock' | 'fecha' | 'categoria' | 'marca';
  orden?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

// =============================================================================
// TIPOS DE FILTROS DE PRODUCTO
// =============================================================================

export interface ProductFilters {
  search?: string;
  id_categoria?: number;
  id_marca?: number;
  id_proveedor?: number;
  precio_min?: number;
  precio_max?: number;
  en_stock?: boolean;
  page?: number;
  limit?: number;
  sort?: 'nom_producto' | 'val_precio' | 'fec_insert' | 'num_stock';
  order?: 'asc' | 'desc';
}

// =============================================================================
// TIPOS DE FILTROS AVANZADOS (NUEVOS)
// =============================================================================

export interface ProductFilterParams {
  id_categoria?: number | number[];
  id_linea?: number | number[];
  id_sublinea?: number | number[];
  id_marca?: number | number[];
  id_proveedor?: number | number[];
  nombre_producto?: string;
  precio_min?: number;
  precio_max?: number;
  stock_min?: number;
  solo_con_stock?: boolean;
  ordenar_por?: 'precio' | 'nombre' | 'stock' | 'fecha';
  orden?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

export interface ProductFiltered {
  id_categoria: number;
  id_linea: number;
  id_sublinea: number;
  id_producto: number;
  nom_categoria: string;
  nom_linea: string;
  nom_sublinea: string;
  nom_producto: string;
  spcf_producto: Record<string, any>;
  img_producto?: Record<string, any>;
  val_precio: number;
  num_stock: number;
  nom_proveedor: string;
  nom_marca: string;
  fec_insert: string;
  total_registros: number;
}

export interface ProductFilterResponse {
  products: ProductFiltered[];
  total: number;
  page: number;
  total_pages: number;
  limit: number;
  offset: number;
}

export interface ProductFilterStats {
  total_productos: number;
  precio_minimo?: number;
  precio_maximo?: number;
  precio_promedio?: number;
  total_stock: number;
  categorias_disponibles: number;
  marcas_disponibles: number;
}

export interface FilterOptions {
  categorias: Array<{ id_categoria: number; nom_categoria: string }>;
  lineas: Array<{ id_linea: number; nom_linea: string; id_categoria: number }>;
  sublineas: Array<{ id_sublinea: number; nom_sublinea: string; id_linea: number }>;
  marcas: Array<{ id_marca: number; nom_marca: string }>;
  proveedores: Array<{ id_proveedor: number; nom_proveedor: string }>;
  precio_rango: {
    minimo: number;
    maximo: number;
  };
}

// =============================================================================
// TIPOS DE CATEGORÍAS Y CLASIFICACIÓN
// =============================================================================

export interface Category {
  id_categoria: number;
  nom_categoria: string;
  des_categoria?: string;
  img_categoria?: string;
}

export interface Brand {
  id_marca: number;
  nom_marca: string;
  des_marca?: string;
  img_marca?: string;
}

export interface Provider {
  id_proveedor: number;
  nom_proveedor: string;
  des_proveedor?: string;
  contacto_proveedor?: string;
  email_proveedor?: string;
}

export interface ProductLine {
  id_linea: number;
  nom_linea: string;
  des_linea?: string;
}

export interface ProductSubline {
  id_sublinea: number;
  nom_sublinea: string;
  des_sublinea?: string;
  id_linea: number;
}

// =============================================================================
// TIPOS DE INVENTARIO
// =============================================================================

export interface StockUpdate {
  id_producto: number;
  num_stock: number;
  motivo?: string;
}

export interface StockMovement {
  id_movimiento: number;
  id_producto: number;
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo?: string;
  fec_movimiento: string;
  usr_movimiento: string;
}

// =============================================================================
// TIPOS DE CARRITO Y FAVORITOS
// =============================================================================

export interface CartItem {
  id_producto: number;
  nom_producto: string;
  img_producto?: string;
  val_precio: number;
  cantidad: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  cantidad_items: number;
}

export interface FavoriteItem {
  id_producto: number;
  nom_producto: string;
  img_producto?: string;
  val_precio: number;
  en_stock: boolean;
} 