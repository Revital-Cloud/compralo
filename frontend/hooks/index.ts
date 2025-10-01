// Auth hooks
export { useAuth } from './use-auth'
export { useLoginRedirect } from './use-role-redirect'

// Favorites hooks
export { useFavorites } from './use-favorites'

// Data hooks
export { 
  useProducts, 
  useBrands, 
  useFilterProducts, 
  useFilterStats, 
  useFilterOptions, 
  useQuickSearch 
} from './use-products'
export { useFeaturedProducts } from './use-products'
export { useCategories } from './use-categories'
export { useFooterCategories } from './use-footer-categories'
export { useAllLines, useLinesByCategory, useLine } from './use-lines'
export { useAllSublines, useSublinesByLine, useSubline } from './use-sublines'
export { useDashboardData } from './use-dashboard-data'

// UI hooks
export { useIsMobile as useMobile } from './use-mobile'
export { useToastActions } from './use-toast-actions'
export { useFileExport } from './use-file-export'
export { useFileImport } from './use-file-import'
export { useRefreshToken } from './use-refresh-token'

// Theme hooks
export { useThemeState } from './use-theme'

// Theme classes and config
export { THEME_CLASSES } from '@/lib/theme-config'
