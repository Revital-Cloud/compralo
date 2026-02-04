import apiWrapper from '@/utils/apiWrapper';
import { Subline } from '@/hooks/use-sublines';

class SublineService {
  async getAllSublines(): Promise<Subline[]> {
    return apiWrapper.get(`/sublines`);
  }

  async getSublinesByLine(lineId: number, categoryId?: number): Promise<Subline[]> {
    const validCategory = typeof categoryId === 'number' && Number.isInteger(categoryId) && categoryId > 0;
    const params = validCategory ? `?id_categoria=${categoryId}` : '';
    return apiWrapper.get(`/sublines/line/${lineId}${params}`);
  }

  async getSubline(sublineId: number): Promise<Subline> {
    return apiWrapper.get(`/sublines/${sublineId}`);
  }

  async updateSubline(ids: { id_categoria: number; id_linea: number; id_sublinea: number }, payload: { nom_sublinea?: string; ind_activo?: boolean }): Promise<{ message: string }> {
    const slug = `${ids.id_categoria}-${ids.id_linea}-${ids.id_sublinea}`;
    return apiWrapper.put(`/sublines/${slug}`, payload);
  }

  async deactivateActivateSubline(ids: { id_categoria: number; id_linea: number; id_sublinea: number }, activar: boolean): Promise<{ message: string }> {
    const slug = `${ids.id_categoria}-${ids.id_linea}-${ids.id_sublinea}`;
    return apiWrapper.put(`/sublines/${slug}/toggle`, { activar });
  }

  async deactivateSubline(ids: { id_categoria: number; id_linea: number; id_sublinea: number }): Promise<{ message: string }> {
    return this.deactivateActivateSubline(ids, false);
  }
}

export const sublineService = new SublineService();
