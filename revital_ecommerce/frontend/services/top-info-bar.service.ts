import { get, put } from '@/utils/apiWrapper'

export interface TopInfoBarConfig {
  id_cms_content: number
  nom_cms_content: string
  des_mensaje: string
  ind_activo: boolean
  ind_visible: boolean
  color_fondo: string | null
  color_texto: string | null
  fec_inicio: string | null
  fec_fin: string | null
  boton_texto: string | null
  boton_url: string | null
  boton_color_fondo: string | null
  boton_color_texto: string | null
  num_version: number
}

export interface TopInfoBarPayload {
  des_mensaje: string
  ind_activo: boolean
  ind_visible: boolean
  color_fondo?: string | null
  color_texto?: string | null
  fec_inicio?: string | null
  fec_fin?: string | null
  boton_texto?: string | null
  boton_url?: string | null
  boton_color_fondo?: string | null
  boton_color_texto?: string | null
}

export const topInfoBarService = {
  async getConfig(): Promise<TopInfoBarConfig | null> {
    try {
      return await get<TopInfoBarConfig>('/top-info-bar')
    } catch (err: any) {
      if (err?.response?.status === 404) return null
      throw err
    }
  },

  async upsertConfig(payload: TopInfoBarPayload): Promise<{ message: string }> {
    return put<{ message: string }>('/top-info-bar', payload)
  }
}

export default topInfoBarService
