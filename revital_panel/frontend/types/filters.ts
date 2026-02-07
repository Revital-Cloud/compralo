export interface FilterOption {
  id: string | number;
  label?: string;
  nombre?: string;
}

export interface FilterConfig {
  id: string;
  type: 'search' | 'select';
  label: string;
  placeholder?: string;
  value?: string;
  options?: FilterOption[];
  onChange?: (value: string) => void;
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
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  sortBy?: string;
  onSortByChange?: (value: string) => void;
  sortOrder?: 'ASC' | 'DESC';
  onSortOrderChange?: (order: 'ASC' | 'DESC') => void;
  sortOptions?: SortOption[];
  stockStats?: StockStats;
  totalResults?: number;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  title?: string;
  showStockBadges?: boolean;
  showTotalResults?: boolean;
  compact?: boolean;
}
