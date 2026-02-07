/**
 * Configuración de la aplicación basada en variables de entorno
 */

export const appConfig = {
  // URLs
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  
  // Branding de Brillo Rosa
  brand: {
    name: 'Brillo Rosa',
    logo: '/brillo-rosa-logo.svg',
    colors: {
      primary: 'oklch(0.75 0.15 350)',
      secondary: 'oklch(0.95 0.05 350)',
      accent: 'oklch(0.85 0.12 350)',
    },
    fonts: {
      primary: 'var(--font-geist-sans)',
      mono: 'var(--font-geist-mono)',
    }
  },
  
  // Configuración de secciones
  sections: {
    showNewDrops: true,
    showCategories: true,
  },
  
  // Configuración de la tienda
  store: {
    name: 'Brillo Rosa',
    currency: 'ARS',
    currencySymbol: '$',
  },
  
  // Configuración de productos
  products: {
    itemsPerPage: 12,
    enableFavorites: true,
    enableReviews: true,
  },
  
  // Configuración de features
  features: {
    enableSearch: true,
    enableFilters: true,
    enableComparison: true,
    enableNotifications: true,
  },
  
  // Tema por defecto
  theme: {
    default: 'light',
    colors: {
      light: {
        background: 'oklch(0.99 0 0)',
        foreground: 'oklch(0.2 0 0)',
        primary: 'oklch(0.75 0.15 350)',
        secondary: 'oklch(0.95 0.05 350)',
      },
      dark: {
        background: 'oklch(0.15 0 0)',
        foreground: 'oklch(0.95 0 0)',
        primary: 'oklch(0.8 0.15 350)',
        secondary: 'oklch(0.3 0.05 350)',
      }
    }
  }
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