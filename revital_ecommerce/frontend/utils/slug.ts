/**
 * Genera un slug a partir de un nombre (preview en frontend).
 * La unicidad la garantiza el backend en fun_insert_categoria / fun_insert_producto.
 */
export function generateSlug(name: string): string {
  if (!name?.trim()) return ''
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // quitar acentos
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-') // múltiples guiones -> uno
    .replace(/^-|-$/g, '') // quitar guiones al inicio/final
}
