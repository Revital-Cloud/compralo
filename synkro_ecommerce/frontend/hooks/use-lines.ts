import { useQuery } from '@tanstack/react-query';
import { lineService } from '@/services/line.service';

export interface Line {
  id_linea: number;
  nom_linea: string;
  desc_linea?: string;
  id_categoria: number;
  sublineas_count?: number;
  productos_count?: number;
  ind_activo?: boolean;
  fec_insert?: string;
  fec_update?: string;
}

export const useAllLines = () => {
  return useQuery({
    queryKey: ['lines', 'all'],
    queryFn: () => lineService.getAllLines(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useLinesByCategory = (categoryId: number) => {
  return useQuery({
    queryKey: ['lines', 'category', categoryId],
    queryFn: () => lineService.getLinesByCategory(categoryId),
    enabled: !!categoryId && categoryId > 0,
  });
};

/** id_categoria es obligatorio en rutas categoría/línea para devolver la línea correcta. */
export const useLine = (lineId: number, categoryId?: number) => {
  const validLine = typeof lineId === 'number' && Number.isInteger(lineId) && lineId > 0;
  const validCategory = categoryId == null || (typeof categoryId === 'number' && Number.isInteger(categoryId) && categoryId > 0);
  return useQuery({
    queryKey: ['line', lineId, categoryId],
    queryFn: () => lineService.getLine(lineId, categoryId),
    enabled: !!validLine && validCategory,
  });
};
