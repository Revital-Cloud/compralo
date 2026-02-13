/**
 * Mapeo de nombres de color (español/inglés) a códigos hex para mostrar
 * círculos de selección de color en la ficha de producto.
 */
const COLOR_NAME_TO_HEX: Record<string, string> = {
  // Español
  rojo: '#EF4444',
  azul: '#3B82F6',
  negro: '#1f2937',
  blanco: '#f9fafb',
  blanco_puro: '#ffffff',
  gris: '#6b7280',
  verde: '#22c55e',
  amarillo: '#eab308',
  naranja: '#f97316',
  rosa: '#ec4899',
  morado: '#a855f7',
  violeta: '#8b5cf6',
  marrón: '#92400e',
  beige: '#d4b896',
  dorado: '#ca8a04',
  plateado: '#94a3b8',
  // Inglés y variantes
  red: '#EF4444',
  blue: '#3B82F6',
  black: '#1f2937',
  white: '#f9fafb',
  gray: '#6b7280',
  grey: '#6b7280',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  pink: '#ec4899',
  purple: '#a855f7',
  brown: '#92400e',
  gold: '#ca8a04',
  silver: '#94a3b8',
  navy: '#1e3a5f',
  navy_blue: '#1e3a5f',
  turquesa: '#06b6d4',
  turquoise: '#06b6d4',
  coral: '#f43f5e',
  crema: '#fef3c7',
  cream: '#fef3c7',
}

/**
 * Devuelve el hex para un nombre de color, o un gris por defecto si no existe.
 * Acepta valores con espacios; normaliza a minúsculas.
 */
export function getHexForColorName(name: string): string {
  if (!name || typeof name !== 'string') return '#9ca3af'
  const key = name.trim().toLowerCase().replace(/\s+/g, '_')
  return COLOR_NAME_TO_HEX[key] ?? COLOR_NAME_TO_HEX[name.trim().toLowerCase()] ?? '#9ca3af'
}

/**
 * Indica si el color es muy claro (para usar borde oscuro en el círculo).
 */
export function isLightColor(hex: string): boolean {
  if (!hex || hex.length < 4) return false
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.7
}
