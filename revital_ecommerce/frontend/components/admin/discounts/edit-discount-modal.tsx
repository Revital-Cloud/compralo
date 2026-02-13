'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"
import { Button } from "@/components/ui"
import { Input } from "@/components/ui"
import { Label } from "@/components/ui"
import { Switch } from "@/components/ui"
import { Calendar } from "@/components/ui"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getCategories } from '@/services/category.service'
import { brandService } from '@/services/brand.service'
import { getProducts } from '@/services/product.service'
import { lineService } from '@/services/line.service'
import { sublineService } from '@/services/subline.service'
import { parseDateSafe, toLocalISOString, isPastDate } from '@/utils/date-helpers'

const discountSchema = z.object({
  nom_descuento: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  des_descuento: z.string().min(3, 'La descripción debe tener al menos 3 caracteres'),
  tipo_descuento: z.enum(['porcentaje', 'monto_fijo']),
  val_descuento: z.string().min(1, 'El valor es requerido'),
  aplica_a: z.string().default('total_pedido'),
  // IDs condicionales
  id_producto_aplica: z.string().optional(),
  id_categoria_producto: z.string().optional(),
  id_linea_producto: z.string().optional(),
  id_sublinea_producto: z.string().optional(),
  id_categoria_aplica: z.string().optional(),
  id_marca_aplica: z.string().optional(),
  id_categoria_linea: z.string().optional(),
  id_linea_aplica: z.string().optional(),
  id_categoria_sublinea: z.string().optional(),
  id_linea_sublinea: z.string().optional(),
  id_sublinea_aplica: z.string().optional(),
  // Resto de campos
  monto_min_compra: z.string().optional(),
  val_puntos_requeridos: z.string().optional(),
  cod_cupon: z.string().optional(),
  costo_envio: z.string().optional(),
  compra_minima: z.string().optional(),
  fec_inicio: z.string().optional(),
  fec_fin: z.string().optional(),
  max_usos: z.string().optional(),
  max_usos_por_usuario: z.string().optional(),
  ind_activo: z.boolean().optional().default(true),
  ind_canjeable_puntos: z.boolean().optional().default(false),
  ind_es_para_cumpleanos: z.boolean().optional().default(false),
  solo_primera_compra: z.boolean().optional().default(false),
  monto_minimo_producto: z.string().optional(),
  cantidad_minima_producto: z.string().optional(),
  requiere_codigo: z.boolean().optional().default(false),
})

type DiscountFormData = z.infer<typeof discountSchema>

export interface EditDiscountModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initialValues: any
  onSubmit: (values: DiscountFormData) => Promise<void> | void
}

export const EditDiscountModal: React.FC<EditDiscountModalProps> = ({ 
  open, 
  onOpenChange, 
  initialValues,
  onSubmit 
}) => {
  // Estados para datos de selects
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [lines, setLines] = useState<any[]>([])
  const [sublines, setSublines] = useState<any[]>([])
  
  // Estados para controlar los Popovers de fechas
  const [openStartDate, setOpenStartDate] = useState(false)
  const [openEndDate, setOpenEndDate] = useState(false)

  const form = useForm<DiscountFormData>({ 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(discountSchema as any),
    defaultValues: {
      tipo_descuento: 'porcentaje',
      aplica_a: 'total_pedido',
      ind_activo: true,
      ind_canjeable_puntos: false,
      ind_es_para_cumpleanos: false,
      solo_primera_compra: false,
      requiere_codigo: false,
      cantidad_minima_producto: '1',
    }
  })
  
  const tipoDescuento = form.watch('tipo_descuento')
  const aplicaA = form.watch('aplica_a')

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catsData, productsData, brandsData, linesData, sublinesData] = await Promise.all([
          getCategories(),
          getProducts(),
          brandService.getAllBrands(),
          lineService.getAllLines(),
          sublineService.getAllSublines()
        ])
        
        setCategories(catsData)
        setProducts(productsData as any)
        setBrands(brandsData)
        setLines(linesData)
        setSublines(sublinesData)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    if (open) {
      loadData()
    }
  }, [open])

  // Cargar valores iniciales cuando cambien - esperar a que open e initialValues estén listos
  useEffect(() => {
    if (!initialValues || !open) return
    const v = initialValues
    const toStr = (x: unknown) => (x != null ? String(x) : '')
    const toDateStr = (x: unknown) => {
      if (!x) return ''
      try {
        const d = new Date(x as string)
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
      } catch {
        return ''
      }
    }
    const formattedValues: any = {
      nom_descuento: toStr(v.nom_descuento),
      des_descuento: toStr(v.des_descuento),
      tipo_descuento: v.tipo_calculo === true ? 'porcentaje' : 'monto_fijo',
      val_descuento: v.tipo_calculo === true ? toStr(v.val_porce_descuento) : toStr(v.val_monto_descuento),
      aplica_a: toStr(v.aplica_a) || 'total_pedido',
      id_producto_aplica: toStr(v.id_producto_aplica),
      id_categoria_producto: toStr(v.id_categoria),
      id_linea_producto: toStr(v.id_linea),
      id_sublinea_producto: toStr(v.id_sublinea),
      id_categoria_aplica: toStr(v.id_categoria_aplica ?? v.id_categoria),
      id_marca_aplica: toStr(v.id_marca_aplica),
      id_categoria_linea: toStr(v.id_categoria),
      id_linea_aplica: toStr(v.id_linea_aplica ?? v.id_linea),
      id_categoria_sublinea: toStr(v.id_categoria),
      id_linea_sublinea: toStr(v.id_linea),
      id_sublinea_aplica: toStr(v.id_sublinea_aplica ?? v.id_sublinea),
      monto_min_compra: toStr(v.min_valor_pedido),
      val_puntos_requeridos: toStr(v.costo_puntos_canje),
      cod_cupon: toStr(v.codigo_descuento),
      fec_inicio: toDateStr(v.fec_inicio),
      fec_fin: toDateStr(v.fec_fin),
      max_usos: toStr(v.max_usos_total),
      max_usos_por_usuario: toStr(v.max_usos_por_usuario),
      ind_activo: v.ind_activo ?? true,
      ind_canjeable_puntos: v.ind_canjeable_puntos ?? false,
      ind_es_para_cumpleanos: v.ind_es_para_cumpleanos ?? false,
      solo_primera_compra: v.solo_primera_compra ?? false,
      monto_minimo_producto: toStr(v.monto_minimo_producto),
      cantidad_minima_producto: toStr(v.cantidad_minima_producto) || '1',
      requiere_codigo: v.requiere_codigo ?? false,
    }
    if (v.aplica_a === 'costo_envio') {
      formattedValues.costo_envio = toStr(v.min_valor_pedido)
    } else if (v.aplica_a === 'compra_minima') {
      formattedValues.compra_minima = toStr(v.min_valor_pedido)
    }
    form.reset(formattedValues)
  }, [initialValues, open, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
    onOpenChange(false)
    setOpenStartDate(false)
    setOpenEndDate(false)
  })
  
  // Resetear estados de Popovers cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setOpenStartDate(false)
      setOpenEndDate(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Descuento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre del descuento */}
          <div className="space-y-2">
            <Label htmlFor="nom_descuento">Nombre del Descuento *</Label>
            <Input
              id="nom_descuento"
              {...form.register('nom_descuento')}
              placeholder="Ej: Black Friday 2024"
            />
            {form.formState.errors.nom_descuento && (
              <p className="text-sm text-red-600">{form.formState.errors.nom_descuento.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="des_descuento">Descripción del Descuento *</Label>
            <Input
              id="des_descuento"
              {...form.register('des_descuento')}
              placeholder="Ej: Descuento especial por tiempo limitado"
            />
            {form.formState.errors.des_descuento && (
              <p className="text-sm text-red-600">{form.formState.errors.des_descuento.message}</p>
            )}
          </div>

          {/* Tipo y Valor */}
          <div className="grid grid-cols-2 gap-6">
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

          {/* Aplica a */}
          <div className="space-y-2">
            <Label htmlFor="aplica_a">Aplica a *</Label>
            <select
              id="aplica_a"
              {...form.register('aplica_a')}
              className="w-full border rounded-md h-10 px-3 text-sm bg-white dark:bg-gray-900"
            >
              <option value="total_pedido">Total del Pedido</option>
              <option value="producto_especifico">Producto Específico</option>
              <option value="categoria_especifica">Categoría Específica</option>
              <option value="marca_especifica">Marca Específica</option>
              <option value="linea_especifica">Línea Específica</option>
              <option value="sublinea_especifica">Sublínea Específica</option>
              <option value="costo_envio">Costo de Envío</option>
              <option value="envio_gratis">Envío Gratis</option>
              <option value="segunda_unidad">Segunda Unidad</option>
              <option value="compra_minima">Compra Mínima</option>
            </select>
          </div>

          {/* SELECTS CONDICIONALES */}
          {aplicaA === 'producto_especifico' && (
            <div className="space-y-2">
              <Label htmlFor="id_producto_aplica">Producto *</Label>
              <select
                id="id_producto_aplica"
                {...form.register('id_producto_aplica')}
                onChange={(e) => {
                  const selectedProductId = e.target.value
                  if (selectedProductId) {
                    const selectedProduct = products.find(p => p.id_producto.toString() === selectedProductId)
                    if (selectedProduct) {
                      form.setValue('id_producto_aplica', selectedProductId)
                      form.setValue('id_categoria_producto', selectedProduct.id_categoria?.toString() || '')
                      form.setValue('id_linea_producto', selectedProduct.id_linea?.toString() || '')
                      form.setValue('id_sublinea_producto', selectedProduct.id_sublinea?.toString() || '')
                    }
                  } else {
                    form.setValue('id_producto_aplica', '')
                    form.setValue('id_categoria_producto', '')
                    form.setValue('id_linea_producto', '')
                    form.setValue('id_sublinea_producto', '')
                  }
                }}
                className="w-full border rounded-md h-10 px-3 text-sm bg-white dark:bg-gray-900"
              >
                <option value="">Selecciona un producto</option>
                {products.map((product, index) => (
                  <option key={`product-${product.id_producto}-${index}`} value={product.id_producto}>
                    {product.nom_producto}
                  </option>
                ))}
              </select>
            </div>
          )}

          {aplicaA === 'categoria_especifica' && (
            <div className="space-y-2">
              <Label htmlFor="id_categoria_aplica">Categoría *</Label>
              <select
                id="id_categoria_aplica"
                {...form.register('id_categoria_aplica')}
                className="w-full border rounded-md h-10 px-3 text-sm bg-white dark:bg-gray-900"
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((category, index) => (
                  <option key={`category-${category.id_categoria}-${index}`} value={category.id_categoria}>
                    {category.nom_categoria}
                  </option>
                ))}
              </select>
            </div>
          )}

          {aplicaA === 'marca_especifica' && (
            <div className="space-y-2">
              <Label htmlFor="id_marca_aplica">Marca *</Label>
              <select
                id="id_marca_aplica"
                {...form.register('id_marca_aplica')}
                className="w-full border rounded-md h-10 px-3 text-sm bg-white dark:bg-gray-900"
              >
                <option value="">Selecciona una marca</option>
                {brands.map((brand, index) => (
                  <option key={`brand-${brand.id_marca}-${index}`} value={brand.id_marca}>
                    {brand.nom_marca}
                  </option>
                ))}
              </select>
            </div>
          )}

          {aplicaA === 'linea_especifica' && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="id_categoria_linea">Categoría *</Label>
                <select
                  id="id_categoria_linea"
                  {...form.register('id_categoria_linea')}
                  className="w-full border rounded-md h-10 px-3 text-sm bg-white dark:bg-gray-900"
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((category, index) => (
                    <option key={`category-line-${category.id_categoria}-${index}`} value={category.id_categoria}>
                      {category.nom_categoria}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="id_linea_aplica">Línea *</Label>
                <select
                  id="id_linea_aplica"
                  {...form.register('id_linea_aplica')}
                  className="w-full border rounded-md h-10 px-3 text-sm bg-white dark:bg-gray-900"
                >
                  <option value="">Selecciona una línea</option>
                  {lines
                    .filter(line => Number(line.id_categoria) === Number(form.watch('id_categoria_linea') || 0))
                    .map((line, index) => (
                      <option key={`line-${line.id_categoria}-${line.id_linea}-${index}`} value={line.id_linea}>
                        {line.nom_linea}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {aplicaA === 'sublinea_especifica' && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="id_categoria_sublinea">Categoría *</Label>
                  <select
                    id="id_categoria_sublinea"
                    {...form.register('id_categoria_sublinea')}
                    className="w-full border rounded-md h-10 px-3 text-sm bg-white dark:bg-gray-900"
                  >
                    <option value="">Selecciona</option>
                    {categories.map((category, index) => (
                      <option key={`category-subline-${category.id_categoria}-${index}`} value={category.id_categoria}>
                        {category.nom_categoria}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_linea_sublinea">Línea *</Label>
                  <select
                    id="id_linea_sublinea"
                    {...form.register('id_linea_sublinea')}
                    className="w-full border rounded-md h-10 px-3 text-sm bg-white dark:bg-gray-900"
                  >
                    <option value="">Selecciona</option>
                    {lines
                      .filter(line => Number(line.id_categoria) === Number(form.watch('id_categoria_sublinea') || 0))
                      .map((line, index) => (
                        <option key={`subline-line-${line.id_categoria}-${line.id_linea}-${index}`} value={line.id_linea}>
                          {line.nom_linea}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_sublinea_aplica">Sublínea *</Label>
                  <select
                    id="id_sublinea_aplica"
                    {...form.register('id_sublinea_aplica')}
                    className="w-full border rounded-md h-10 px-3 text-sm bg-white dark:bg-gray-900"
                  >
                    <option value="">Selecciona</option>
                    {sublines
                      .filter(sub =>
                        Number(sub.id_categoria) === Number(form.watch('id_categoria_sublinea') || 0) &&
                        Number(sub.id_linea) === Number(form.watch('id_linea_sublinea') || 0)
                      )
                      .map((subline, index) => (
                        <option key={`subline-${subline.id_categoria}-${subline.id_linea}-${subline.id_sublinea}-${index}`} value={subline.id_sublinea}>
                          {subline.nom_sublinea}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Campos condicionales para costo_envio y compra_minima */}
          {aplicaA === 'costo_envio' && (
            <div className="space-y-2">
              <Label htmlFor="costo_envio">Costo de Envío *</Label>
              <Input
                id="costo_envio"
                type="number"
                step="0.01"
                {...form.register('costo_envio')}
                placeholder="Ej: 10000"
              />
              <p className="text-xs text-muted-foreground">
                Costo en pesos del envío al aplicar el descuento
              </p>
            </div>
          )}

          {aplicaA === 'compra_minima' && (
            <div className="space-y-2">
              <Label htmlFor="compra_minima">Compra Mínima *</Label>
              <Input
                id="compra_minima"
                type="number"
                step="0.01"
                {...form.register('compra_minima')}
                placeholder="Ej: 200000"
              />
              <p className="text-xs text-muted-foreground">
                Monto mínimo de compra para aplicar el descuento
              </p>
            </div>
          )}

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
          <div className="grid grid-cols-2 gap-6">
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
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fec_inicio">Fecha de Inicio {form.watch('ind_canjeable_puntos') ? '(opcional)' : '*'}</Label>
              <Popover open={openStartDate} onOpenChange={setOpenStartDate}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-start">
                    {form.watch('fec_inicio')
                      ? form.watch('fec_inicio')
                      : 'Selecciona una fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    disabled={isPastDate}
                    selected={parseDateSafe(form.watch('fec_inicio'))}
                    onSelect={(date) => {
                      if (date) {
                        form.setValue('fec_inicio', toLocalISOString(date))
                        setOpenStartDate(false)
                      } else {
                        form.setValue('fec_inicio', '')
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.fec_inicio && (
                <p className="text-sm text-red-600">{form.formState.errors.fec_inicio.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fec_fin">Fecha de Fin {form.watch('ind_canjeable_puntos') ? '(opcional)' : '*'}</Label>
              <Popover open={openEndDate} onOpenChange={setOpenEndDate}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-start">
                    {form.watch('fec_fin')
                      ? form.watch('fec_fin')
                      : 'Selecciona una fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    disabled={isPastDate}
                    selected={parseDateSafe(form.watch('fec_fin'))}
                    onSelect={(date) => {
                      if (date) {
                        form.setValue('fec_fin', toLocalISOString(date))
                        setOpenEndDate(false)
                      } else {
                        form.setValue('fec_fin', '')
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.fec_fin && (
                <p className="text-sm text-red-600">{form.formState.errors.fec_fin.message}</p>
              )}
            </div>
          </div>

          {/* Máximo de usos */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="max_usos">Máximo de Usos Total</Label>
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

            <div className="space-y-2">
              <Label htmlFor="max_usos_por_usuario">Máximo de Usos por Usuario</Label>
              <Input
                id="max_usos_por_usuario"
                type="number"
                {...form.register('max_usos_por_usuario')}
                placeholder="Ej: 5 (dejar vacío para ilimitado)"
              />
              <p className="text-xs text-muted-foreground">
                Número máximo de veces que un usuario puede usar este descuento
              </p>
            </div>
          </div>

          {/* Campos adicionales */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="monto_minimo_producto">Monto Mínimo por Producto ($)</Label>
              <Input
                id="monto_minimo_producto"
                type="number"
                step="0.01"
                {...form.register('monto_minimo_producto')}
                placeholder="Ej: 50000"
              />
              <p className="text-xs text-muted-foreground">Opcional</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad_minima_producto">Cantidad Mínima de Productos</Label>
              <Input
                id="cantidad_minima_producto"
                type="number"
                {...form.register('cantidad_minima_producto')}
                placeholder="Ej: 2"
              />
              <p className="text-xs text-muted-foreground">Mínimo 1</p>
            </div>
          </div>

          {/* Opciones adicionales */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Configuración Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ind_activo">Descuento activo</Label>
                  <p className="text-xs text-muted-foreground">
                    Activa o desactiva el descuento
                  </p>
                </div>
                <Switch
                  id="ind_activo"
                  checked={!!form.watch('ind_activo')}
                  onCheckedChange={(v: boolean) => form.setValue('ind_activo', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ind_canjeable_puntos">Canjeable por puntos</Label>
                  <p className="text-xs text-muted-foreground">
                    Los usuarios pueden canjear este descuento con puntos
                  </p>
                </div>
                <Switch
                  id="ind_canjeable_puntos"
                  checked={!!form.watch('ind_canjeable_puntos')}
                  onCheckedChange={(v: boolean) => form.setValue('ind_canjeable_puntos', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ind_es_para_cumpleanos">Es para cumpleaños</Label>
                  <p className="text-xs text-muted-foreground">
                    Descuento exclusivo para usuarios en su cumpleaños
                  </p>
                </div>
                <Switch
                  id="ind_es_para_cumpleanos"
                  checked={!!form.watch('ind_es_para_cumpleanos')}
                  onCheckedChange={(v: boolean) => form.setValue('ind_es_para_cumpleanos', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="solo_primera_compra">Solo primera compra</Label>
                  <p className="text-xs text-muted-foreground">
                    Aplica únicamente a la primera compra de un usuario
                  </p>
                </div>
                <Switch
                  id="solo_primera_compra"
                  checked={!!form.watch('solo_primera_compra')}
                  onCheckedChange={(v: boolean) => form.setValue('solo_primera_compra', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requiere_codigo">Requiere código de cupón</Label>
                  <p className="text-xs text-muted-foreground">
                    Los usuarios deben ingresar un código para usar este descuento
                  </p>
                </div>
                <Switch
                  id="requiere_codigo"
                  checked={!!form.watch('requiere_codigo')}
                  onCheckedChange={(v: boolean) => form.setValue('requiere_codigo', v)}
                />
              </div>
            </CardContent>
          </Card>

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
              {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
