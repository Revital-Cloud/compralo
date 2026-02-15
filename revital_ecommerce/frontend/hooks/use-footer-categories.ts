import { useQuery } from '@tanstack/react-query'
import { getCategories } from '@/services/category.service'
import type { Category } from '@/types/category'

export interface FooterCategoryItem {
  label: string
  href: string
}

export interface FooterCategories {
  categories: FooterCategoryItem[]
}

/** Normaliza id que puede venir como number o string desde la API */
function idNum(c: Category, key: 'id' | 'parent_id'): number | null {
  const v = key === 'id' ? c.id : c.parent_id
  if (v == null) return null
  return typeof v === 'number' ? v : Number(v)
}

/**
 * Hook para obtener categorías del footer (tab_categories). Solo nombres y enlaces a /categories/[id].
 */
export function useFooterCategories() {
  return useQuery({
    queryKey: ['categories', 'footer'],
    queryFn: async (): Promise<FooterCategories> => {
      const list = await getCategories()
      const items: FooterCategoryItem[] = []
      for (const c of list) {
        if (c.ind_activo === false) continue
        const id = idNum(c, 'id')
        items.push({ label: c.name, href: `/categories/${id}` })
      }
      return {
        categories: items.slice(0, 12),
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

