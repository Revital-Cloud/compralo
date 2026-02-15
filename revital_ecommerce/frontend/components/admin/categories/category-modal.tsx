'use client'

import React, { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui'
import { Button, Input, Label, Checkbox } from '@/components/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { attributeService, type Attribute } from '@/services/attribute.service'
import {
  getCategoryAttributes,
  updateCategoryAttributes,
  createCategory,
  updateCategory,
  type CategoryAttributeItem,
} from '@/services/category.service'
import type { Category } from '@/types/category'
import { Trash2 } from 'lucide-react'
import { generateSlug } from '@/utils/slug'

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  parent_id: z
    .union([z.number(), z.null(), z.string()])
    .optional()
    .transform((v) => (v == null || v === '' || v === 'none' ? null : Number(v))),
  ind_activo: z.boolean().optional().default(true),
})

type FormValues = z.output<typeof schema>

export interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  categories: Category[]
  editingCategory?: Category | null
  onSuccess: () => void
}

interface AttributeRow {
  attribute_id: number
  is_required: boolean
  is_filterable: boolean
}

const EMPTY_CATEGORY_ATTRS: CategoryAttributeItem[] = []
const EMPTY_ALL_ATTRS: Attribute[] = []

export function CategoryModal({
  open,
  onOpenChange,
  mode,
  categories,
  editingCategory,
  onSuccess,
}: CategoryModalProps) {
  const [attributeRows, setAttributeRows] = useState<AttributeRow[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { name: '', parent_id: null, ind_activo: true },
  })

  const categoryId = editingCategory ? Number(editingCategory.id) : null
  const { data: categoryAttributesData } = useQuery({
    queryKey: ['category-attributes', categoryId],
    queryFn: () => getCategoryAttributes(categoryId!),
    enabled: open && mode === 'edit' && !!categoryId,
  })
  const categoryAttributes = categoryAttributesData ?? EMPTY_CATEGORY_ATTRS

  const openedForCreateRef = useRef(false)

  const { data: allAttributesData } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => attributeService.getAll(),
    enabled: open,
  })
  const allAttributes = allAttributesData ?? EMPTY_ALL_ATTRS

  // Create: sync only when modal *just* opened (avoid loop from re-running every render).
  React.useEffect(() => {
    if (!open) {
      openedForCreateRef.current = false
      return
    }
    if (mode !== 'create') return
    if (openedForCreateRef.current) return
    openedForCreateRef.current = true
    form.reset({ name: '', parent_id: null, ind_activo: true })
    setAttributeRows([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode])

  // Edit: sync when modal opens or when category attributes finish loading.
  React.useEffect(() => {
    if (!open || mode !== 'edit' || !editingCategory) return
    const rawParent = editingCategory.parent_id
    const parent_id = rawParent != null ? Number(rawParent) : null
    form.reset({
      name: editingCategory.name,
      parent_id: Number.isNaN(parent_id) ? null : parent_id,
      ind_activo: editingCategory.ind_activo ?? true,
    })
    setAttributeRows(
      categoryAttributes.map((a) => ({
        attribute_id: a.attribute_id,
        is_required: a.is_required,
        is_filterable: a.is_filterable,
      }))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, editingCategory, categoryAttributes])

  const parentOptions = useMemo(() => {
    const list = categories as Category[]
    const byId = new Map(list.map((c) => [Number(c.id), c]))
    const depth = (id: number): number => {
      const p = byId.get(id)?.parent_id
      if (p == null || p === undefined) return 0
      return 1 + depth(Number(p))
    }
    const sorted = [...list].sort((a, b) => {
      const dA = depth(Number(a.id))
      const dB = depth(Number(b.id))
      if (dA !== dB) return dA - dB
      return String(a.name).localeCompare(String(b.name))
    })
    return sorted
  }, [categories])

  const addAttributeRow = () => {
    const firstUnused = allAttributes.find((a) => !attributeRows.some((r) => r.attribute_id === a.id))
    if (firstUnused) {
      setAttributeRows((prev) => [...prev, { attribute_id: firstUnused.id, is_required: false, is_filterable: false }])
    }
  }

  const removeAttributeRow = (index: number) => {
    setAttributeRows((prev) => prev.filter((_, i) => i !== index))
  }

  const updateAttributeRow = (index: number, field: keyof AttributeRow, value: number | boolean) => {
    setAttributeRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  const usedAttributeIds = attributeRows.map((r) => r.attribute_id)
  const duplicateAttr = attributeRows.length !== new Set(usedAttributeIds).size

  const doSubmit = async (values: FormValues) => {
    if (duplicateAttr) {
      toast.error('No puede haber atributos repetidos. Elimina duplicados en la lista.')
      return
    }
    const parent_id = values.parent_id != null && !Number.isNaN(Number(values.parent_id)) ? values.parent_id : null

    setIsSubmitting(true)
    try {
      if (mode === 'create') {
        const res = await createCategory({
          name: values.name,
          ind_activo: values.ind_activo,
          parent_id,
        })
        const id = (res as { id?: number }).id
        if (id != null) {
          await updateCategoryAttributes(id, attributeRows)
        }
      } else if (editingCategory) {
        const id = Number(editingCategory.id)
        if (Number.isNaN(id) || id <= 0) {
          toast.error('ID de categoría inválido. Cierra y vuelve a abrir el modal.')
          return
        }
        await updateCategory(id, {
          name: values.name,
          ind_activo: values.ind_activo,
          parent_id,
        })
        await updateCategoryAttributes(id, attributeRows)
      }
      onSuccess()
      onOpenChange(false)
    } catch (e: unknown) {
      console.error(e)
      const status = (e as { response?: { status?: number } })?.response?.status
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      const msg = typeof detail === 'string' ? detail : Array.isArray(detail) ? (detail as { msg?: string }[]).map((x) => x?.msg ?? x).join(', ') : (detail != null ? String(detail) : undefined) ?? (e as Error)?.message
      if (status === 401) {
        toast.error('Sesión expirada o no autorizado. Inicia sesión de nuevo.')
      } else {
        toast.error(msg || (mode === 'edit' ? 'Error al actualizar la categoría' : 'Error al crear la categoría'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = form.handleSubmit(doSubmit)

  const onGuardarClick = async () => {
    try {
      if (duplicateAttr) {
        toast.error('No puede haber atributos repetidos. Elimina duplicados en la lista.')
        return
      }
      const valid = await form.trigger()
      if (!valid) {
        const err = form.formState.errors.name?.message ?? (Object.values(form.formState.errors)[0] as { message?: string } | undefined)?.message
        toast.error(typeof err === 'string' ? err : 'Revisa los campos del formulario')
        return
      }
      await doSubmit(form.getValues())
    } catch (err) {
      console.error('onGuardarClick', err)
      toast.error(err instanceof Error ? err.message : 'Error al procesar')
    }
  }

  const slug = generateSlug(form.watch('name'))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nueva categoría' : 'Editar categoría'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(e)
          }}
          noValidate
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Ej. Electrónicos"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Categoría padre</Label>
            <Select
              value={form.watch('parent_id') != null ? String(form.watch('parent_id')) : 'none'}
              onValueChange={(v) => form.setValue('parent_id', v === 'none' ? null : Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ninguna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {parentOptions
                  .filter((c) => mode !== 'edit' || Number(c.id) !== categoryId)
                  .map((c) => {
                    const depth = (() => {
                      let d = 0
                      let cur: number | null = c.parent_id ?? null
                      while (cur != null) {
                        d++
                        const cat = parentOptions.find((x) => Number(x.id) === cur)
                        cur = cat?.parent_id ?? null
                      }
                      return d
                    })()
                    const indent = '\u00A0'.repeat(depth * 2) // non-breaking spaces
                    return (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {indent}{c.name}
                      </SelectItem>
                    )
                  })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Slug (referencia)</Label>
            <Input readOnly value={slug || '—'} className="bg-muted text-muted-foreground" />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="ind_activo"
              checked={form.watch('ind_activo')}
              onCheckedChange={(v) => form.setValue('ind_activo', Boolean(v))}
            />
            <Label htmlFor="ind_activo" className="font-normal">Activo</Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Atributos de la categoría</Label>
              <Button type="button" variant="outline" size="sm" onClick={addAttributeRow}>
                Agregar atributo
              </Button>
            </div>
            {attributeRows.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2">Atributo</th>
                      <th className="text-left p-2 w-24">Requerido</th>
                      <th className="text-left p-2 w-24">Filtrable</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {attributeRows.map((row, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="p-2">
                          <Select
                            value={String(row.attribute_id)}
                            onValueChange={(v) => updateAttributeRow(index, 'attribute_id', Number(v))}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {allAttributes.map((a) => (
                                <SelectItem key={a.id} value={String(a.id)}>
                                  {a.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Checkbox
                            checked={row.is_required}
                            onCheckedChange={(v) => updateAttributeRow(index, 'is_required', Boolean(v))}
                          />
                        </td>
                        <td className="p-2">
                          <Checkbox
                            checked={row.is_filterable}
                            onCheckedChange={(v) => updateAttributeRow(index, 'is_filterable', Boolean(v))}
                          />
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            onClick={() => removeAttributeRow(index)}
                            aria-label="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {duplicateAttr && (
              <p className="text-sm text-red-600">No puede haber atributos repetidos en la lista.</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              className="bg-[#fec806] hover:bg-[#e6b800] text-black"
              onClick={onGuardarClick}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
