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
  usr_update?: string;
  fec_update?: string;
  ind_activo: boolean; // Agregado campo que viene del API
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