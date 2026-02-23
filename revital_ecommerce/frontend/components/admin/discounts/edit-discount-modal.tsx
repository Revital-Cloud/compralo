'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"
import { Button } from "@/components/ui"
import { Input } from "@/components/ui"
import { Label } from "@/components/ui"
import { Switch } from "@/components/ui"
import { Calendar } from "@/components/ui"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { discountModalSchema, type DiscountModalFormData } from '@/schemas/admin/discount.schema'
import { getCategories } from '@/services/category.service'
import { brandService } from '@/services/brand.service'
import { getProductsAdmin } from '@/services/product.service'
import { getUsers } from '@/services/user.service'
import { discountService } from '@/services/discount.service'
import { toast } from 'sonner'
import { parseDateSafe, toLocalISOString, isPastDate } from '@/utils/date-helpers'
import type { Category } from '@/types/category'

/** Evita que el scroll del ratón cambie el valor en inputs number */
const blockScrollOnNumberInput = (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur()

export interface EditDiscountModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initialValues: any
  onSubmit: (values: DiscountModalFormData) => Promise<void> | void
}

export const EditDiscountModal: React.FC<EditDiscountModalProps> = ({ 
  open, 
  onOpenChange, 
  initialValues,
  onSubmit 
}) => {
  // Estados para datos de selects
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [users, setUsers] = useState<{ id_usuario: number; nom_usuario: string; ape_usuario?: string; email_usuario?: string }[]>([])
  const [sendingCoupon, setSendingCoupon] = useState(false)
  
  // Estados para controlar los Popovers de fechas
  const [openStartDate, setOpenStartDate] = useState(false)
  const [openEndDate, setOpenEndDate] = useState(false)

  // Estados para selects en cascada de categorías
  const [selectedLevel1Id, setSelectedLevel1Id] = useState<number | null>(null)
  const [selectedLevel2Id, setSelectedLevel2Id] = useState<number | null>(null)
  const [selectedLevel3Id, setSelectedLevel3Id] = useState<number | null>(null)

  // Helper functions para trabajar con categorías
  const categoryIdNum = (c: Category): number => {
    return typeof c.id === 'number' ? c.id : Number(c.id)
  }

  const parentIdNum = (c: Category): number | null => {
    if (c.parent_id == null) return null
    return typeof c.parent_id === 'number' ? c.parent_id : Number(c.parent_id)
  }

  const isCategoryActive = (c: Category): boolean => {
    return (c.is_active ?? c.ind_activo) !== false
  }

  // Filtrar categorías por nivel
  const list = Array.isArray(categories) ? categories : []
  const level1Options = useMemo(
    () => list.filter((c) => parentIdNum(c) == null && isCategoryActive(c)),
    [list]
  )
  const level2Options = useMemo(
    () =>
      selectedLevel1Id == null
        ? []
        : list.filter((c) => parentIdNum(c) === selectedLevel1Id && isCategoryActive(c)),
    [list, selectedLevel1Id]
  )
  const level3Options = useMemo(
    () =>
      selectedLevel2Id == null
        ? []
        : list.filter((c) => parentIdNum(c) === selectedLevel2Id && isCategoryActive(c)),
    [list, selectedLevel2Id]
  )

  // Función para encontrar la ruta de una categoría (padre → abuelo → bisabuelo). useCallback evita loop.
  const findCategoryPath = useCallback((categoryId: number | string | null | undefined): number[] => {
    if (!categoryId) return []
    const id = typeof categoryId === 'string' ? Number(categoryId) : categoryId
    if (Number.isNaN(id)) return []

    const path: number[] = []
    let current: Category | undefined = list.find((c) => categoryIdNum(c) === id)
    
    while (current) {
      path.unshift(categoryIdNum(current))
      const parentId = parentIdNum(current)
      if (parentId == null) break
      current = list.find((c) => categoryIdNum(c) === parentId)
    }
    
    return path
  }, [list])

  const form = useForm<DiscountModalFormData>({ 
    resolver: zodResolver(discountModalSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      tipo_descuento: 'porcentaje',
      aplica_a: 'total_pedido',
      ind_activo: true,
      ind_canjeable_puntos: false,
      ind_es_para_cumpleanos: false,
      solo_primera_compra: false,
      requiere_codigo: false,
      id_usuario_destino: '',
      cantidad_minima_producto: '1',
    }
  })
  
  const tipoDescuento = form.watch('tipo_descuento')
  const aplicaA = form.watch('aplica_a')
  const requiereCodigo = form.watch('requiere_codigo')
  const idUsuarioDestino = form.watch('id_usuario_destino')
  const codCupon = form.watch('cod_cupon')

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catsData, productsData, brandsData, usersData] = await Promise.all([
          getCategories(),
          getProductsAdmin({ limit: 1000, offset: 0 }),
          brandService.getAllBrands(),
          getUsers().then((r: any) => (Array.isArray(r) ? r : r?.data ?? [])),
        ])
        setCategories(catsData)
        setProducts(productsData as any)
        setBrands(brandsData)
        setUsers(Array.isArray(usersData) ? usersData : [])
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    if (open) {
      loadData()
    }
  }, [open])

  // Limpiar estados de cascada cuando cambia aplica_a
  useEffect(() => {
    if (aplicaA !== 'categoria_especifica') {
      setSelectedLevel1Id(null)
      setSelectedLevel2Id(null)
      setSelectedLevel3Id(null)
      form.setValue('id_categoria_aplica', '')
    }
  }, [aplicaA, form])

  // Actualizar id_categoria_aplica cuando cambia cualquier nivel
  useEffect(() => {
    if (aplicaA === 'categoria_especifica') {
      const finalCategoryId = selectedLevel3Id ?? selectedLevel2Id ?? selectedLevel1Id
      if (finalCategoryId != null) {
        form.setValue('id_categoria_aplica', String(finalCategoryId))
      } else {
        form.setValue('id_categoria_aplica', '')
      }
    }
  }, [selectedLevel1Id, selectedLevel2Id, selectedLevel3Id, aplicaA, form])

  // Cargar valores iniciales cuando abra el modal con datos. No esperar categorías para el form base.
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
    // Backend puede devolver category_id_aplica/product_id_aplica; mapear a id_*_aplica
    const idProducto = v.id_producto_aplica ?? v.product_id_aplica
    const idCategoria = v.id_categoria_aplica ?? v.category_id_aplica
    const formattedValues: any = {
      nom_descuento: toStr(v.nom_descuento),
      des_descuento: toStr(v.des_descuento),
      tipo_descuento: v.tipo_calculo === true ? 'porcentaje' : 'monto_fijo',
      val_descuento: v.tipo_calculo === true ? toStr(v.val_porce_descuento) : toStr(v.val_monto_descuento),
      aplica_a: toStr(v.aplica_a) || 'total_pedido',
      id_producto_aplica: toStr(idProducto),
      id_categoria_aplica: toStr(idCategoria),
      id_marca_aplica: toStr(v.id_marca_aplica),
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
      id_usuario_destino: toStr(v.id_usuario_destino),
    }
    if (v.aplica_a === 'costo_envio') {
      formattedValues.costo_envio = toStr(v.min_valor_pedido)
    } else if (v.aplica_a === 'compra_minima') {
      formattedValues.compra_minima = toStr(v.min_valor_pedido)
    }
    form.reset(formattedValues)
    // Validar vigencia inmediatamente al cargar valores iniciales
    void form.trigger(['fec_inicio', 'fec_fin'])

    // Inicializar estados de cascada si hay id_categoria_aplica (cuando categorías están cargadas)
    if (list.length > 0 && v.aplica_a === 'categoria_especifica' && (idCategoria || v.id_categoria_aplica)) {
      const path = findCategoryPath(idCategoria ?? v.id_categoria_aplica)
      if (path.length > 0) {
        setSelectedLevel1Id(path[0] ?? null)
        if (path.length > 1) {
          setSelectedLevel2Id(path[1] ?? null)
        }
        if (path.length > 2) {
          setSelectedLevel3Id(path[2] ?? null)
        }
      }
    }
  }, [initialValues, open, form, list, findCategoryPath])

  const handleSubmit = form.handleSubmit(async (values: DiscountModalFormData) => {
    await onSubmit(values)
    onOpenChange(false)
    setOpenStartDate(false)
    setOpenEndDate(false)
  })
  
  // Resetear estados de Popovers y cascada cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setOpenStartDate(false)
      setOpenEndDate(false)
      setSelectedLevel1Id(null)
      setSelectedLevel2Id(null)
      setSelectedLevel3Id(null)
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
              <Select
                value={form.watch('tipo_descuento')}
                onValueChange={(value) => form.setValue('tipo_descuento', value as 'porcentaje' | 'monto_fijo')}
              >
                <SelectTrigger id="tipo_descuento" className="w-full">
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                  <SelectItem value="monto_fijo">Monto Fijo ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="val_descuento">
                Valor del Descuento * {tipoDescuento === 'porcentaje' ? '(%)' : '($)'}
              </Label>
              <Input
                id="val_descuento"
                type="number"
                step="0.01"
                min={0}
                onWheel={blockScrollOnNumberInput}
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
            <Select
              value={form.watch('aplica_a')}
              onValueChange={(value) => form.setValue('aplica_a', value)}
            >
              <SelectTrigger id="aplica_a" className="w-full">
                <SelectValue placeholder="Selecciona a qué aplica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total_pedido">Total del Pedido</SelectItem>
                <SelectItem value="producto_especifico">Producto Específico</SelectItem>
                <SelectItem value="categoria_especifica">Categoría Específica</SelectItem>
                <SelectItem value="marca_especifica">Marca Específica</SelectItem>
                <SelectItem value="costo_envio">Costo de Envío</SelectItem>
                <SelectItem value="envio_gratis">Envío Gratis</SelectItem>
                <SelectItem value="segunda_unidad">Segunda Unidad</SelectItem>
                <SelectItem value="compra_minima">Compra Mínima</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SELECTS CONDICIONALES */}
          {aplicaA === 'producto_especifico' && (
            <div className="space-y-2">
              <Label htmlFor="id_producto_aplica">Producto *</Label>
              <Select
                value={form.watch('id_producto_aplica') || ''}
                onValueChange={(value) => form.setValue('id_producto_aplica', value || '')}
              >
                <SelectTrigger id="id_producto_aplica" className="w-full">
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: { id?: string | number; id_producto?: number; name?: string; nom_producto?: string }, index) => {
                    const pid = String(product.id_producto ?? product.id ?? '')
                    const pname = product.nom_producto ?? product.name ?? ''
                    return (
                      <SelectItem key={`product-${pid}-${index}`} value={pid}>
                        {pname}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {aplicaA === 'categoria_especifica' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="level1_category">Nivel 1 (Categoría Principal) *</Label>
                <Select
                  value={selectedLevel1Id ? String(selectedLevel1Id) : ''}
                  onValueChange={(value) => {
                    const numValue = value ? Number(value) : null
                    setSelectedLevel1Id(numValue)
                    setSelectedLevel2Id(null)
                    setSelectedLevel3Id(null)
                  }}
                >
                  <SelectTrigger id="level1_category" className="w-full">
                    <SelectValue placeholder="Selecciona una categoría principal" />
                  </SelectTrigger>
                  <SelectContent>
                    {level1Options.map((category) => (
                      <SelectItem key={`level1-${categoryIdNum(category)}`} value={String(categoryIdNum(category))}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedLevel1Id != null && level2Options.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="level2_category">Nivel 2 (Subcategoría) {level3Options.length > 0 ? '*' : '(Opcional)'}</Label>
                  <Select
                    value={selectedLevel2Id ? String(selectedLevel2Id) : ''}
                    onValueChange={(value) => {
                      const numValue = value ? Number(value) : null
                      setSelectedLevel2Id(numValue)
                      setSelectedLevel3Id(null)
                    }}
                  >
                    <SelectTrigger id="level2_category" className="w-full">
                      <SelectValue placeholder="Selecciona una subcategoría (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {level2Options.map((category) => (
                        <SelectItem key={`level2-${categoryIdNum(category)}`} value={String(categoryIdNum(category))}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedLevel2Id != null && level3Options.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="level3_category">Nivel 3 (Sub-subcategoría) (Opcional)</Label>
                  <Select
                    value={selectedLevel3Id ? String(selectedLevel3Id) : ''}
                    onValueChange={(value) => {
                      const numValue = value ? Number(value) : null
                      setSelectedLevel3Id(numValue)
                    }}
                  >
                    <SelectTrigger id="level3_category" className="w-full">
                      <SelectValue placeholder="Selecciona una sub-subcategoría (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {level3Options.map((category) => (
                        <SelectItem key={`level3-${categoryIdNum(category)}`} value={String(categoryIdNum(category))}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                El descuento se aplicará a la última categoría seleccionada y todas sus subcategorías.
              </p>
            </div>
          )}

          {aplicaA === 'marca_especifica' && (
            <div className="space-y-2">
              <Label htmlFor="id_marca_aplica">Marca *</Label>
              <Select
                value={form.watch('id_marca_aplica') || ''}
                onValueChange={(value) => form.setValue('id_marca_aplica', value || '')}
              >
                <SelectTrigger id="id_marca_aplica" className="w-full">
                  <SelectValue placeholder="Selecciona una marca" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand, index) => (
                    <SelectItem key={`brand-${brand.id_marca}-${index}`} value={String(brand.id_marca)}>
                      {brand.nom_marca}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                min={0}
                onWheel={blockScrollOnNumberInput}
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
                min={0}
                onWheel={blockScrollOnNumberInput}
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

          {/* Restricciones: no mostrar "Monto Mínimo de Compra" si ya se definió con Compra Mínima o Costo de Envío */}
          <div className="grid grid-cols-2 gap-6">
            {aplicaA !== 'compra_minima' && aplicaA !== 'costo_envio' && (
              <div className="space-y-2">
                <Label htmlFor="monto_min_compra">Monto Mínimo de Compra ($)</Label>
                <Input
                  id="monto_min_compra"
                  type="number"
                  step="0.01"
                  min={0}
                  onWheel={blockScrollOnNumberInput}
                  {...form.register('monto_min_compra')}
                  placeholder="Ej: 100000"
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. El descuento solo aplica si el total del pedido es al menos este monto.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="val_puntos_requeridos">
                Puntos Requeridos {form.watch('ind_canjeable_puntos') ? '*' : '(opcional)'}
              </Label>
              <Input
                id="val_puntos_requeridos"
                type="number"
                min={0}
                onWheel={blockScrollOnNumberInput}
                {...form.register('val_puntos_requeridos')}
                placeholder="Ej: 500"
              />
              {form.formState.errors.val_puntos_requeridos && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.val_puntos_requeridos.message}
                </p>
              )}
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
                        form.setValue('fec_inicio', toLocalISOString(date), { shouldValidate: true, shouldDirty: true })
                        setOpenStartDate(false)
                        void form.trigger(['fec_inicio', 'fec_fin'])
                      } else {
                        form.setValue('fec_inicio', '', { shouldValidate: true, shouldDirty: true })
                        void form.trigger(['fec_inicio', 'fec_fin'])
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
                        form.setValue('fec_fin', toLocalISOString(date), { shouldValidate: true, shouldDirty: true })
                        setOpenEndDate(false)
                        void form.trigger(['fec_inicio', 'fec_fin'])
                      } else {
                        form.setValue('fec_fin', '', { shouldValidate: true, shouldDirty: true })
                        void form.trigger(['fec_inicio', 'fec_fin'])
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
                min={0}
                onWheel={blockScrollOnNumberInput}
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
                min={0}
                onWheel={blockScrollOnNumberInput}
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
              <Label htmlFor="monto_minimo_producto">Monto Mínimo por Línea ($)</Label>
              <Input
                id="monto_minimo_producto"
                type="number"
                step="0.01"
                min={0}
                onWheel={blockScrollOnNumberInput}
                {...form.register('monto_minimo_producto')}
                placeholder="Ej: 50000"
              />
              <p className="text-xs text-muted-foreground">
                Opcional. Cada línea del carrito (cantidad × precio) debe ser al menos este valor para que el descuento aplique a esa línea.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad_minima_producto">Cantidad Mínima de Productos</Label>
              <Input
                id="cantidad_minima_producto"
                type="number"
                min={1}
                onWheel={blockScrollOnNumberInput}
                {...form.register('cantidad_minima_producto')}
                placeholder="Ej: 2"
              />
              {form.formState.errors.cantidad_minima_producto && (
                <p className="text-sm text-red-600">{form.formState.errors.cantidad_minima_producto.message}</p>
              )}
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
                  onCheckedChange={(v: boolean) => {
                  form.setValue('ind_canjeable_puntos', v)
                  void form.trigger('val_puntos_requeridos')
                }}
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

          {requiereCodigo && (
            <div className="space-y-2">
              <Label htmlFor="id_usuario_destino">Usuario destinatario (solo él podrá usar el código)</Label>
              <select
                id="id_usuario_destino"
                {...form.register('id_usuario_destino')}
                className="w-full border rounded-md h-10 px-3 text-sm bg-white dark:bg-gray-900"
              >
                <option value="">Ninguno</option>
                {users.map((u) => (
                  <option key={u.id_usuario} value={u.id_usuario}>
                    {u.nom_usuario} {u.ape_usuario || ''} {u.email_usuario ? `(${u.email_usuario})` : ''}
                  </option>
                ))}
              </select>
              {idUsuarioDestino && codCupon?.trim() && initialValues?.id_descuento && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={sendingCoupon}
                  onClick={async () => {
                    setSendingCoupon(true)
                    try {
                      await discountService.sendCouponToUser(initialValues.id_descuento, Number(idUsuarioDestino))
                      toast.success('Código enviado por correo')
                    } catch (err: any) {
                      toast.error(err?.response?.data?.detail || 'Error al enviar el código por correo')
                    } finally {
                      setSendingCoupon(false)
                    }
                  }}
                >
                  {sendingCoupon ? 'Enviando...' : 'Enviar código por correo a este usuario'}
                </Button>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="min-w-[140px]"
              onClick={() => {
                onOpenChange(false)
                form.reset()
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-[#fec806] hover:bg-[#e6b800] text-black min-w-[140px]"
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
