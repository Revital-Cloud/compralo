// =============================================================================
// TIPOS DE PRODUCTO
// =============================================================================

export interface ProductBase {
  name: string;
  description?: string; // tab_products.description
  category_id: string;
  id_marca: string;
  /** @deprecated Use price_min; API devuelve price_min desde variantes */
  val_precio?: string;
  /** @deprecated Use stock_total */
  num_stock?: number;
  price_min?: number | string;
  stock_total?: number;
  image_url?: string;
  images?: Array<{ image_url: string; is_main?: boolean; sort_order?: number }>;
  variant_options?: { colors?: Array<{ name: string; value?: string; hex_color?: string }>; sizes?: Array<{ name: string; available?: boolean }> };
  /** @deprecated Use variant_options / description */
  spcf_producto?: Record<string, any>;
  img_producto?: ProductImages;
}

export interface ProductImages {
  main: string;
  gallery: string[];
  thumbnails: string[];
}

export interface ProductCreate extends ProductBase {}

export interface ProductUpdate {
  name?: string;
  des_producto?: string;
  spcf_producto?: Record<string, any>;
  img_producto?: ProductImages;
  val_precio?: number;
  id_proveedor?: number;
  id_marca?: number;
  category_id?: number;
  num_stock?: number;
}

export interface Product extends ProductBase {
  id: string;
  slug?: string | null;
  usr_insert?: string;
  fec_insert?: string;
  usr_update?: string | null;
  fec_update?: string | null;
  is_active?: boolean;
  category_name?: string;
  nom_marca?: string;
  nom_proveedor?: string;
  rating?: number;
  review_count?: number;
}

// =============================================================================
// TIPOS PARA ADMINISTRACIÓN
// =============================================================================

export interface ProductAdmin {
  category_id: string;
  id: string;
  category_name: string;
  name: string;
  description?: string;
  slug_producto?: string;
  image_url?: string;
  price_min: string;
  price_max?: string;
  stock_total: number;
  id_marca: string;
  nom_marca: string;
  id_proveedor?: string;
  nom_proveedor?: string;
  fec_insert: string;
  is_active: boolean;
  ind_activo_categoria: boolean;
  ind_activo_marca: boolean;
  total_registros: number;
  /** Estadísticas globales de stock (solo en el primer ítem de la respuesta) */
  stock_stats_en_stock?: number;
  stock_stats_bajo?: number;
  stock_stats_sin_stock?: number;
}

export interface ProductAdminParams {
  ordenar_por?: 'precio' | 'nombre' | 'stock' | 'fecha' | 'categoria' | 'marca';
  orden?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
  search?: string;
  category_id?: number;
  line_id?: number;
  subline_id?: number;
  id_marca?: number;
  id_proveedor?: number;
}

/** Variante para crear/editar (tab_product_variants: id, product_id, sku, price, stock, is_active; sin color/size) */
export interface VariantCreateItem {
  sku?: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  tipo_clasificacion?: string | null;
  attributes?: Record<string, string | number | boolean>;
  image_urls?: string[];
  main_index?: number;
}

/** Payload para crear o actualizar producto compuesto (producto + variantes + imágenes) */
export interface ProductCreateComposite {
  product: {
    name: string;
    category_id: number;
    id_marca?: number | null;
    id_proveedor?: number | null;
    description?: string | null;
    is_active: boolean;
  };
  variants: VariantCreateItem[];
  image_urls?: string[];
}

// =============================================================================
// TIPOS PARA SELECTOR DE VARIANTES (DETALLE PRODUCTO - NOMBRE DE ATRIBUTO)
// =============================================================================

/** Variante normalizada para el selector: atributos por nombre de atributo. */
export interface Variant {
  id: number;
  price: number;
  stock: number;
  image: string | null;
  /** Clave = nombre del atributo (ej. "Color", "Almacenamiento"); valor = string del valor. */
  attributes: Record<string, string>;
}

/** Producto mínimo para el selector de variantes. */
export interface ProductDetail {
  id: number;
  name: string;
  description?: string;
  variants: Variant[];
}

/** Definición de un atributo para la UI: nombre y valores posibles (hex_color para swatches). */
export interface AttributeDefinition {
  name: string;
  values: { value: string; hex_color?: string | null }[];
}

/** ProductDetail + lista de atributos para el hook useVariantSelector. */
export interface ProductDetailForSelector extends ProductDetail {
  attributeDefinitions: AttributeDefinition[];
}

// =============================================================================
// TIPOS DE FILTROS DE PRODUCTO
// =============================================================================

export interface ProductFilters {
  search?: string;
  category_id?: number;
  id_marca?: number;
  id_proveedor?: number;
  precio_min?: number;
  precio_max?: number;
  en_stock?: boolean;
  page?: number;
  limit?: number;
  sort?: 'name' | 'val_precio' | 'fec_insert' | 'num_stock';
  order?: 'asc' | 'desc';
}

// =============================================================================
// TIPOS DE FILTROS AVANZADOS (NUEVOS)
// =============================================================================

export interface ProductFilterParams {
  /** ID de categoría (árbol tab_categories); con include_subcategories se incluyen hijos */
  category_id?: number;
  include_subcategories?: boolean;
  id_marca?: number;
  nombre_producto?: string;
  precio_min?: number;
  precio_max?: number;
  solo_con_stock?: boolean;
  /** Solo productos con descuento automático activo (vitriena), vía API */
  solo_en_oferta?: boolean;
  ordenar_por?: 'precio' | 'nombre' | 'stock' | 'fecha';
  orden?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
  /** Filtro por atributos: { attribute_id: [ "Negro", "Blanco" ] } */
  atributos?: Record<string, string[]>;
}

export interface CategoryTreeNode {
  id: number;
  name: string;
  slug?: string;
  parent_id?: number | null;
  children: CategoryTreeNode[];
}

export interface FilterAttributeOption {
  id: number;
  name: string;
  values: string[];
}

export interface ProductFiltered {
  category_id: number;
  id: number;
  slug?: string | null;
  category_name: string;
  name: string;
  description?: string;
  image_url?: string;
  price_min: number;
  price_max?: number;
  stock_total: number;
  total_registros: number;
  rating?: number;
  id_marca?: number;
  nom_marca?: string;
  fec_insert?: string | null;
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
  /** Árbol de categorías (tab_categories con parent_id) */
  categories_tree?: CategoryTreeNode[];
  /** Lista plana de categorías (compatibilidad) */
  categorias: Array<{ id: number; name: string }>;
  marcas: Array<{ id_marca: number; nom_marca: string }>;
  proveedores?: Array<{ id_proveedor: number; nom_proveedor: string }>;
  precio_rango: {
    minimo: number;
    maximo: number;
  };
  price_range?: { minimo: number; maximo: number };
  /** Atributos dinámicos para filtro (ej. Color: [Negro, Blanco], Tamaño: [M, L]) */
  attributes?: FilterAttributeOption[];
}

// =============================================================================
// TIPOS DE CATEGORÍAS Y CLASIFICACIÓN
// =============================================================================

export interface Category {
  id: number;
  name: string; // tab_categories.name
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

// =============================================================================
// TIPOS DE INVENTARIO
// =============================================================================

export interface StockUpdate {
  id: number; // tab_products.id
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