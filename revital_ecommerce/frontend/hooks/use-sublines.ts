import { useQuery } from '@tanstack/react-query';
import { sublineService } from '@/services/subline.service';

export interface Subline {
  id_sublinea: number;
  nom_sublinea: string;
  desc_sublinea?: string;
  id_categoria: number;
  id_linea: number;
  productos_count?: number;
  ind_activo?: boolean;
  fec_insert?: string;
  fec_update?: string;
  usr_insert?: number;
  usr_update?: number;
}

export const useAllSublines = () => {
  return useQuery({
    queryKey: ['sublines', 'all'],
    queryFn: () => sublineService.getAllSublines(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

/** id_categoria es obligatorio en rutas categoría/línea para devolver solo sublíneas de esa línea en esa categoría. */
export const useSublinesByLine = (lineId: number, categoryId?: number) => {
  const validLine = typeof lineId === 'number' && Number.isInteger(lineId) && lineId > 0;
  const validCategory = categoryId == null || (typeof categoryId === 'number' && Number.isInteger(categoryId) && categoryId > 0);
  return useQuery({
    queryKey: ['sublines', 'line', lineId, categoryId],
    queryFn: () => sublineService.getSublinesByLine(lineId, categoryId),
    enabled: !!validLine && validCategory,
  });
};

export const useSubline = (sublineId: number) => {
  return useQuery({
    queryKey: ['subline', sublineId],
    queryFn: () => sublineService.getSubline(sublineId),
    enabled: !!sublineId,
  });
};
