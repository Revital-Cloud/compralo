export interface Category {
  id: number;
  name: string; // tab_categories.name
  /** Alias desde API (tab_categories.name como nom_categoria) */
  nom_categoria?: string;
  description?: string; // descripción para UI (tab_categories.description si existe)
  is_active?: boolean; // tab_categories.is_active
  ind_activo?: boolean; // legacy alias
  /** ID de la categoría padre (null = raíz). Usado para árbol categorías → líneas → sublíneas. */
  parent_id?: number | null;
  productos_count?: number;
  usr_insert?: string;
  fec_insert?: string;
  usr_update?: string;
  fec_update?: string;
}

export interface CategoryDisplay {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  bgGradient: string;
  iconBg: string;
  isActive: boolean;
  productCount?: number;
}
