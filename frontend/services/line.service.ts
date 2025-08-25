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
}

export const lineService = new LineService();
