'use client'

import React, { useState, useEffect } from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { useTopInfoBarConfig, useUpsertTopInfoBar } from '@/hooks/use-top-info-bar'
import { toast } from 'sonner'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import { Textarea } from '@/components/ui'
import { Switch } from '@/components/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { ColorPicker } from '@/components/admin/color-picker'
import { Calendar } from '@/components/ui'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui'
import { IconCalendar } from '@tabler/icons-react'
import { useAdminTour } from '../_tour/useAdminDriverTour'
import { sanitizeHtml } from '@/utils/sanitize'
import { AdminFormSkeleton } from '@/components/admin/skeletons'

const MESSAGE_MAX_LENGTH = 100

const InfoBarPage = () => {
  const { data: config, isLoading, isError } = useTopInfoBarConfig()
  const upsertMutation = useUpsertTopInfoBar()

  const [formData, setFormData] = useState<{
    des_mensaje: string
    ind_activo: boolean
    ind_visible: boolean
    color_fondo: string
    color_texto: string
    fec_inicio: string
    fec_fin: string
    boton_texto: string
    boton_url: string
    boton_color_fondo: string
    boton_color_texto: string
    showButton?: boolean
  }>({
    des_mensaje: '',
    ind_activo: true,
    ind_visible: true,
    color_fondo: '',
    color_texto: '',
    fec_inicio: '',
    fec_fin: '',
    boton_texto: '',
    boton_url: '',
    boton_color_fondo: '',
    boton_color_texto: '',
  })

  useEffect(() => {
    if (config) {
      const cfg = config as {
        boton_texto?: string | null
        boton_url?: string | null
        boton_color_fondo?: string | null
        boton_color_texto?: string | null
      }
      const hasUrl = Boolean(cfg.boton_url?.trim())
      setFormData({
        des_mensaje: config.des_mensaje || '',
        ind_activo: config.ind_activo ?? true,
        ind_visible: config.ind_visible ?? true,
        color_fondo: config.color_fondo || '',
        color_texto: config.color_texto || '',
        fec_inicio: config.fec_inicio || '',
        fec_fin: config.fec_fin || '',
        boton_texto: cfg.boton_texto ?? '',
        boton_url: cfg.boton_url ?? '',
        boton_color_fondo: cfg.boton_color_fondo ?? '',
        boton_color_texto: cfg.boton_color_texto ?? '',
        showButton: hasUrl,
      })
    }
  }, [config])

  const { startInfoBarTour } = useAdminTour()

  useEffect(() => {
    try {
      const seen = localStorage.getItem('revital_info_bar_tour_seen')
      if (!seen) {
        startInfoBarTour()
        localStorage.setItem('revital_info_bar_tour_seen', '1')
      }
    } catch {
      // ignore
    }
  }, [startInfoBarTour])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.des_mensaje.trim()) {
      toast.error('El mensaje es obligatorio')
      return
    }

    if (formData.fec_inicio && formData.fec_fin && formData.fec_fin < formData.fec_inicio) {
      toast.error('La fecha de fin debe ser mayor o igual que la fecha de inicio')
      return
    }

    const hasButton = Boolean(formData.boton_url?.trim())
    if (hasButton && !formData.boton_texto?.trim()) {
      toast.error('Si añades un enlace, indica el texto del botón')
      return
    }

    try {
      const payload = {
        des_mensaje: formData.des_mensaje.trim(),
        ind_activo: formData.ind_activo,
        ind_visible: formData.ind_visible,
        color_fondo: formData.color_fondo.trim() || null,
        color_texto: formData.color_texto.trim() || null,
        fec_inicio: formData.fec_inicio.trim() || null,
        fec_fin: formData.fec_fin.trim() || null,
        boton_texto: hasButton ? formData.boton_texto.trim() : null,
        boton_url: hasButton ? formData.boton_url.trim() : null,
        boton_color_fondo: hasButton && formData.boton_color_fondo.trim() ? formData.boton_color_fondo.trim() : null,
        boton_color_texto: hasButton && formData.boton_color_texto.trim() ? formData.boton_color_texto.trim() : null,
      }

      await upsertMutation.mutateAsync(payload)
      toast.success('Configuración de la barra guardada correctamente')
    } catch (error: unknown) {
      console.error('Error al guardar:', error)
      const err = error as { response?: { data?: { detail?: string } } }
      const errorMessage = err?.response?.data?.detail || 'Error al guardar la configuración'
      toast.error(errorMessage)
    }
  }

  const previewStyle = {
    backgroundColor: formData.color_fondo || '#1a1a2e',
    color: formData.color_texto || '#ffffff',
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div data-tour-id="info-bar-header">
          <CatalogHeader
            title="Barra Informativa"
            description="Configura la barra informativa superior de tu tienda"
            showImportButton={false}
          />
        </div>
        <AdminFormSkeleton fields={8} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div data-tour-id="info-bar-header">
          <CatalogHeader
            title="Barra Informativa"
            description="Configura la barra informativa superior de tu tienda"
            showImportButton={false}
          />
        </div>
        <div className="text-sm text-red-600">Error al cargar la configuración</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div data-tour-id="info-bar-header">
        <CatalogHeader
          title="Barra Informativa"
          description="Configura la barra informativa superior de tu tienda"
          showImportButton={false}
        />
      </div>

      {/* Preview */}
      <Card data-tour-id="info-bar-preview">
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
          <CardDescription>
            Así se verá la barra en la parte superior de tu tienda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="w-full py-2 px-4 text-center text-sm rounded-md flex items-center justify-center gap-2 font-sans antialiased min-h-[44px] flex-wrap"
            style={previewStyle}
          >
            <div
              className="flex-1 [&_strong]:font-semibold [&_em]:italic [&_a]:underline min-w-0"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(formData.des_mensaje || 'Tu mensaje aquí…'),
              }}
            />
            {formData.boton_url?.trim() && (
              <Button asChild size="sm" className="flex-shrink-0">
                <a
                  href={formData.boton_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: formData.boton_color_fondo?.trim() || undefined,
                    color: formData.boton_color_texto?.trim() || undefined,
                  }}
                >
                  {formData.boton_texto?.trim() || 'Ver más'}
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card data-tour-id="info-bar-form">
        <CardHeader>
          <CardTitle>Configuración de la Barra</CardTitle>
          <CardDescription>
            Personaliza el mensaje, colores y fechas de vigencia de la barra informativa que aparece en la parte superior de tu tienda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mensaje */}
            <div className="space-y-2">
              <Label htmlFor="des_mensaje">
                Mensaje <span className="text-red-500">*</span>
                <span className="text-muted-foreground font-normal ml-2">
                  {formData.des_mensaje.length} / {MESSAGE_MAX_LENGTH}
                </span>
              </Label>
              <Textarea
                id="des_mensaje"
                value={formData.des_mensaje}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    des_mensaje: e.target.value.slice(0, MESSAGE_MAX_LENGTH),
                  }))
                }
                placeholder="Ej: Envíos gratis en compras superiores a $100.000"
                rows={2}
                required
                maxLength={MESSAGE_MAX_LENGTH}
              />
              <p className="text-xs text-muted-foreground">
                Puedes usar HTML básico: &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;br&gt;
              </p>
            </div>

            {/* Estados */}
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="ind_activo"
                  checked={formData.ind_activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ind_activo: checked })}
                />
                <Label htmlFor="ind_activo">Activo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ind_visible"
                  checked={formData.ind_visible}
                  onCheckedChange={(checked) => setFormData({ ...formData, ind_visible: checked })}
                />
                <Label htmlFor="ind_visible">Visible</Label>
              </div>
            </div>

            {/* Colores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ColorPicker
                value={formData.color_fondo}
                onChange={(color) => setFormData({ ...formData, color_fondo: color })}
                label="Color de fondo"
                placeholder="#1a1a2e o nombre CSS"
              />
              <ColorPicker
                value={formData.color_texto}
                onChange={(color) => setFormData({ ...formData, color_texto: color })}
                label="Color del texto"
                placeholder="#ffffff o nombre CSS"
              />
            </div>

            {/* Fechas con Calendar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de inicio (opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-start">
                      <IconCalendar className="h-4 w-4 mr-2 opacity-50" />
                      {formData.fec_inicio
                        ? new Date(formData.fec_inicio + 'T12:00:00').toLocaleDateString('es-CO')
                        : 'Seleccionar fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.fec_inicio ? new Date(formData.fec_inicio + 'T12:00:00') : undefined}
                      onSelect={(date) =>
                        setFormData({
                          ...formData,
                          fec_inicio: date ? new Date(date).toISOString().split('T')[0] : '',
                        })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Fecha de fin (opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-start">
                      <IconCalendar className="h-4 w-4 mr-2 opacity-50" />
                      {formData.fec_fin
                        ? new Date(formData.fec_fin + 'T12:00:00').toLocaleDateString('es-CO')
                        : 'Seleccionar fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.fec_fin ? new Date(formData.fec_fin + 'T12:00:00') : undefined}
                      disabled={
                        formData.fec_inicio
                          ? (date) => date < new Date(formData.fec_inicio + 'T00:00:00')
                          : undefined
                      }
                      onSelect={(date) =>
                        setFormData({
                          ...formData,
                          fec_fin: date ? new Date(date).toISOString().split('T')[0] : '',
                        })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Botón opcional con enlace */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="use_button"
                  checked={formData.showButton ?? Boolean(formData.boton_url?.trim())}
                  onCheckedChange={(checked) => {
                    setFormData((prev) => ({
                      ...prev,
                      showButton: checked,
                      boton_texto: checked ? prev.boton_texto : '',
                      boton_url: checked ? (prev.boton_url?.trim() || 'https://') : '',
                    }))
                  }}
                />
                <Label htmlFor="use_button">Añadir botón con enlace (CTA)</Label>
              </div>
              {(formData.showButton ?? Boolean(formData.boton_url?.trim())) && (
                <div className="space-y-4 pl-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="boton_texto">Texto del botón <span className="text-red-500">*</span></Label>
                      <Input
                        id="boton_texto"
                        value={formData.boton_texto}
                        onChange={(e) => setFormData({ ...formData, boton_texto: e.target.value })}
                        placeholder="Ej: Ver ofertas"
                        maxLength={80}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boton_url">Enlace (URL) <span className="text-red-500">*</span></Label>
                      <Input
                        id="boton_url"
                        type="url"
                        value={formData.boton_url}
                        onChange={(e) => setFormData({ ...formData, boton_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorPicker
                      value={formData.boton_color_fondo}
                      onChange={(c) => setFormData({ ...formData, boton_color_fondo: c })}
                      label="Color de fondo del botón"
                      placeholder="#ffffff o nombre CSS"
                    />
                    <ColorPicker
                      value={formData.boton_color_texto}
                      onChange={(c) => setFormData({ ...formData, boton_color_texto: c })}
                      label="Color del texto del botón"
                      placeholder="#000000 o nombre CSS"
                    />
                  </div>
                </div>
              )}
              {!formData.boton_url?.trim() && (
                <p className="text-xs text-muted-foreground pl-6">
                  Activa el interruptor y rellena texto y URL para mostrar un botón en la barra.
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default InfoBarPage
