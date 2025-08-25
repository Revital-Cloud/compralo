import { useQuery } from '@tanstack/react-query';
import { lineService } from '@/services/line.service';

export interface Line {
  id_linea: number;
  nom_linea: string;
  desc_linea?: string;
  id_categoria: number;
  sublineas_count?: number;
  productos_count?: number;
}

export const useLinesByCategory = (categoryId: number) => {
  return useQuery({
    queryKey: ['lines', 'category', categoryId],
    queryFn: () => lineService.getLinesByCategory(categoryId),
    enabled: !!categoryId,
  });
};

export const useLine = (lineId: number) => {
  return useQuery({
    queryKey: ['line', lineId],
    queryFn: () => lineService.getLine(lineId),
    enabled: !!lineId,
  });
};
