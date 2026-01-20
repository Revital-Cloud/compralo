export const THEME_CLASSES = {
  light: 'light',
  dark: 'dark',
  system: 'system',
  card: 'bg-white dark:bg-synkro-black',
  border: 'border border-gray-200 dark:border-gray-800',
  shadow: 'shadow-sm dark:shadow-lg',
  textPrimary: 'text-gray-900 dark:text-white',
  textSecondary: 'text-gray-600 dark:text-gray-400',
  input: 'bg-white dark:bg-synkro-black border-gray-200 dark:border-gray-800',
} as const;

export type ThemeClass = typeof THEME_CLASSES[keyof typeof THEME_CLASSES];
