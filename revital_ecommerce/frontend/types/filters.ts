/**
 * Sistema Universal de Filtros
 * Tipos y configuración para filtros reutilizables
 */

export type SortOrder = 'ASC' | 'DESC';

export interface FilterOption {
  id: string | number;
  nombre: string;
  label?: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: 'search' | 'select' | 'multiselect' | 'date' | 'range';
  placeholder?: string;
  /** Texto para la opción "sin filtrar" en selects (ej. "Todas las categorías"). Si no se define, se usa "Todos los {label}". */
  emptyOptionLabel?: string;
  options?: FilterOption[];
  value?: any;
  onChange?: (value: any) => void;
  isLoading?: boolean;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface StockStats {
  enStock: number;
  stockBajo: number;
  sinStock: number;
}

export interface UniversalFiltersConfig {
  // Búsqueda
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  
  // Filtros dinámicos
  filters?: FilterConfig[];
  
  // Ordenamiento
  sortBy?: string;
  onSortByChange?: (value: string) => void;
  sortOrder?: SortOrder;
  onSortOrderChange?: (order: SortOrder) => void;
  sortOptions?: SortOption[];
  
  // Estadísticas (opcional)
  stockStats?: StockStats;
  totalResults?: number;
  
  // Limpiar filtros
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  
  // Personalización
  title?: string;
  showStockBadges?: boolean;
  showTotalResults?: boolean;
  compact?: boolean;
}

export interface ActiveFilter {
  id: string;
  label: string;
  value: string | string[];
  displayValue?: string;
}

