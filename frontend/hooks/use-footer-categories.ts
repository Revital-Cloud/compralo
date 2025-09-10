import { useQuery } from '@tanstack/react-query'
import { getCategories } from '@/services/category.service'
import { mapCategoriesToDisplay } from '@/utils/category-mapper'
import type { CategoryDisplay } from '@/types/category'

interface FooterCategoryItem {
  label: string
  href: string
}

interface FooterCategories {
  mainCategories: FooterCategoryItem[]
  additionalCategories: FooterCategoryItem[]
}

/**
 * Hook para obtener categorías del footer divididas en dos columnas
 */
export function useFooterCategories() {
  return useQuery({
    queryKey: ['categories', 'footer'],
    queryFn: async (): Promise<FooterCategories> => {
      console.log('Fetching footer categories...');
      try {
        const apiCategories = await getCategories();
        console.log('API categories response for footer:', apiCategories);
        
        const displayCategories = mapCategoriesToDisplay(apiCategories);
        console.log('Mapped categories for footer:', displayCategories);
        
        // Dividir las categorías en dos columnas
        const midPoint = Math.ceil(displayCategories.length / 2);
        const mainCategories = displayCategories.slice(0, midPoint);
        const additionalCategories = displayCategories.slice(midPoint);
        
        // Convertir a formato del footer
        const formatCategoriesForFooter = (categories: CategoryDisplay[]): FooterCategoryItem[] => {
          return categories.map(category => ({
            label: category.name,
            href: `/categories/${category.id}` // Enlace a la página de categoría específica
          }));
        };
        
        const result = {
          mainCategories: formatCategoriesForFooter(mainCategories),
          additionalCategories: formatCategoriesForFooter(additionalCategories)
        };
        
        console.log('Footer categories result:', result);
        return result;
      } catch (error) {
        console.error('Error fetching footer categories:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - las categorías cambian poco
    gcTime: 30 * 60 * 1000, // 30 minutos - mantener en caché más tiempo
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

