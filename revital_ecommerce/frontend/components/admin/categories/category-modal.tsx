'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui'
import { Button, Input, Label, Checkbox } from '@/components/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { categoryModalSchema, type CategoryModalFormValues } from '@/schemas/admin/category.schema'
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

function categoryIdNum(c: Category): number {
  return typeof c.id === 'number' ? c.id : Number(c.id)
}

function parentIdNum(c: Category): number | null {
  if (c.parent_id == null) return null
  return typeof c.parent_id === 'number' ? c.parent_id : Number(c.parent_id)
}

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

  const [selectedLevel1Id, setSelectedLevel1Id] = useState<number | null>(null)
  const [selectedLevel2Id, setSelectedLevel2Id] = useState<number | null>(null)
  const [selectedLevel3Id, setSelectedLevel3Id] = useState<number | null>(null)

  const form = useForm<CategoryModalFormValues>({
    resolver: zodResolver(categoryModalSchema) as Resolver<CategoryModalFormValues>,
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

  const list = useMemo(() => (Array.isArray(categories) ? categories : []) as Category[], [categories])

  const excludedParentIds = useMemo(() => {
    if (mode !== 'edit' || !editingCategory) return new Set<number>()
    const id = categoryIdNum(editingCategory)
    const excluded = new Set<number>([id])
    const collectDescendants = (parentId: number) => {
      list.forEach((c) => {
        if (parentIdNum(c) === parentId) {
          const cid = categoryIdNum(c)
          if (!excluded.has(cid)) {
            excluded.add(cid)
            collectDescendants(cid)
          }
        }
      })
    }
    collectDescendants(id)
    return excluded
  }, [mode, editingCategory, list])

  const findCategoryPath = (categoryId: number | null | undefined): number[] => {
    if (categoryId == null) return []
    const id = Number(categoryId)
    if (Number.isNaN(id)) return []
    const path: number[] = []
    let current = list.find((c) => categoryIdNum(c) === id)
    while (current) {
      path.unshift(categoryIdNum(current))
      const pid = parentIdNum(current)
      if (pid == null) break
      current = list.find((c) => categoryIdNum(c) === pid)
    }
    return path
  }

  const level1Options = useMemo(
    () =>
      list.filter(
        (c) => parentIdNum(c) == null && !excludedParentIds.has(categoryIdNum(c))
      ),
    [list, excludedParentIds]
  )
  const level2Options = useMemo(
    () =>
      selectedLevel1Id == null
        ? []
        : list.filter(
            (c) =>
              parentIdNum(c) === selectedLevel1Id &&
              !excludedParentIds.has(categoryIdNum(c))
          ),
    [list, selectedLevel1Id, excludedParentIds]
  )
  const level3Options = useMemo(
    () =>
      selectedLevel2Id == null
        ? []
        : list.filter(
            (c) =>
              parentIdNum(c) === selectedLevel2Id &&
              !excludedParentIds.has(categoryIdNum(c))
          ),
    [list, selectedLevel2Id, excludedParentIds]
  )

  useEffect(() => {
    const parentId = selectedLevel3Id ?? selectedLevel2Id ?? selectedLevel1Id ?? null
    form.setValue('parent_id', parentId)
  }, [selectedLevel1Id, selectedLevel2Id, selectedLevel3Id, form])

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
    setSelectedLevel1Id(null)
    setSelectedLevel2Id(null)
    setSelectedLevel3Id(null)
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
    const path = findCategoryPath(parent_id ?? undefined)
    setSelectedLevel1Id(path[0] ?? null)
    setSelectedLevel2Id(path[1] ?? null)
    setSelectedLevel3Id(path[2] ?? null)
    setAttributeRows(
      categoryAttributes.map((a) => ({
        attribute_id: a.attribute_id,
        is_required: a.is_required,
        is_filterable: a.is_filterable,
      }))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, editingCategory, categoryAttributes, list])

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

  const attributesSectionLabel =
    selectedLevel2Id != null
      ? 'Atributos sub-subcategoría'
      : selectedLevel1Id != null
        ? 'Atributos subcategoría'
        : 'Atributos categoría'

  const doSubmit = async (values: CategoryModalFormValues) => {
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
          is_active: values.ind_activo ?? true,
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
          is_active: values.ind_activo,
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

          <div className="space-y-4">
            <Label>Categoría padre</Label>
            <p className="text-xs text-muted-foreground">
              Selecciona por niveles: principal (categoría), luego subcategoría y opcionalmente sub-subcategoría.
            </p>
            <p className="text-xs text-muted-foreground">
              Categoría principal = nivel superior; los productos se asignan a categorías de último nivel (sublínea).
            </p>
            <div className="space-y-2">
              <Label htmlFor="parent-level1" className="text-muted-foreground font-normal">Nivel 1 (Principal)</Label>
              <Select
                value={selectedLevel1Id != null ? String(selectedLevel1Id) : 'none'}
                onValueChange={(v) => {
                  const id = v === 'none' ? null : Number(v)
                  setSelectedLevel1Id(id)
                  setSelectedLevel2Id(null)
                  setSelectedLevel3Id(null)
                }}
              >
                <SelectTrigger id="parent-level1">
                  <SelectValue placeholder="Ninguna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {level1Options.map((c) => (
                    <SelectItem key={c.id} value={String(categoryIdNum(c))}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedLevel1Id != null && level2Options.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="parent-level2" className="text-muted-foreground font-normal">Nivel 2 (Subcategoría)</Label>
                <Select
                  value={selectedLevel2Id != null ? String(selectedLevel2Id) : 'none'}
                  onValueChange={(v) => {
                    const id = v === 'none' ? null : Number(v)
                    setSelectedLevel2Id(id)
                    setSelectedLevel3Id(null)
                  }}
                >
                  <SelectTrigger id="parent-level2">
                    <SelectValue placeholder="Ninguna (usar nivel 1 como padre)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna (usar nivel 1 como padre)</SelectItem>
                    {level2Options.map((c) => (
                      <SelectItem key={c.id} value={String(categoryIdNum(c))}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedLevel2Id != null && level3Options.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="parent-level3" className="text-muted-foreground font-normal">Nivel 3 (Sub-subcategoría)</Label>
                <Select
                  value={selectedLevel3Id != null ? String(selectedLevel3Id) : 'none'}
                  onValueChange={(v) => {
                    const id = v === 'none' ? null : Number(v)
                    setSelectedLevel3Id(id)
                  }}
                >
                  <SelectTrigger id="parent-level3">
                    <SelectValue placeholder="Ninguna (usar nivel 2 como padre)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna (usar nivel 2 como padre)</SelectItem>
                    {level3Options.map((c) => (
                      <SelectItem key={c.id} value={String(categoryIdNum(c))}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
              <Label>{attributesSectionLabel}</Label>
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
