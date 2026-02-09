import { useQuery } from '@tanstack/react-query'
import { getCategories } from '@/services/category.service'
import { mapCategoriesToDisplay } from '@/utils/category-mapper'
import type { CategoryDisplay } from '@/types/category'
import { lineService } from '@/services/line.service'
import { sublineService } from '@/services/subline.service'

export interface FooterCategoryItem {
  label: string
  href: string
}

export interface FooterCategories {
  categories: FooterCategoryItem[]
  lineas: FooterCategoryItem[]
  sublineas: FooterCategoryItem[]
}

/**
 * Hook para obtener categorías, líneas y sublíneas del footer (tres columnas)
 */
export function useFooterCategories() {
  return useQuery({
    queryKey: ['categories', 'lines', 'sublines', 'footer'],
    queryFn: async (): Promise<FooterCategories> => {
      try {
        const [apiCategories, apiLines, apiSublines] = await Promise.all([
          getCategories(),
          lineService.getAllLines(),
          sublineService.getAllSublines(),
        ])

        const displayCategories = mapCategoriesToDisplay(apiCategories)
        const categories: FooterCategoryItem[] = displayCategories.map((c: CategoryDisplay) => ({
          label: c.name,
          href: `/categories/${c.id}`,
        }))

        const lineas: FooterCategoryItem[] = (apiLines || [])
          .filter((l: { ind_activo?: boolean }) => l.ind_activo !== false)
          .map((l: { id_categoria: number; id_linea: number; nom_linea: string }) => ({
            label: l.nom_linea,
            href: `/categories/${l.id_categoria}/lines/${l.id_linea}`,
          }))

        const sublineas: FooterCategoryItem[] = (apiSublines || [])
          .filter((s: { ind_activo?: boolean }) => s.ind_activo !== false)
          .map((s: { id_categoria: number; id_linea: number; id_sublinea: number; nom_sublinea: string }) => ({
            label: s.nom_sublinea,
            href: `/categories/${s.id_categoria}/lines/${s.id_linea}/sublines/${s.id_sublinea}/products`,
          }))

        return { categories, lineas, sublineas }
      } catch (error) {
        console.error('Error fetching footer data:', error)
        throw error
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

