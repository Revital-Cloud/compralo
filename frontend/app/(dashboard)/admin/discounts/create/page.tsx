'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateDiscount } from '@/hooks/use-discounts'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

const discountSchema = z.object({
  des_descuento: z.string().min(3, 'La descripción debe tener al menos 3 caracteres'),
  tipo_calculo: z.boolean(),
  val_porce_descuento: z.number().optional(),
  val_monto_descuento: z.number().optional(),
  min_valor_pedido: z.number().optional(),
  costo_puntos_canje: z.number().optional(),
  codigo_descuento: z.string().optional(),
  fec_inicio: z.string().optional(),
  fec_fin: z.string().optional(),
  max_usos_total: z.number().optional(),
  ind_activo: z.boolean(),
})

type DiscountFormData = z.infer<typeof discountSchema>

const CreateDiscountPage = () => {
  const router = useRouter()
  const createMutation = useCreateDiscount()

  const form = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      tipo_calculo: true,
      ind_activo: true,
    }
  })

  const tipoDescuento = form.watch('tipo_calculo')

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values)
      toast.success('Descuento creado exitosamente')
      router.push('/admin/discounts')
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Error al crear el descuento')
    }
  })

  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Crear Descuento"
        description="Define un nuevo descuento o cupón para tu tienda"
        createLabel=""
        onCreateClick={() => {}}
      />

      <Card>
        <CardHeader>
          <CardTitle>Información del Descuento</CardTitle>
          <CardDescription>
            Completa los campos para crear un nuevo descuento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_calculo">Tipo de Descuento *</Label>
                <select
                  id="tipo_calculo"
                  {...form.register('tipo_calculo', { valueAsNumber: false })}
                  className="w-full border rounded-md h-10 px-3 text-sm bg-white dark:bg-gray-900"
                >
                  <option value="true">Porcentaje (%)</option>
                  <option value="false">Monto Fijo ($)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="val_porce_descuento">
                  Valor del Descuento * {tipoDescuento ? '(%)' : '($)'}
                </Label>
                <Input
                  id="val_porce_descuento"
                  type="number"
                  step="0.01"
                  {...form.register('val_porce_descuento', { valueAsNumber: true })}
                  placeholder={tipoDescuento ? 'Ej: 15' : 'Ej: 50000'}
                />
                {form.formState.errors.val_porce_descuento && (
                  <p className="text-sm text-red-600">{form.formState.errors.val_porce_descuento.message}</p>
                )}
              </div>
            </div>

            {/* Código de cupón */}
            <div className="space-y-2">
              <Label htmlFor="codigo_descuento">Código de Cupón (Opcional)</Label>
              <Input
                id="codigo_descuento"
                {...form.register('codigo_descuento')}
                placeholder="Ej: BLACKFRIDAY2024"
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Deja vacío si no requieres código de cupón
              </p>
            </div>

            {/* Restricciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_valor_pedido">Monto Mínimo de Compra ($)</Label>
                <Input
                  id="min_valor_pedido"
                  type="number"
                  step="0.01"
                  {...form.register('min_valor_pedido', { valueAsNumber: true })}
                  placeholder="Ej: 100000"
                />
                <p className="text-xs text-muted-foreground">Opcional</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costo_puntos_canje">Puntos Requeridos</Label>
                <Input
                  id="costo_puntos_canje"
                  type="number"
                  {...form.register('costo_puntos_canje', { valueAsNumber: true })}
                  placeholder="Ej: 500"
                />
                <p className="text-xs text-muted-foreground">Para canje con puntos</p>
              </div>
            </div>

            {/* Vigencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fec_inicio">Fecha de Inicio</Label>
                <Input
                  id="fec_inicio"
                  type="date"
                  {...form.register('fec_inicio')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fec_fin">Fecha de Fin</Label>
                <Input
                  id="fec_fin"
                  type="date"
                  {...form.register('fec_fin')}
                />
              </div>
            </div>

            {/* Máximo de usos */}
            <div className="space-y-2">
              <Label htmlFor="max_usos_total">Máximo de Usos</Label>
              <Input
                id="max_usos_total"
                type="number"
                {...form.register('max_usos_total', { valueAsNumber: true })}
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
                onClick={() => router.push('/admin/discounts')}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#fec806] hover:bg-[#e6b800] text-black"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creando...' : 'Crear Descuento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateDiscountPage

