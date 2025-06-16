/**
 * Configuración de la aplicación basada en variables de entorno
 */

export const appConfig = {
  // URLs
  apiUrl: process.env.NEXT_PUBLIC_API_URL_LOCAL || 'http://localhost:8000/api',
  
  // Configuración de secciones
  sections: {
    showNewDrops: process.env.NEXT_PUBLIC_SHOW_NEW_DROPS === 'true',
    showCategories: process.env.NEXT_PUBLIC_SHOW_CATEGORIES === 'true',
  },
  
  // Configuración de la tienda
  store: {
    name: process.env.NEXT_PUBLIC_STORE_NAME || 'Synkro Store',
    currency: process.env.NEXT_PUBLIC_CURRENCY || 'COP',
    currencySymbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$',
  },
  
  // Configuración de productos
  products: {
    itemsPerPage: parseInt(process.env.NEXT_PUBLIC_PRODUCTS_PER_PAGE || '12'),
    enableFavorites: process.env.NEXT_PUBLIC_ENABLE_FAVORITES === 'true',
    enableReviews: process.env.NEXT_PUBLIC_ENABLE_REVIEWS === 'true',
  },
  
  // Configuración de features
  features: {
    enableSearch: process.env.NEXT_PUBLIC_ENABLE_SEARCH !== 'false',
    enableFilters: process.env.NEXT_PUBLIC_ENABLE_FILTERS !== 'false',
    enableComparison: process.env.NEXT_PUBLIC_ENABLE_COMPARISON === 'true',
    enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
  },
} as const;

/**
 * Verifica si una sección debe mostrarse
 */
export const shouldShowSection = (sectionName: keyof typeof appConfig.sections): boolean => {
  return appConfig.sections[sectionName];
};

/**
 * Obtiene la configuración completa de la aplicación
 */
export const getAppConfig = () => appConfig; 