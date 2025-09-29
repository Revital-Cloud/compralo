import apiWrapper from '@/utils/apiWrapper';
import { Line } from '@/hooks/use-lines';

class LineService {
  async getAllLines(): Promise<Line[]> {
    return apiWrapper.get(`/lines`);
  }

  async getLinesByCategory(categoryId: number): Promise<Line[]> {
    return apiWrapper.get(`/lines/category/${categoryId}`);
  }

  async getLine(lineId: number): Promise<Line> {
    return apiWrapper.get(`/lines/${lineId}`);
  }

  async updateLine(idCategoria: number, idLinea: number, payload: Partial<Pick<Line, 'nom_linea' | 'desc_linea' | 'ind_activo'>>): Promise<{ message: string }> {
    return apiWrapper.put(`/lines/${idCategoria}-${idLinea}`, payload);
  }

  async deactivateLine(idCategoria: number, idLinea: number): Promise<{ message: string }> {
    return apiWrapper.put(`/lines/${idCategoria}-${idLinea}/deactivate`, {});
  }

  async updateSubline(idCategoria: number, idLinea: number, idSublinea: number, payload: { nom_sublinea?: string; ind_activo?: boolean }): Promise<{ message: string }> {
    return apiWrapper.put(`/sublines/${idCategoria}-${idLinea}-${idSublinea}`, payload);
  }

  async deactivateSubline(idCategoria: number, idLinea: number, idSublinea: number): Promise<{ message: string }> {
    return apiWrapper.put(`/sublines/${idCategoria}-${idLinea}-${idSublinea}/deactivate`, {});
  }
}

export const lineService = new LineService();
