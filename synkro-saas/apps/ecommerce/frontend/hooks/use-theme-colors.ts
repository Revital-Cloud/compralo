import { useTheme } from 'next-themes';
import { THEME_CLASSES } from '@/lib/theme-config';

export interface ThemeColors {
  // Fondos principales
  background: string;
  surface: string;
  card: string;
  
  // Textos
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  
  // Bordes y divisores
  border: string;
  divider: string;
  
  // Colores de marca (Compralo)
  brand: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // Estados interactivos
  interactive: {
    hover: string;
    active: string;
    disabled: string;
  };
  
  // Sombras
  shadow: string;
}

export const useThemeColors = (): ThemeColors => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (isDark) {
    return {
      // Dark Mode
      background: 'bg-gray-950',
      surface: 'bg-gray-900',
      card: 'bg-gray-800',
      
      text: {
        primary: 'text-white',
        secondary: 'text-gray-300',
        muted: 'text-gray-400',
        inverse: 'text-gray-900',
      },
      
      border: 'border-gray-700',
      divider: 'border-gray-600',
      
      brand: {
        primary: 'text-red-500',
        secondary: 'text-orange-500',
        accent: 'text-yellow-400',
      },
      
      interactive: {
        hover: 'hover:bg-gray-800',
        active: 'bg-gray-700',
        disabled: 'bg-gray-800 text-gray-500',
      },
      
      shadow: 'shadow-gray-900/25',
    };
  }

  // Light Mode (default)
  return {
    background: 'bg-white',
    surface: 'bg-gray-50',
    card: 'bg-white',
    
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      muted: 'text-gray-500',
      inverse: 'text-white',
    },
    
    border: 'border-gray-200',
    divider: 'border-gray-100',
    
    brand: {
      primary: 'text-red-600',
      secondary: 'text-orange-600',
      accent: 'text-yellow-500',
    },
    
    interactive: {
      hover: 'hover:bg-gray-100',
      active: 'bg-gray-200',
      disabled: 'bg-gray-100 text-gray-400',
    },
    
    shadow: 'shadow-gray-200/25',
  };
};

// Exportar las clases predefinidas para uso directo
export { THEME_CLASSES };

// Hook simplificado para obtener solo el estado del tema
export const useThemeState = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  
  return {
    theme,
    isDark,
    setTheme,
    toggleTheme: () => setTheme(isDark ? 'light' : 'dark'),
  };
};

// Hook para obtener clases condicionales
export const useThemeClasses = () => {
  const { isDark } = useThemeState();
  
  return {
    // Contenedores
    container: isDark ? 'bg-gray-950' : 'bg-white',
    surface: isDark ? 'bg-gray-900' : 'bg-gray-50',
    card: isDark ? 'bg-gray-800' : 'bg-white',
    
    // Textos
    textPrimary: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    
    // Bordes
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    borderLight: isDark ? 'border-gray-600' : 'border-gray-100',
    
    // Sombras
    shadow: isDark ? 'shadow-gray-900/25' : 'shadow-gray-200/25',
    shadowSm: isDark ? 'shadow-gray-900/10' : 'shadow-sm',
    
    // Estados hover
    hoverSurface: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100',
    hoverCard: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
  };
};
