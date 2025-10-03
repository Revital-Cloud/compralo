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
export { useCreateProduct } from './use-products'
export { useCategories } from './use-categories'
export { useFooterCategories } from './use-footer-categories'
export { useAllLines, useLinesByCategory, useLine } from './use-lines'
export { useAllSublines, useSublinesByLine, useSubline } from './use-sublines'
export { useAllProviders, useProvider } from './use-providers'
export { useDashboardData } from './use-dashboard-data'

// Discounts and Points hooks
export { 
  useDiscounts, 
  useExchangeableDiscounts, 
  useCreateDiscount, 
  useUpdateDiscount, 
  useToggleDiscountStatus 
} from './use-discounts'
export { 
  useActivePointsRate, 
  usePointsPerUser, 
  usePointsHistory, 
  useCreatePointsConfig, 
  useUpdatePointsConfig 
} from './use-points'

// UI hooks
export { useIsMobile as useMobile } from './use-mobile'
export { useToastActions } from './use-toast-actions'
export { useRefreshToken } from './use-refresh-token'

// Theme hooks
export { useThemeState } from './use-theme'

// Theme classes and config
export { THEME_CLASSES } from '@/lib/theme-config'
