import apiWrapper from '@/utils/apiWrapper';
import { Subline } from '@/hooks/use-sublines';

class SublineService {
  async getSublinesByLine(lineId: number): Promise<Subline[]> {
    return apiWrapper.get(`/sublines/line/${lineId}`);
  }

  async getSubline(sublineId: number): Promise<Subline> {
    return apiWrapper.get(`/sublines/${sublineId}`);
  }
}

export const sublineService = new SublineService();
