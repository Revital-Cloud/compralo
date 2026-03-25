'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productFormCompositeSchema, type ProductFormCompositeFields } from '@/schemas/admin/product.schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Input, Label, Button, Textarea, Checkbox } from '@/components/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { useAllCategories } from '@/hooks/use-categories'
import { useAllProviders } from '@/hooks/use-providers'
import { useBrands } from '@/hooks/use-products'
import { getCategoryAttributesWithValues } from '@/services/category.service'
import { useQuery } from '@tanstack/react-query'
import type { ProductCreateComposite, VariantCreateItem } from '@/types/product'
import type { CategoryAttributeWithValuesResponse } from '@/services/category.service'
import { AttributeValueSelect } from './attribute-value-select'
import type { ProductAdminDetailComposite } from '@/services/product.service'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { VariantImageUpload } from './variant-image-upload'
import type { Category } from '@/types/category'
import { formatNumberWithDots, parseFormattedNumber } from '@/utils/format-price'

function isCategoryActive(c: Category): boolean {
  return (c.ind_activo ?? c.is_active) !== false
}

function idNum(c: Category & { id_categoria?: number }): number {
  const raw = c.id ?? (c as { id_categoria?: number }).id_categoria
  return typeof raw === 'number' ? raw : Number(raw)
}

function parentIdNum(c: Category): number | null {
  if (c.parent_id == null) return null
  return typeof c.parent_id === 'number' ? c.parent_id : Number(c.parent_id)
}

const defaultVariant = (): VariantCreateItem => ({
  price: 0,
  stock: 0,
  is_active: true,
  tipo_clasificacion: null,
  attributes: {},
  image_urls: [],
  main_index: 0,
})

export interface ProductFormCompositeProps {
  initialData?: ProductAdminDetailComposite | null
  onSubmit: (payload: ProductCreateComposite) => void
  isLoading?: boolean
  formId?: string
  submitLabel?: string
  /** Para mostrar en el panel derecho el carrusel de imágenes por variante */
  onVariantsChange?: (variants: VariantCreateItem[]) => void
}

export function ProductFormComposite({
  initialData,
  onSubmit,
  isLoading,
  formId = 'product-form-composite',
  submitLabel = 'Crear producto',
  onVariantsChange,
}: ProductFormCompositeProps) {
  const isEdit = !!initialData
  const [variants, setVariants] = useState<VariantCreateItem[]>([defaultVariant()])
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null)
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null)
  const [selectedSublineId, setSelectedSublineId] = useState<number | null>(null)

  useEffect(() => {
    onVariantsChange?.(variants)
  }, [variants, onVariantsChange])
  const { data: categories = [] } = useAllCategories()
  const { data: brands = [] } = useBrands()
  const { data: providers = [] } = useAllProviders()

  const list = Array.isArray(categories) ? (categories as Category[]) : []
  const rootOptions = useMemo(
    () => list.filter((c) => parentIdNum(c) == null && isCategoryActive(c)),
    [list]
  )
  const lineOptions = useMemo(
    () =>
      selectedParentId == null
        ? []
        : list.filter((c) => parentIdNum(c) === selectedParentId && isCategoryActive(c)),
    [list, selectedParentId]
  )
  const sublineOptions = useMemo(
    () =>
      selectedLineId == null
        ? []
        : list.filter((c) => parentIdNum(c) === selectedLineId && isCategoryActive(c)),
    [list, selectedLineId]
  )
  const lineHasChildren = sublineOptions.length > 0

  const form = useForm<ProductFormCompositeFields>({
    resolver: zodResolver(productFormCompositeSchema) as Resolver<ProductFormCompositeFields>,
    defaultValues: {
      name: '',
      category_id: 0,
      id_marca: undefined,
      id_proveedor: undefined,
      description: '',
      is_active: true,
    },
  })

  useEffect(() => {
    if (initialData) {
      const product = initialData.product as { category_id?: number | string; id_marca?: number | string | null; id_proveedor?: number | string | null; name?: string; description?: string | null; is_active?: boolean }
      const catId = product.category_id
      const marcaId = product.id_marca
      const proveedorId = product.id_proveedor
      const categoryIdNum = catId != null && catId !== '' && !Number.isNaN(Number(catId)) ? Number(catId) : 0
      const marcaIdNum = marcaId != null && marcaId !== '' && !Number.isNaN(Number(marcaId)) ? Number(marcaId) : undefined
      const proveedorIdNum = proveedorId != null && proveedorId !== '' && !Number.isNaN(Number(proveedorId)) ? Number(proveedorId) : undefined
      form.reset({
        name: initialData.product.name,
        category_id: categoryIdNum,
        id_marca: marcaIdNum,
        id_proveedor: proveedorIdNum,
        description: initialData.product.description ?? '',
        is_active: initialData.product.is_active ?? true,
      })
      const imagesByVariant = initialData.images_by_variant ?? {}
      const seenComboIds = new Set<number>()
      const uniqueFromApi = initialData.variants.filter((v) => {
        const id = (v as { id?: number }).id
        if (id == null || Number.isNaN(Number(id))) return true
        const n = Number(id)
        if (seenComboIds.has(n)) return false
        seenComboIds.add(n)
        return true
      })
      setVariants(
        uniqueFromApi.length > 0
          ? uniqueFromApi.map((v) => {
              const vid = (v as { id?: number }).id != null ? String((v as { id?: number }).id) : undefined
              const imgs = vid ? imagesByVariant[vid] : []
              const sorted = [...(imgs || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              const normalizeUrl = (u: string) => u.split('?')[0].split('#')[0].trim()
              const seenUrls = new Set<string>()
              const image_urls: string[] = []
              let firstMainIndex = -1
              sorted.forEach((x) => {
                const url = (x.image_url ?? '').trim()
                if (!url) return
                const key = normalizeUrl(url)
                if (seenUrls.has(key)) return
                seenUrls.add(key)
                const idx = image_urls.length
                image_urls.push(url)
                if (firstMainIndex < 0 && x.is_main) firstMainIndex = idx
              })
              const main_index = Math.min(
                firstMainIndex >= 0 ? firstMainIndex : 0,
                Math.max(0, image_urls.length - 1)
              )
              const rawAttrs = v.attributes ?? {}
              const attributes: Record<string, string | number | boolean> = {}
              Object.entries(rawAttrs).forEach(([k, val]) => {
                const key = String(k).trim()
                if (!key) return
                const single = Array.isArray(val) ? val[0] : val
                if (single === undefined || single === null) return
                attributes[key] = single as string | number | boolean
              })
              // tipo_clasificacion: columna API o solo clave "Tipo/Clasificación" en attributes (no "dominant"/primer atributo)
              let tipoClasificacion = v.tipo_clasificacion ?? null
              if (!tipoClasificacion || !String(tipoClasificacion).trim()) {
                const fromAttr = (rawAttrs as Record<string, unknown>)['Tipo/Clasificación']
                if (fromAttr != null && String(fromAttr).trim()) {
                  tipoClasificacion = String(fromAttr).trim()
                }
              }
              return {
                price: Number(v.price),
                stock: Number(v.stock),
                is_active: v.is_active ?? true,
                tipo_clasificacion: tipoClasificacion,
                attributes,
                image_urls,
                main_index,
              }
            })
          : [defaultVariant()]
      )
    }
  }, [initialData, form])

  const categoryIdFromForm = form.watch('category_id')

  // Pre-llenar cascada (categoría → línea → sublínea) en edición: cuando haya categoría (API o formulario) y categorías cargadas
  useEffect(() => {
    if (list.length === 0) return
    const product = initialData?.product as { category_id?: number | string } | undefined
    const fromProduct = product?.category_id != null && product.category_id !== '' && !Number.isNaN(Number(product.category_id))
      ? Number(product.category_id)
      : 0
    const fromForm = typeof categoryIdFromForm === 'number' && !Number.isNaN(categoryIdFromForm) ? categoryIdFromForm : 0
    const leafId = fromProduct > 0 ? fromProduct : fromForm > 0 ? fromForm : null
    if (leafId == null || leafId <= 0) return
    const byId = new Map<number, Category>()
    list.forEach((c) => {
      const n = idNum(c)
      if (!Number.isNaN(n)) byId.set(n, c)
      const alt = (c as { id_categoria?: number }).id_categoria
      if (alt != null && !Number.isNaN(Number(alt))) byId.set(Number(alt), c)
    })
    const cat = byId.get(leafId)
    if (!cat) return
    const path: number[] = [leafId]
    let current: Category | undefined = cat
    while (current && parentIdNum(current) != null) {
      const pid = parentIdNum(current)!
      path.push(pid)
      current = byId.get(pid)
    }
    const rootId = path[path.length - 1]
    const lineId = path.length >= 2 ? path[path.length - 2] : null
    const sublineId = path.length >= 3 ? path[0] : null
    setSelectedParentId(rootId)
    setSelectedLineId(lineId ?? null)
    setSelectedSublineId(sublineId ?? null)
  }, [initialData?.product, list, categoryIdFromForm])

  // Sync form.category_id with leaf selection (categoría/línea/sublínea)
  // lineOptions deriva de selectedParentId, no hace falta en deps; mismo render ya está actualizado
  useEffect(() => {
    if (selectedSublineId != null) {
      form.setValue('category_id', selectedSublineId)
    } else if (selectedLineId != null && !lineHasChildren) {
      form.setValue('category_id', selectedLineId)
    } else if (selectedParentId != null && selectedLineId == null) {
      form.setValue('category_id', lineOptions.length === 0 ? selectedParentId : 0)
    } else if (selectedLineId != null && lineHasChildren) {
      form.setValue('category_id', 0)
    }
  }, [selectedParentId, selectedLineId, selectedSublineId, lineHasChildren, form])

  const categoryId = form.watch('category_id')
  const { data: categoryAttributes = [] } = useQuery({
    queryKey: ['category-attributes-with-values', categoryId],
    queryFn: () => getCategoryAttributesWithValues(categoryId),
    enabled: !!categoryId && categoryId > 0,
  })

  // Sync dominant -> color attribute_id so state matches payload (same as iPhone)
  useEffect(() => {
    if (!initialData || !(categoryAttributes as CategoryAttributeWithValuesResponse[]).length) return
    const colorAttr = (categoryAttributes as CategoryAttributeWithValuesResponse[]).find(
      (a) => (a.attribute_name ?? '').toLowerCase() === 'color'
    )
    if (!colorAttr) return
    const cid = String(colorAttr.attribute_id)
    setVariants((prev) =>
      prev.map((v) => {
        const attrs = { ...(v.attributes || {}) }
        if (attrs['dominant'] != null && attrs[cid] == null) {
          const displayVal = String(attrs['dominant']).trim()
          const found = (colorAttr.values ?? []).find(
            (av) => (av.value ?? '').trim().toLowerCase() === displayVal.toLowerCase()
          )
          if (found?.id != null) attrs[cid] = found.id
        }
        return { ...v, attributes: attrs }
      })
    )
  }, [initialData?.product?.name, categoryAttributes])

  const addVariant = useCallback(() => {
    setVariants((prev) => [...prev, defaultVariant()])
  }, [])

  const removeVariant = useCallback((index: number) => {
    setVariants((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }, [])

  const updateVariant = useCallback((index: number, field: keyof VariantCreateItem, value: unknown) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    )
  }, [])

  const updateVariantAttribute = useCallback((variantIndex: number, attributeId: number | string, value: string | number | boolean) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== variantIndex) return v
        const attrs = { ...(v.attributes || {}) }
        attrs[String(attributeId)] = value
        return { ...v, attributes: attrs }
      })
    )
  }, [])

  const setVariantImageUrls = useCallback((variantIndex: number, image_urls: string[]) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === variantIndex ? { ...v, image_urls } : v))
    )
  }, [])
  const setVariantMainIndex = useCallback((variantIndex: number, main_index: number) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === variantIndex ? { ...v, main_index } : v))
    )
  }, [])
  const addVariantImageUrl = useCallback((variantIndex: number, url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex ? { ...v, image_urls: [...(v.image_urls || []), trimmed] } : v
      )
    )
  }, [])
  const removeVariantImageUrl = useCallback((variantIndex: number, urlIndex: number) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== variantIndex) return v
        const list = v.image_urls || []
        const next = list.filter((_, idx) => idx !== urlIndex)
        const oldMain = v.main_index ?? 0
        const main_index = oldMain >= next.length ? Math.max(0, next.length - 1) : oldMain
        return { ...v, image_urls: next, main_index }
      })
    )
  }, [])

  const handleSubmit = form.handleSubmit((productFields) => {
    if (variants.length === 0) return
    const catAttrs = (categoryAttributes ?? []) as CategoryAttributeWithValuesResponse[]
    const colorAttr = catAttrs.find((a) => (a.attribute_name ?? '').toLowerCase() === 'color')
    const normalizedVariants = variants.map((v) => {
      const attrs = { ...(v.attributes || {}) }
      if (colorAttr && attrs['dominant'] != null && attrs[String(colorAttr.attribute_id)] == null) {
        const displayVal = String(attrs['dominant']).trim()
        const found = (colorAttr.values ?? []).find(
          (av) => (av.value ?? '').trim().toLowerCase() === displayVal.toLowerCase()
        )
        if (found?.id != null) attrs[String(colorAttr.attribute_id)] = found.id
      }
      return {
        price: Number(v.price),
        stock: Number(v.stock) >= 0 ? Number(v.stock) : 0,
        is_active: v.is_active ?? true,
        tipo_clasificacion: v.tipo_clasificacion && v.tipo_clasificacion.trim() ? v.tipo_clasificacion.trim() : null,
        attributes: Object.keys(attrs).length > 0 ? attrs : undefined,
        image_urls: v.image_urls?.length ? [...v.image_urls] : undefined,
        main_index: v.main_index ?? 0,
      }
    })
    const payload: ProductCreateComposite = {
      product: {
        name: productFields.name,
        category_id: productFields.category_id,
        id_marca: productFields.id_marca ?? undefined,
        id_proveedor: productFields.id_proveedor ?? undefined,
        description: productFields.description || undefined,
        is_active: productFields.is_active ?? true,
      },
      variants: normalizedVariants,
      image_urls: isEdit && initialData?.image_urls?.length ? [...initialData.image_urls] : [],
    }
    onSubmit(payload)
  })

  const brandOptions = Array.isArray(brands) ? brands : []

  const onParentChange = (value: string) => {
    const id = value ? Number(value) : null
    setSelectedParentId(id)
    setSelectedLineId(null)
    setSelectedSublineId(null)
    form.setValue('category_id', 0)
  }

  const onLineChange = (value: string) => {
    const id = value ? Number(value) : null
    if (id === selectedLineId) return
    setSelectedLineId(id)
    setSelectedSublineId(null)
    const hasChildren = id != null && list.some((c) => parentIdNum(c) === id && isCategoryActive(c))
    form.setValue('category_id', hasChildren ? 0 : id ?? 0)
  }

  const onSublineChange = (value: string) => {
    const id = value ? Number(value) : null
    if (id === selectedSublineId) return
    setSelectedSublineId(id)
    form.setValue('category_id', id ?? 0)
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos del producto</CardTitle>
          <p className="text-sm text-muted-foreground">Nombre, categoría, marca y descripción.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" {...form.register('name')} placeholder="Nombre del producto" />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select
                value={selectedParentId != null ? String(selectedParentId) : ''}
                onValueChange={onParentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione categoría" />
                </SelectTrigger>
                <SelectContent>
                  {rootOptions.map((c) => (
                    <SelectItem key={idNum(c)} value={String(idNum(c))}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Línea *</Label>
              <Select
                value={selectedLineId != null ? String(selectedLineId) : ''}
                onValueChange={onLineChange}
                disabled={selectedParentId == null}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione línea" />
                </SelectTrigger>
                <SelectContent>
                  {lineOptions.map((c) => (
                    <SelectItem key={idNum(c)} value={String(idNum(c))}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {lineHasChildren ? (
              <div className="space-y-2">
                <Label>Sublínea *</Label>
                <Select
                  value={selectedSublineId != null ? String(selectedSublineId) : ''}
                  onValueChange={onSublineChange}
                  disabled={selectedLineId == null}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione sublínea" />
                  </SelectTrigger>
                  <SelectContent>
                    {sublineOptions.map((c) => (
                      <SelectItem key={idNum(c)} value={String(idNum(c))}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          {form.formState.errors.category_id && (
            <p className="text-sm text-red-600">{form.formState.errors.category_id.message}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marca</Label>
              <Select
                key={`marca-${form.watch('id_marca') ?? 'none'}-${brandOptions.length}`}
                value={form.watch('id_marca') != null ? String(form.watch('id_marca')) : ''}
                onValueChange={(v) => form.setValue('id_marca', v ? Number(v) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione marca (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {brandOptions.map((b: { id_marca: number; nom_marca: string }) => (
                    <SelectItem key={b.id_marca} value={String(b.id_marca)}>{b.nom_marca}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Select
                key={`proveedor-${form.watch('id_proveedor') ?? 'none'}-${(providers as { id_proveedor: number }[]).length}`}
                value={form.watch('id_proveedor') != null ? String(form.watch('id_proveedor')) : ''}
                onValueChange={(v) => form.setValue('id_proveedor', v ? Number(v) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione proveedor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {(providers as { id_proveedor: number; nom_proveedor: string }[]).map((p) => (
                    <SelectItem key={p.id_proveedor} value={String(p.id_proveedor)}>{p.nom_proveedor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" {...form.register('description')} rows={3} className="resize-none" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_active"
              checked={form.watch('is_active')}
              onCheckedChange={(v) => form.setValue('is_active', Boolean(v))}
            />
            <Label htmlFor="is_active" className="font-normal">Producto activo</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Variantes del producto</CardTitle>
            <p className="text-sm text-muted-foreground">Precio, stock y atributos por variante. Al menos una.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <IconPlus className="w-4 h-4 mr-1" />
            Agregar variante
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {variants.map((variant, index) => {
            const attrValue = variant.attributes && Object.values(variant.attributes).find((v) => v != null && String(v).trim())
            // Si el atributo dominante es "Color", el valor puede venir como ID (number/string).
            // Resolvemos ese ID contra categoryAttributes para mostrar siempre el nombre del color.
            const colorAttr = (categoryAttributes ?? []).find((a) => (a.attribute_name ?? '').toLowerCase() === 'color')
            const colorAttrId = colorAttr?.attribute_id != null ? String(colorAttr.attribute_id) : null
            const rawColorId =
              (colorAttrId ? variant.attributes?.[colorAttrId] : undefined) ??
              (variant.attributes?.dominant != null ? variant.attributes?.dominant : undefined)
            const resolvedColorName =
              colorAttr?.values?.find((av) => String(av.id) === String(rawColorId))?.value ?? undefined

            const variantLabel =
              (variant.tipo_clasificacion && String(variant.tipo_clasificacion).trim()) ||
              (resolvedColorName ? String(resolvedColorName).trim() : attrValue != null ? String(attrValue).trim() : undefined) ||
              `Variante ${index + 1}`
            return (
            <div key={index} className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{variantLabel}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-600"
                  onClick={() => removeVariant(index)}
                  disabled={variants.length <= 1}
                  aria-label="Eliminar variante"
                >
                  <IconTrash className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>Precio *</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={variant.price != null && variant.price > 0 ? formatNumberWithDots(variant.price) : ''}
                    onChange={(e) => {
                      const rawValue = e.target.value.trim()
                      // Permitir borrar completamente
                      if (rawValue === '') {
                        updateVariant(index, 'price', 0)
                        return
                      }
                      // Remover todo excepto números (incluyendo puntos que el usuario pueda haber escrito)
                      const numbersOnly = rawValue.replace(/[^\d]/g, '')
                      if (numbersOnly === '') {
                        updateVariant(index, 'price', 0)
                        return
                      }
                      // Parsear y actualizar (el formato se aplicará automáticamente en el value)
                      const parsed = parseInt(numbersOnly, 10)
                      if (!isNaN(parsed)) {
                        updateVariant(index, 'price', parsed)
                      }
                    }}
                    onBlur={(e) => {
                      // Asegurar formato al perder el foco
                      const currentPrice = variant.price ?? 0
                      if (currentPrice > 0) {
                        const formatted = formatNumberWithDots(currentPrice)
                        // Solo actualizar si el valor mostrado no coincide con el formateado
                        if (e.target.value !== formatted) {
                          updateVariant(index, 'price', currentPrice)
                        }
                      }
                    }}
                    placeholder="0"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Stock *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={variant.stock ?? 0}
                    onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Tipo/Clasificación</Label>
                  <Input
                    type="text"
                    value={variant.tipo_clasificacion ?? ''}
                    onChange={(e) => updateVariant(index, 'tipo_clasificacion', e.target.value || null)}
                    placeholder="Ej: Estándar, Premium, Básico"
                    maxLength={100}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox
                    checked={variant.is_active ?? true}
                    onCheckedChange={(v) => updateVariant(index, 'is_active', Boolean(v))}
                  />
                  <Label className="font-normal">Activa</Label>
                </div>
              </div>
              {categoryAttributes.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Atributos de la categoría</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {(categoryAttributes as CategoryAttributeWithValuesResponse[]).map((attr) =>
                      attr.has_predefined_values && attr.values && attr.values.length > 0 ? (
                        <AttributeValueSelect
                          key={attr.attribute_id}
                          name={attr.attribute_name ?? `Atributo ${attr.attribute_id}`}
                          values={attr.values}
                          value={(() => {
                            const isColorAttr = attr.attribute_name?.toLowerCase() === 'color' || String(attr.attribute_id) === 'dominant'
                            const attrKey = String(attr.attribute_id)
                            const nameKey = (attr.attribute_name ?? '').trim()
                            let raw =
                              variant.attributes?.[attrKey] ??
                              (nameKey ? variant.attributes?.[nameKey] : undefined) ??
                              (isColorAttr ? variant.attributes?.['dominant'] : undefined)
                            if (raw === undefined || raw === null) return undefined
                            if (Array.isArray(raw)) raw = raw[0]
                            if (raw === undefined || raw === null) return undefined
                            const n = Number(raw)
                            if (!Number.isNaN(n) && n > 0) return n
                            const str = String(raw).trim().split(',')[0].trim()
                            if (!str) return undefined
                            const byValue = (attr.values ?? []).find(
                              (av) => (av.value ?? '').trim().toLowerCase() === str.toLowerCase()
                            )
                            return byValue?.id != null ? Number(byValue.id) : undefined
                          })()}
                          onChange={(attributeValueId) => {
                            updateVariantAttribute(index, attr.attribute_id, attributeValueId)
                            if (attr.attribute_name?.toLowerCase() === 'color' || String(attr.attribute_id) === 'dominant') {
                              updateVariantAttribute(index, 'dominant', attributeValueId)
                            }
                          }}
                          required={attr.is_required}
                        />
                      ) : (
                        <AttributeInput
                          key={attr.attribute_id}
                          attribute={attr}
                          value={
                            variant.attributes?.[String(attr.attribute_id)] ??
                            (attr.attribute_name ? variant.attributes?.[(attr.attribute_name ?? '').trim()] : undefined)
                          }
                          onChange={(value) => updateVariantAttribute(index, attr.attribute_id, value)}
                        />
                      )
                    )}
                  </div>
                </div>
              )}
              <div className="pt-2 border-t">
                <Label className="text-sm font-medium">Imágenes de la variante</Label>
                <p className="text-xs text-muted-foreground mb-2">Sube imágenes; se mostrarán en el panel de la derecha.</p>
                <VariantImageUpload
                  variantIndex={index}
                  imageUrls={variant.image_urls ?? []}
                  mainIndex={variant.main_index ?? 0}
                  onUrlsChange={(urls) => setVariantImageUrls(index, urls)}
                  onMainIndexChange={(i) => setVariantMainIndex(index, i)}
                  onRemoveUrl={(urlIdx) => removeVariantImageUrl(index, urlIdx)}
                />
              </div>
            </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-[#fec806] hover:bg-[#e6b800] text-black"
          data-tour-id="product-submit-button"
        >
          {isLoading ? 'Guardando...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

function AttributeInput({
  attribute,
  value,
  onChange,
}: {
  attribute: CategoryAttributeWithValuesResponse
  value: string | number | boolean | undefined
  onChange: (v: string | number | boolean) => void
}) {
  const name = attribute.attribute_name || `Atributo ${attribute.attribute_id}`
  const required = attribute.is_required
  const dtype = (attribute.data_type || 'text').toLowerCase()

  if (dtype === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          checked={value === true || value === 'true' || value === '1'}
          onCheckedChange={(v) => onChange(Boolean(v))}
        />
        <Label className={cn('font-normal', required && 'text-foreground')}>
          {name}
          {required && ' *'}
        </Label>
      </div>
    )
  }
  if (dtype === 'number') {
    return (
      <div className="space-y-1">
        <Label>
          {name}
          {required && ' *'}
        </Label>
        <Input
          type="number"
          value={value !== undefined && value !== '' ? String(value) : ''}
          onChange={(e) => {
            const v = e.target.value
            onChange(v === '' ? 0 : Number(v))
          }}
          placeholder={required ? 'Requerido' : 'Opcional'}
        />
      </div>
    )
  }
  return (
    <div className="space-y-1">
      <Label>
        {name}
        {required && ' *'}
      </Label>
      <Input
        value={value !== undefined ? String(value) : ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={required ? 'Requerido' : 'Opcional'}
      />
    </div>
  )
}
