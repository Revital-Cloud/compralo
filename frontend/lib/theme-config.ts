/**
 * Configuración global del sistema de temas
 * Proporciona constantes y utilidades para dark mode consistente
 */

export const THEME_CONFIG = {
  // Transiciones
  transitions: {
    default: 'transition-all duration-300',
    fast: 'transition-all duration-200',
    slow: 'transition-all duration-500',
  },
  
  // Colores de marca (Compralo)
  brand: {
    primary: {
      light: '#ec2538',
      dark: '#ff4444',
    },
    secondary: {
      light: '#FF8C00',
      dark: '#ff9933',
    },
    accent: {
      light: '#fec806',
      dark: '#ffdd33',
    },
  },
  
  // Paletas de colores por tema
  colors: {
    light: {
      background: {
        primary: 'bg-white',
        secondary: 'bg-gray-50',
        tertiary: 'bg-gray-100',
      },
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        muted: 'text-gray-500',
        inverse: 'text-white',
      },
      border: {
        primary: 'border-gray-200',
        secondary: 'border-gray-100',
        accent: 'border-gray-300',
      },
      shadow: {
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
      },
    },
    dark: {
      background: {
        primary: 'bg-gray-950',
        secondary: 'bg-gray-900',
        tertiary: 'bg-gray-800',
      },
      text: {
        primary: 'text-white',
        secondary: 'text-gray-300',
        muted: 'text-gray-400',
        inverse: 'text-gray-900',
      },
      border: {
        primary: 'border-gray-700',
        secondary: 'border-gray-600',
        accent: 'border-gray-500',
      },
      shadow: {
        sm: 'shadow-gray-900/10',
        md: 'shadow-gray-900/20',
        lg: 'shadow-gray-900/25',
        xl: 'shadow-gray-900/30',
      },
    },
  },
} as const;

/**
 * Clases utilitarias predefinidas para uso común
 */
export const THEME_CLASSES = {
  // Contenedores principales
  container: 'bg-white dark:bg-gray-950',
  surface: 'bg-gray-50 dark:bg-gray-900',
  card: 'bg-white dark:bg-gray-800',
  
  // Textos
  textPrimary: 'text-gray-900 dark:text-white',
  textSecondary: 'text-gray-600 dark:text-gray-300',
  textMuted: 'text-gray-500 dark:text-gray-400',
  textInverse: 'text-white dark:text-gray-900',
  
  // Bordes
  border: 'border-gray-200 dark:border-gray-700',
  borderLight: 'border-gray-100 dark:border-gray-600',
  
  // Sombras
  shadow: 'shadow-lg dark:shadow-gray-900/25',
  shadowSm: 'shadow-sm dark:shadow-gray-900/10',
  
  // Transiciones
  transition: 'transition-all duration-300',
  
  // Estados hover
  hoverSurface: 'hover:bg-gray-100 dark:hover:bg-gray-800',
  hoverCard: 'hover:bg-gray-50 dark:hover:bg-gray-700',
  
  // Inputs
  input: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
  
  // Botones
  buttonPrimary: 'bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white',
  buttonSecondary: 'bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-600 text-white',
  buttonOutline: 'border-2 border-red-600 dark:border-red-500 text-red-600 dark:text-red-500 hover:bg-red-600 dark:hover:bg-red-500 hover:text-white',
} as const;

/**
 * Función para generar clases condicionales basadas en el tema
 */
export const getThemeClasses = (isDark: boolean, lightClass: string, darkClass: string): string => {
  return isDark ? darkClass : lightClass;
};

/**
 * Función para generar clases de contraste automático
 */
export const getContrastClasses = (isDark: boolean): {
  background: string;
  text: string;
  border: string;
} => {
  if (isDark) {
    return {
      background: 'bg-gray-800',
      text: 'text-white',
      border: 'border-gray-700',
    };
  }
  
  return {
    background: 'bg-white',
    text: 'text-gray-900',
    border: 'border-gray-200',
  };
};

/**
 * Función para generar clases de hover adaptativas
 */
export const getHoverClasses = (isDark: boolean, baseClass: string): string => {
  const hoverClass = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  return `${baseClass} ${hoverClass}`;
};

export default THEME_CONFIG;
