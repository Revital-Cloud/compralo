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

const InfoBarPage = () => {
  const { data: config, isLoading, isError } = useTopInfoBarConfig()
  const upsertMutation = useUpsertTopInfoBar()

  const [formData, setFormData] = useState({
    des_mensaje: '',
    ind_activo: true,
    ind_visible: true,
    color_fondo: '',
    color_texto: '',
    fec_inicio: '',
    fec_fin: '',
  })

  // Cargar datos cuando estén disponibles
  useEffect(() => {
    if (config) {
      setFormData({
        des_mensaje: config.des_mensaje || '',
        ind_activo: config.ind_activo ?? true,
        ind_visible: config.ind_visible ?? true,
        color_fondo: config.color_fondo || '',
        color_texto: config.color_texto || '',
        fec_inicio: config.fec_inicio || '',
        fec_fin: config.fec_fin || '',
      })
    }
  }, [config])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.des_mensaje.trim()) {
      toast.error('El mensaje es obligatorio')
      return
    }

    if (formData.fec_inicio && formData.fec_fin && formData.fec_fin < formData.fec_inicio) {
      toast.error('La fecha de fin debe ser mayor o igual que la fecha de inicio')
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
      }

      await upsertMutation.mutateAsync(payload)
      toast.success('Configuración de la barra guardada correctamente')
    } catch (error: any) {
      console.error('Error al guardar:', error)
      const errorMessage = error?.response?.data?.detail || 'Error al guardar la configuración'
      toast.error(errorMessage)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CatalogHeader 
          title="Barra Informativa"
          description="Configura la barra informativa superior de tu tienda"
        />
        <div className="text-sm text-muted-foreground">Cargando configuración...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <CatalogHeader 
          title="Barra Informativa"
          description="Configura la barra informativa superior de tu tienda"
        />
        <div className="text-sm text-red-600">Error al cargar la configuración</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Barra Informativa"
        description="Configura la barra informativa superior de tu tienda"
      />

      <Card>
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
              </Label>
              <Textarea
                id="des_mensaje"
                value={formData.des_mensaje}
                onChange={(e) => setFormData({ ...formData, des_mensaje: e.target.value })}
                placeholder="Ej: Envíos gratis en compras superiores a $100.000"
                rows={3}
                required
                maxLength={2000}
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

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fec_inicio">Fecha de inicio (opcional)</Label>
                <Input
                  id="fec_inicio"
                  type="date"
                  value={formData.fec_inicio}
                  onChange={(e) => setFormData({ ...formData, fec_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fec_fin">Fecha de fin (opcional)</Label>
                <Input
                  id="fec_fin"
                  type="date"
                  value={formData.fec_fin}
                  onChange={(e) => setFormData({ ...formData, fec_fin: e.target.value })}
                  min={formData.fec_inicio || undefined}
                />
              </div>
            </div>

            {/* Botón guardar */}
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
