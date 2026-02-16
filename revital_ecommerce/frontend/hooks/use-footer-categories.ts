import { useQuery } from '@tanstack/react-query'
import { getCategories } from '@/services/category.service'
import type { Category } from '@/types/category'

export interface FooterCategoryItem {
  label: string
  href: string
}

export interface FooterCategories {
  categories: FooterCategoryItem[]
  lineas: FooterCategoryItem[]
  sublineas: FooterCategoryItem[]
}

/** Normaliza id que puede venir como number o string desde la API */
function idNum(c: Category, key: 'id' | 'parent_id'): number | null {
  const v = key === 'id' ? c.id : c.parent_id
  if (v == null) return null
  return typeof v === 'number' ? v : Number(v)
}

function toItem(c: Category): FooterCategoryItem {
  const id = idNum(c, 'id')
  return { label: c.name, href: `/categories/${id}` }
}

/**
 * Hook para obtener categorías del footer (tab_categories).
 * Devuelve tres niveles: categorías (raíz), líneas (hijas de categorías), sublíneas (nietas).
 */
export function useFooterCategories() {
  return useQuery({
    queryKey: ['categories', 'footer'],
    queryFn: async (): Promise<FooterCategories> => {
      const list = await getCategories()
      const active = list.filter((c) => (c.ind_activo ?? c.is_active) !== false)

      const categorias = active.filter((c) => idNum(c, 'parent_id') == null).map(toItem)
      const idsCategorias = new Set(active.filter((c) => idNum(c, 'parent_id') == null).map((c) => idNum(c, 'id')))
      const lineas = active
        .filter((c) => idsCategorias.has(idNum(c, 'parent_id')))
        .map(toItem)
      const idsLineas = new Set(
        active.filter((c) => idsCategorias.has(idNum(c, 'parent_id'))).map((c) => idNum(c, 'id'))
      )
      const sublineas = active
        .filter((c) => idsLineas.has(idNum(c, 'parent_id')))
        .map(toItem)

      return {
        categories: categorias.slice(0, 10),
        lineas: lineas.slice(0, 10),
        sublineas: sublineas.slice(0, 10),
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

