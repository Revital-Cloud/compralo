import { useQuery } from '@tanstack/react-query';
import { sublineService } from '@/services/subline.service';

export interface Subline {
  id_sublinea: number;
  nom_sublinea: string;
  id_linea: number;
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
