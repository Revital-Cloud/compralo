'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Button } from "@/components/ui"
import { Input } from "@/components/ui"
import { Label } from "@/components/ui"
import { Checkbox } from "@/components/ui"
import { useDiscounts, useUpdateDiscount } from '@/hooks/use-discounts'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { discountPageEditSchema, type DiscountPageEditFormData } from '@/schemas/admin/discount.schema'
import { toast } from 'sonner'
import { AdminFormSkeleton } from '@/components/admin/skeletons'

const EditDiscountPage = () => {
  const router = useRouter()
  const params = useParams()
  const discountId = params.id as string
  
  const { data: discounts, isLoading } = useDiscounts()
  const updateMutation = useUpdateDiscount()

  const discount = discounts?.find((d: any) => d.id_descuento === discountId)

  const form = useForm<DiscountPageEditFormData>({
    resolver: zodResolver(discountPageEditSchema),
    defaultValues: discount ? {
      des_descuento: discount.des_descuento,
      tipo_calculo: discount.tipo_calculo ? 'true' : 'false',
      val_porce_descuento: discount.val_porce_descuento,
      val_monto_descuento: discount.val_monto_descuento,
      min_valor_pedido: discount.min_valor_pedido,
      costo_puntos_canje: discount.costo_puntos_canje,
      codigo_descuento: discount.codigo_descuento,
      fec_inicio: discount.fec_inicio ? new Date(discount.fec_inicio).toISOString().split('T')[0] : '',
      fec_fin: discount.fec_fin ? new Date(discount.fec_fin).toISOString().split('T')[0] : '',
      max_usos_total: discount.max_usos_total,
      ind_activo: discount.ind_activo,
    } : {}
  })

  React.useEffect(() => {
    if (discount) {
      form.reset({
        des_descuento: discount.des_descuento,
        tipo_calculo: discount.tipo_calculo ? 'true' : 'false',
        val_porce_descuento: discount.val_porce_descuento,
        val_monto_descuento: discount.val_monto_descuento,
        min_valor_pedido: discount.min_valor_pedido,
        costo_puntos_canje: discount.costo_puntos_canje,
        codigo_descuento: discount.codigo_descuento,
        fec_inicio: discount.fec_inicio ? new Date(discount.fec_inicio).toISOString().split('T')[0] : '',
        fec_fin: discount.fec_fin ? new Date(discount.fec_fin).toISOString().split('T')[0] : '',
        max_usos_total: discount.max_usos_total,
        ind_activo: discount.ind_activo,
      })
    }
  }, [discount, form])

  const tipoDescuento = form.watch('tipo_calculo')

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const data = {
        ...values,
        tipo_calculo: values.tipo_calculo === 'true'
      }
      await updateMutation.mutateAsync({ id: discountId, data })
      toast.success('Descuento actualizado exitosamente')
      router.push('/admin/discounts')
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Error al actualizar el descuento')
    }
  })

  if (isLoading) {
    return <AdminFormSkeleton fields={8} />
  }

  if (!discount) {
    return <div className="text-sm text-red-600">Descuento no encontrado</div>
  }

  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Editar Descuento"
        description={`Modificando: ${discount.des_descuento}`}
        createLabel=""
        onCreateClick={() => {}}
      />

      <Card>
        <CardHeader>
          <CardTitle>Información del Descuento</CardTitle>
          <CardDescription>
            Actualiza los campos necesarios
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
                  Valor del Descuento * {tipoDescuento === 'true' ? '(%)' : '($)'}
                </Label>
                <Input
                  id="val_porce_descuento"
                  type="number"
                  step="0.01"
                  {...form.register('val_porce_descuento', { valueAsNumber: true })}
                  placeholder={tipoDescuento === 'true' ? 'Ej: 15' : 'Ej: 50000'}
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
                  {...form.register('min_valor_pedido')}
                  placeholder="Ej: 100000"
                />
                <p className="text-xs text-muted-foreground">Opcional</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costo_puntos_canje">Puntos Requeridos</Label>
                <Input
                  id="costo_puntos_canje"
                  type="number"
                  {...form.register('costo_puntos_canje')}
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
                {...form.register('max_usos_total')}
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
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default EditDiscountPage

