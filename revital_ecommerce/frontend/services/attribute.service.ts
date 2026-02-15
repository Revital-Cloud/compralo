/**
 * Attribute service (tab_attributes master catalog + tab_attribute_values). Admin only.
 */
import apiWrapper from '@/utils/apiWrapper'

export interface Attribute {
  id: number
  name: string
  data_type: 'text' | 'number' | 'boolean'
  has_predefined_values?: boolean
  usr_insert?: number
  fec_insert?: string
  usr_update?: number
  fec_update?: string
}

export interface AttributeCreate {
  name: string
  data_type: 'text' | 'number' | 'boolean'
  has_predefined_values?: boolean
}

export interface AttributeUpdate {
  name?: string
  data_type?: 'text' | 'number' | 'boolean'
  has_predefined_values?: boolean
}

export interface AttributeValue {
  id: number
  attribute_id: number
  value: string
  hex_color?: string | null
  sort_order: number
  is_active: boolean
  usr_insert?: number
  fec_insert?: string
  usr_update?: number
  fec_update?: string
}

export interface AttributeValueCreate {
  value: string
  hex_color?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface AttributeValueUpdate {
  value?: string
  hex_color?: string | null
  sort_order?: number
  is_active?: boolean
}

class AttributeService {
  async getAll(): Promise<Attribute[]> {
    return apiWrapper.get<Attribute[]>('/attributes')
  }

  async getById(id: number): Promise<Attribute> {
    return apiWrapper.get<Attribute>(`/attributes/${id}`)
  }

  async create(payload: AttributeCreate): Promise<{ message: string }> {
    return apiWrapper.post<{ message: string }>('/attributes', payload)
  }

  async update(id: number, payload: AttributeUpdate): Promise<{ message: string }> {
    return apiWrapper.put<{ message: string }>(`/attributes/${id}`, payload)
  }

  async delete(id: number): Promise<{ message: string }> {
    return apiWrapper.delete<{ message: string }>(`/attributes/${id}`)
  }

  async getValues(attributeId: number): Promise<AttributeValue[]> {
    return apiWrapper.get<AttributeValue[]>(`/attributes/${attributeId}/values`)
  }

  async createValue(attributeId: number, payload: AttributeValueCreate): Promise<{ message: string }> {
    return apiWrapper.post<{ message: string }>(`/attributes/${attributeId}/values`, payload)
  }

  async updateValue(
    attributeId: number,
    valueId: number,
    payload: AttributeValueUpdate
  ): Promise<{ message: string }> {
    return apiWrapper.put<{ message: string }>(
      `/attributes/${attributeId}/values/${valueId}`,
      payload
    )
  }

  async deleteValue(attributeId: number, valueId: number): Promise<{ message: string }> {
    return apiWrapper.delete<{ message: string }>(
      `/attributes/${attributeId}/values/${valueId}`
    )
  }
}

export const attributeService = new AttributeService()
