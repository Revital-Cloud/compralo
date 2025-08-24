import { useQuery } from '@tanstack/react-query';
import { sublineService } from '@/services/subline.service';

export interface Subline {
  id_sublinea: number;
  nom_sublinea: string;
  desc_sublinea?: string;
  id_linea: number;
  productos_count?: number;
}

export const useSublinesByLine = (lineId: number) => {
  return useQuery({
    queryKey: ['sublines', 'line', lineId],
    queryFn: () => sublineService.getSublinesByLine(lineId),
    enabled: !!lineId,
  });
};

export const useSubline = (sublineId: number) => {
  return useQuery({
    queryKey: ['subline', sublineId],
    queryFn: () => sublineService.getSubline(sublineId),
    enabled: !!sublineId,
  });
};
