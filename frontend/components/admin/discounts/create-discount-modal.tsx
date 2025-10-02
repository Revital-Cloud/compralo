'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const discountSchema = z.object({
  des_descuento: z.string().min(3, 'La descripción debe tener al menos 3 caracteres'),
  tipo_descuento: z.enum(['porcentaje', 'monto_fijo'], {
    required_error: 'Seleccione un tipo de descuento'
  }),
  val_descuento: z.string().min(1, 'El valor es requerido'),
  monto_min_compra: z.string().optional(),
  val_puntos_requeridos: z.string().optional(),
  cod_cupon: z.string().optional(),
  fec_inicio: z.string().optional(),
  fec_fin: z.string().optional(),
  max_usos: z.string().optional(),
  ind_activo: z.boolean().optional().default(true),
})

type DiscountFormData = z.infer<typeof discountSchema>

export interface CreateDiscountModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (values: DiscountFormData) => Promise<void> | void
}

export const CreateDiscountModal: React.FC<CreateDiscountModalProps> = ({ 
  open, 
  onOpenChange, 
  onSubmit 
}) => {
  const form = useForm<DiscountFormData>({ 
    resolver: zodResolver(discountSchema),
    defaultValues: {
      tipo_descuento: 'porcentaje',
      ind_activo: true,
    }
  })

  const tipoDescuento = form.watch('tipo_descuento')

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
    onOpenChange(false)
    form.reset({
      tipo_descuento: 'porcentaje',
      ind_activo: true,
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Descuento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="des_descuento">Descripción del Descuento *</Label>
            <Input
              id="des_descuento"
              {...form.register('des_descuento')}
              placeholder="Ej: Descuento Black Friday 2024"
            />
            {form.formState.errors.des_descuento && (
              <p className="text-sm text-red-600">{form.formState.errors.des_descuento.message}</p>
            )}
          </div>

          {/* Tipo y Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_descuento">Tipo de Descuento *</Label>
              <select
                id="tipo_descuento"
                {...form.register('tipo_descuento')}
                className="w-full border rounded-md h-10 px-3 text-sm bg-white dark:bg-gray-900"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto_fijo">Monto Fijo ($)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="val_descuento">
                Valor del Descuento * {tipoDescuento === 'porcentaje' ? '(%)' : '($)'}
              </Label>
              <Input
                id="val_descuento"
                type="number"
                step="0.01"
                {...form.register('val_descuento')}
                placeholder={tipoDescuento === 'porcentaje' ? 'Ej: 15' : 'Ej: 50000'}
              />
              {form.formState.errors.val_descuento && (
                <p className="text-sm text-red-600">{form.formState.errors.val_descuento.message}</p>
              )}
            </div>
          </div>

          {/* Código de cupón */}
          <div className="space-y-2">
            <Label htmlFor="cod_cupon">Código de Cupón (Opcional)</Label>
            <Input
              id="cod_cupon"
              {...form.register('cod_cupon')}
              placeholder="Ej: BLACKFRIDAY2024"
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Deja vacío si no requieres código de cupón
            </p>
          </div>

          {/* Restricciones */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto_min_compra">Monto Mínimo de Compra ($)</Label>
              <Input
                id="monto_min_compra"
                type="number"
                step="0.01"
                {...form.register('monto_min_compra')}
                placeholder="Ej: 100000"
              />
              <p className="text-xs text-muted-foreground">Opcional</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="val_puntos_requeridos">Puntos Requeridos</Label>
              <Input
                id="val_puntos_requeridos"
                type="number"
                {...form.register('val_puntos_requeridos')}
                placeholder="Ej: 500"
              />
              <p className="text-xs text-muted-foreground">Para canje con puntos</p>
            </div>
          </div>

          {/* Vigencia */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fec_inicio">Fecha de Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-start">
                    {form.watch('fec_inicio')
                      ? new Date(form.watch('fec_inicio') as any).toLocaleDateString('es-CO')
                      : 'Selecciona una fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('fec_inicio') ? new Date(form.watch('fec_inicio') as any) : undefined}
                    onSelect={(date) => {
                      form.setValue('fec_inicio', date ? new Date(date).toISOString().split('T')[0] : '')
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fec_fin">Fecha de Fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-start">
                    {form.watch('fec_fin')
                      ? new Date(form.watch('fec_fin') as any).toLocaleDateString('es-CO')
                      : 'Selecciona una fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('fec_fin') ? new Date(form.watch('fec_fin') as any) : undefined}
                    onSelect={(date) => {
                      form.setValue('fec_fin', date ? new Date(date).toISOString().split('T')[0] : '')
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Máximo de usos */}
          <div className="space-y-2">
            <Label htmlFor="max_usos">Máximo de Usos</Label>
            <Input
              id="max_usos"
              type="number"
              {...form.register('max_usos')}
              placeholder="Ej: 100 (dejar vacío para ilimitado)"
            />
            <p className="text-xs text-muted-foreground">
              Número máximo de veces que se puede usar este descuento
            </p>
          </div>

          {/* Estado activo */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="ind_activo"
              checked={!!form.watch('ind_activo')}
              onCheckedChange={(v: any) => form.setValue('ind_activo', Boolean(v))}
            />
            <Label htmlFor="ind_activo">Descuento activo</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                onOpenChange(false)
                form.reset()
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-[#fec806] hover:bg-[#e6b800] text-black"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Creando...' : 'Crear Descuento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

