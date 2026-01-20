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

  async deactivateActivateLine(idCategoria: number, idLinea: number, activar: boolean): Promise<{ message: string }> {
    return apiWrapper.put(`/lines/${idCategoria}-${idLinea}/toggle`, { activar });
  }

  async deactivateLine(idCategoria: number, idLinea: number): Promise<{ message: string }> {
    return this.deactivateActivateLine(idCategoria, idLinea, false);
  }

  async updateSubline(idCategoria: number, idLinea: number, idSublinea: number, payload: { nom_sublinea?: string; ind_activo?: boolean }): Promise<{ message: string }> {
    return apiWrapper.put(`/sublines/${idCategoria}-${idLinea}-${idSublinea}`, payload);
  }

  async deactivateActivateSubline(idCategoria: number, idLinea: number, idSublinea: number, activar: boolean): Promise<{ message: string }> {
    return apiWrapper.put(`/sublines/${idCategoria}-${idLinea}-${idSublinea}/toggle`, { activar });
  }

  async deactivateSubline(idCategoria: number, idLinea: number, idSublinea: number): Promise<{ message: string }> {
    return this.deactivateActivateSubline(idCategoria, idLinea, idSublinea, false);
  }

  async createLine(payload: { id_categoria: number; nom_linea: string; desc_linea?: string; ind_activo?: boolean }): Promise<Line> {
    return apiWrapper.post(`/lines`, payload);
  }

  async createSubline(payload: { id_categoria: number; id_linea: number; nom_sublinea: string; ind_activo?: boolean }): Promise<{ message: string }> {
    return apiWrapper.post(`/sublines`, payload);
  }
}

export const lineService = new LineService();
