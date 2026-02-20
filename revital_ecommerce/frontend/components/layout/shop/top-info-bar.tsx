'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { get } from '@/utils/apiWrapper'
import { sanitizeHtml } from '@/utils/sanitize'
import { X } from 'lucide-react'
import { Button } from '@/components/ui'

interface TopInfoBarData {
  des_mensaje: string
  color_fondo: string | null
  color_texto: string | null
  boton_texto?: string | null
  boton_url?: string | null
  boton_color_fondo?: string | null
  boton_color_texto?: string | null
}

export function TopInfoBar() {
  const [isDismissed, setIsDismissed] = React.useState(false)

  const { data: barData, isLoading } = useQuery({
    queryKey: ['top-info-bar', 'active'],
    queryFn: async (): Promise<TopInfoBarData | null> => {
      try {
        const data = await get<TopInfoBarData>('/top-info-bar/active')
        return data
      } catch (err: any) {
        if (err?.response?.status === 404) return null
        return null
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutos de cache
    refetchOnWindowFocus: false,
    retry: false,
  })

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  // No renderizar si no hay datos, está cargando, o fue cerrada por el usuario
  if (isLoading || !barData || isDismissed) return null

  return (
    <div
      className="w-full py-2 px-4 text-center text-sm relative z-50 flex items-center justify-center font-sans antialiased"
      style={{
        backgroundColor: barData.color_fondo || '#1a1a2e',
        color: barData.color_texto || '#ffffff',
      }}
    >
      <div
        className="flex-1 min-w-0 [&_strong]:font-semibold [&_em]:italic [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(barData.des_mensaje) }}
      />
      {barData.boton_url?.trim() && (
        <Button asChild size="sm" className="flex-shrink-0 whitespace-nowrap">
          <a
            href={barData.boton_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: barData.boton_color_fondo?.trim() || undefined,
              color: barData.boton_color_texto?.trim() || undefined,
            }}
          >
            {barData.boton_texto?.trim() || 'Ver más'}
          </a>
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleDismiss}
        className="ml-4 h-6 w-6 p-0 hover:bg-black/20 rounded-full flex-shrink-0"
        aria-label="Cerrar barra informativa"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
