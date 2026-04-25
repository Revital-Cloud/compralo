import { post } from '@/utils/apiWrapper'

export interface GenerateProductDescriptionRequest {
  name: string
  category: string
  brand?: string
  attributes?: Record<string, unknown>
  tone?: string
}

export interface GenerateProductDescriptionResponse {
  description: string
}

export const aiDescriptionService = {
  async generateProductDescription(
    payload: GenerateProductDescriptionRequest
  ): Promise<GenerateProductDescriptionResponse> {
    return post<GenerateProductDescriptionResponse>('/admin/ai/generate-product-description', payload)
  },
}
