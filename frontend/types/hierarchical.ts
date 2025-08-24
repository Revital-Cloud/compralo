// Tipos para la navegación jerárquica de categorías

export interface Category {
  id_categoria: number;
  nom_categoria: string;
  desc_categoria?: string;
  imagen_categoria?: string;
}

export interface Line {
  id_linea: number;
  nom_linea: string;
  desc_linea?: string;
  id_categoria: number;
  sublineas_count?: number;
  productos_count?: number;
}

export interface Subline {
  id_sublinea: number;
  nom_sublinea: string;
  desc_sublinea?: string;
  id_linea: number;
  productos_count?: number;
}

export interface Product {
  id_producto: number;
  nom_producto: string;
  desc_producto?: JSON;
  val_precio?: number;
  stock_cantidad?: number;
  img_producto?: JSON;
  id_categoria: number;
  id_linea: number;
  id_sublinea: number;
}

// Tipos para la navegación
export interface NavigationItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

// Tipos para los breadcrumbs
export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}
