'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Input, Label, Button, Textarea, Checkbox } from '@/components/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { useAllCategories } from '@/hooks/use-categories'
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

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  category_id: z.coerce.number().positive('Seleccione una categoría'),
  id_marca: z.union([z.coerce.number(), z.null()]).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional().default(true),
})

type ProductFields = z.output<typeof schema>

const defaultVariant = (): VariantCreateItem => ({
  price: 0,
  stock: 0,
  is_active: true,
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

  useEffect(() => {
    onVariantsChange?.(variants)
  }, [variants, onVariantsChange])
  const { data: categories = [] } = useAllCategories()
  const { data: brands = [] } = useBrands()

  const form = useForm<ProductFields>({
    resolver: zodResolver(schema) as Resolver<ProductFields>,
    defaultValues: {
      name: '',
      category_id: 0,
      id_marca: undefined,
      description: '',
      is_active: true,
    },
  })

  useEffect(() => {
    if (initialData) {
      const product = initialData.product as { category_id?: number | string; id_marca?: number | string | null; name?: string; description?: string | null; is_active?: boolean }
      const catId = product.category_id
      const marcaId = product.id_marca
      const categoryIdNum = catId != null && catId !== '' && !Number.isNaN(Number(catId)) ? Number(catId) : 0
      const marcaIdNum = marcaId != null && marcaId !== '' && !Number.isNaN(Number(marcaId)) ? Number(marcaId) : undefined
      form.reset({
        name: initialData.product.name,
        category_id: categoryIdNum,
        id_marca: marcaIdNum,
        description: initialData.product.description ?? '',
        is_active: initialData.product.is_active ?? true,
      })
      const imagesByVariant = initialData.images_by_variant ?? {}
      setVariants(
        initialData.variants.length > 0
          ? initialData.variants.map((v) => {
              const vid = (v as { id?: number }).id != null ? String((v as { id?: number }).id) : undefined
              const imgs = vid ? imagesByVariant[vid] : []
              const sorted = [...(imgs || [])].sort((a, b) => a.sort_order - b.sort_order)
              const image_urls = sorted.map((x) => x.image_url)
              const mainIdx = sorted.findIndex((x) => x.is_main)
              const rawAttrs = v.attributes ?? {}
              const attributes: Record<string, string | number | boolean> = {}
              Object.entries(rawAttrs).forEach(([k, val]) => {
                attributes[String(k)] = val as string | number | boolean
              })
              return {
                price: Number(v.price),
                stock: Number(v.stock),
                is_active: v.is_active ?? true,
                attributes,
                image_urls,
                main_index: mainIdx >= 0 ? mainIdx : 0,
              }
            })
          : [defaultVariant()]
      )
    }
  }, [initialData, form])

  const categoryId = form.watch('category_id')
  const { data: categoryAttributes = [] } = useQuery({
    queryKey: ['category-attributes-with-values', categoryId],
    queryFn: () => getCategoryAttributesWithValues(categoryId),
    enabled: !!categoryId && categoryId > 0,
  })

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

  const updateVariantAttribute = useCallback((variantIndex: number, attributeId: number, value: string | number | boolean) => {
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
    const payload: ProductCreateComposite = {
      product: {
        name: productFields.name,
        category_id: productFields.category_id,
        id_marca: productFields.id_marca ?? undefined,
        description: productFields.description || undefined,
        is_active: productFields.is_active ?? true,
      },
      variants: variants.map((v) => ({
        price: Number(v.price),
        stock: Number(v.stock) >= 0 ? Number(v.stock) : 0,
        is_active: v.is_active ?? true,
        attributes: v.attributes && Object.keys(v.attributes).length > 0 ? v.attributes : undefined,
        image_urls: v.image_urls?.length ? [...v.image_urls] : undefined,
        main_index: v.main_index ?? 0,
      })),
      image_urls: isEdit && initialData?.image_urls?.length ? [...initialData.image_urls] : [],
    }
    onSubmit(payload)
  })

  const brandOptions = Array.isArray(brands) ? brands : []
  const categoryOptions = Array.isArray(categories) ? categories : []

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
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select
                key={`category-${form.watch('category_id')}-${categoryOptions.length}`}
                value={form.watch('category_id') && Number(form.watch('category_id')) > 0 ? String(form.watch('category_id')) : ''}
                onValueChange={(v) => form.setValue('category_id', v ? Number(v) : 0)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category_id && (
                <p className="text-sm text-red-600">{form.formState.errors.category_id.message}</p>
              )}
            </div>
          </div>
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
          {variants.map((variant, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Variante {index + 1}</span>
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
                    type="number"
                    min={0}
                    step="0.01"
                    value={variant.price ?? 0}
                    onChange={(e) => updateVariant(index, 'price', e.target.value)}
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
                            const raw = variant.attributes?.[String(attr.attribute_id)]
                            if (raw === undefined || raw === null) return undefined
                            const n = Number(raw)
                            return Number.isNaN(n) ? undefined : n
                          })()}
                          onChange={(attributeValueId) =>
                            updateVariantAttribute(index, attr.attribute_id, attributeValueId)
                          }
                          required={attr.is_required}
                        />
                      ) : (
                        <AttributeInput
                          key={attr.attribute_id}
                          attribute={attr}
                          value={variant.attributes?.[String(attr.attribute_id)]}
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
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} className="bg-[#fec806] hover:bg-[#e6b800] text-black">
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
