'use client'

import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useActivePointsRate, useCreatePointsConfig, useUpdatePointsConfig } from '@/hooks/use-points'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export const CreatePointsConfigModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const { data: activeRates } = useActivePointsRate()
  const createMutation = useCreatePointsConfig()
  const updateMutation = useUpdatePointsConfig()

  const activeRate = useMemo(() => Array.isArray(activeRates) && activeRates.length > 0 ? activeRates[0] : null, [activeRates])

  const [formData, setFormData] = useState({
    pesos_por_punto: activeRate?.pesos_por_punto || '',
    puntos_por_peso: activeRate?.puntos_por_peso || '',
    fec_inicio: activeRate?.fec_inicio ? new Date(activeRate.fec_inicio).toISOString().split('T')[0] : '',
    fec_fin: activeRate?.fec_fin ? new Date(activeRate.fec_fin).toISOString().split('T')[0] : '',
    ind_activo: activeRate?.ind_activo ?? true,
  })

  React.useEffect(() => {
    setFormData({
      pesos_por_punto: activeRate?.pesos_por_punto || '',
      puntos_por_peso: activeRate?.puntos_por_peso || '',
      fec_inicio: activeRate?.fec_inicio ? new Date(activeRate.fec_inicio).toISOString().split('T')[0] : '',
      fec_fin: activeRate?.fec_fin ? new Date(activeRate.fec_fin).toISOString().split('T')[0] : '',
      ind_activo: activeRate?.ind_activo ?? true,
    })
  }, [activeRate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (activeRate) {
      await updateMutation.mutateAsync({ id: activeRate.id_config_puntos, data: formData })
    } else {
      await createMutation.mutateAsync(formData)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{activeRate ? 'Actualizar configuración de puntos' : 'Nueva configuración de puntos'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pesos_por_punto">Pesos por Punto</Label>
              <Input
                id="pesos_por_punto"
                type="number"
                step="0.01"
                placeholder="Ej: 100"
                value={formData.pesos_por_punto}
                onChange={(e) => setFormData({ ...formData, pesos_por_punto: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">Cuántos pesos se necesitan para ganar 1 punto</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="puntos_por_peso">Puntos por Peso</Label>
              <Input
                id="puntos_por_peso"
                type="number"
                step="0.01"
                placeholder="Ej: 0.01"
                value={formData.puntos_por_peso}
                onChange={(e) => setFormData({ ...formData, puntos_por_peso: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">Cuántos puntos se ganan por cada peso gastado</p>
            </div>

            <div className="space-y-2">
              <Label>Fecha de Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-start">
                    {formData.fec_inicio ? new Date(formData.fec_inicio).toLocaleDateString('es-CO') : 'Selecciona una fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.fec_inicio ? new Date(formData.fec_inicio) : undefined}
                    onSelect={(date) => setFormData({ ...formData, fec_inicio: date ? new Date(date).toISOString().split('T')[0] : '' })}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Fecha de Fin (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-start">
                    {formData.fec_fin ? new Date(formData.fec_fin).toLocaleDateString('es-CO') : 'Selecciona una fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.fec_fin ? new Date(formData.fec_fin) : undefined}
                    onSelect={(date) => setFormData({ ...formData, fec_fin: date ? new Date(date).toISOString().split('T')[0] : '' })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="ind_activo" checked={!!formData.ind_activo} onCheckedChange={(checked) => setFormData({ ...formData, ind_activo: checked })} />
            <Label htmlFor="ind_activo">Configuración activa</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-[#fec806] hover:bg-[#e6b800] text-black" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : (activeRate ? 'Actualizar' : 'Crear configuración')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreatePointsConfigModal


