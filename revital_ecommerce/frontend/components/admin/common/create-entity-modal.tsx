'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"
import { Button } from "@/components/ui"
import { Input } from "@/components/ui"
import { Label } from "@/components/ui"
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAllCategories } from '@/hooks/use-categories'
import { useLinesByCategory } from '@/hooks/use-lines'
import { Checkbox } from "@/components/ui"

type EntityType = 'category' | 'brand' | 'provider' | 'line' | 'subline'

const schemas: Record<EntityType, z.ZodSchema<any>> = {
  category: z.object({ nom_categoria: z.string().min(2, 'Requerido'), ind_activo: z.boolean().optional().default(true) }),
  brand: z.object({ nom_marca: z.string().min(2, 'Requerido'), ind_activo: z.boolean().optional().default(true) }),
  provider: z.object({ 
    nom_proveedor: z.string().min(2, 'Requerido'), 
    email: z.string().email('Email inválido').min(1, 'Requerido'),
    tel_proveedor: z.coerce.number({ message: 'Teléfono requerido' }).positive('Teléfono debe ser positivo'),
    ind_activo: z.boolean().optional().default(true) 
  }),
  line: z.object({ id_categoria: z.coerce.number({ message: 'Seleccione una categoría' }).positive(), nom_linea: z.string().min(2), ind_activo: z.boolean().optional().default(true) }),
  subline: z.object({ id_categoria: z.coerce.number({ message: 'Seleccione una categoría' }).positive(), id_linea: z.coerce.number({ message: 'Seleccione una línea' }).positive(), nom_sublinea: z.string().min(2), ind_activo: z.boolean().optional().default(true) }),
}

export interface CreateEntityModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  type: EntityType
  title?: string
  onSubmit: (values: any) => Promise<void> | void
  extraFields?: React.ReactNode
}

export const CreateEntityModal: React.FC<CreateEntityModalProps> = ({ open, onOpenChange, type, title, onSubmit, extraFields }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({ resolver: zodResolver(schemas[type] as any), defaultValues: { ind_activo: true } })
  const { data: allCategories = [], isLoading: loadingCategories } = useAllCategories()
  const categories = React.useMemo(() => {
    return Array.isArray(allCategories)
      ? allCategories.map((c: any) => ({ id: Number(c.id_categoria), name: c.nom_categoria }))
      : []
  }, [allCategories])
  const watchedCategoryId = form.watch('id_categoria')
  const categoryId = watchedCategoryId && watchedCategoryId !== '' && !isNaN(Number(watchedCategoryId)) ? Number(watchedCategoryId) : null
  const { data: lines = [], isLoading: loadingLines } = useLinesByCategory(categoryId || 0)

  // Determinar si el formulario está válido para sublíneas
  const isSublineFormValid = React.useMemo(() => {
    if (type !== 'subline') return true
    return categoryId && Array.isArray(lines) && lines.length > 0
  }, [type, categoryId, lines])

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
    onOpenChange(false)
    form.reset()
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title || `Crear ${type}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'category' && (
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input {...form.register('nom_categoria')} placeholder="Ej. Electrónicos" />
            </div>
          )}

          {type === 'brand' && (
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input {...form.register('nom_marca')} placeholder="Ej. Samsung" />
            </div>
          )}

          {type === 'provider' && (
            <>
            <div className="space-y-2">
                <Label>Nombre *</Label>
              <Input {...form.register('nom_proveedor')} placeholder="Ej. Importaciones XYZ" />
                {form.formState.errors.nom_proveedor && (
                  <p className="text-xs text-red-600">{form.formState.errors.nom_proveedor.message as string}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input 
                  type="email" 
                  {...form.register('email')} 
                  placeholder="Ej. contacto@importacionesxyz.com" 
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-600">{form.formState.errors.email.message as string}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Teléfono *</Label>
                <Input 
                  type="tel" 
                  {...form.register('tel_proveedor')} 
                  placeholder="Ej. 3001234567" 
                />
                {form.formState.errors.tel_proveedor && (
                  <p className="text-xs text-red-600">{form.formState.errors.tel_proveedor.message as string}</p>
                )}
            </div>
            </>
          )}

          {type === 'line' && (
            <>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <select className="w-full border rounded-md h-9 px-3 text-sm bg-white dark:bg-gray-900" {...form.register('id_categoria')}>
                  <option value="">{loadingCategories ? 'Cargando...' : 'Seleccione'}</option>
                  {Array.isArray(categories) && categories.length > 0 ? (
                    categories.map((c: any, idx: number) => (
                      <option key={`cat-${c.id}-${idx}`} value={c.id}>{c.name}</option>
                    ))
                  ) : (
                    !loadingCategories && <option value="" disabled>No hay categorías. Cree una primero.</option>
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input {...form.register('nom_linea')} placeholder="Ej. Smartphones" />
              </div>
            </>
          )}

          {type === 'subline' && (
            <>
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <select className="w-full border rounded-md h-9 px-3 text-sm bg-white dark:bg-gray-900" {...form.register('id_categoria')}
                  onChange={(e) => { form.setValue('id_categoria', Number(e.target.value) || ''); form.setValue('id_linea', ''); }}>
                  <option value="">{loadingCategories ? 'Cargando...' : 'Seleccione una categoría'}</option>
                  {Array.isArray(categories) && categories.length > 0 ? (
                    categories.map((c: any, idx: number) => (
                      <option key={`cat-${c.id}-${idx}`} value={c.id}>{c.name}</option>
                    ))
                  ) : (
                    !loadingCategories && <option value="" disabled>No hay categorías. Cree una primero.</option>
                  )}
                </select>
                <p className="text-xs text-muted-foreground">Primero seleccione una categoría para habilitar las líneas</p>
              </div>
              <div className="space-y-2">
                <Label>Línea *</Label>
                <select 
                  className={`w-full border rounded-md h-9 px-3 text-sm bg-white dark:bg-gray-900 ${
                    !categoryId ? 'opacity-50 cursor-not-allowed' : ''
                  }`} 
                  {...form.register('id_linea')} 
                  disabled={!categoryId}
                >
                  <option value="">
                    {loadingLines ? 'Cargando...' : 
                     !categoryId ? 'Seleccione categoría primero' : 
                     'Seleccione una línea'}
                  </option>
                  {Array.isArray(lines) && lines.length > 0 && lines.map((l: any, idx: number) => (
                    <option key={`line-${l.id_categoria}-${l.id_linea}-${idx}`} value={l.id_linea}>{l.nom_linea}</option>
                  ))}
                </select>
                {!categoryId && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ Debe seleccionar una categoría primero
                  </p>
                )}
                {categoryId && Array.isArray(lines) && lines.length === 0 && !loadingLines && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ No hay líneas disponibles para esta categoría. Debe crear una línea primero.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input {...form.register('nom_sublinea')} placeholder="Ej. Android" />
              </div>
            </>
          )}

          {/* Campo activo opcional */}
          {['category','brand','provider','line','subline'].includes(type) && (
            <div className="flex items-center gap-2">
              <Checkbox id="ind_activo" checked={!!form.watch('ind_activo')} onCheckedChange={(v: any) => form.setValue('ind_activo', Boolean(v))} />
              <Label htmlFor="ind_activo">Activo</Label>
            </div>
          )}

          {extraFields}

          <div className="flex justify-end gap-2">
            <Button type="button"  onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button 
              type="submit" 
              className="bg-[#fec806] hover:bg-[#e6b800] text-black disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={!isSublineFormValid}
            >
              Guardar
            </Button>
          </div>
          {type === 'subline' && !isSublineFormValid && (
            <p className="text-xs text-center text-amber-600 dark:text-amber-400 mt-2">
              ⚠️ No se puede crear la sublínea. Primero debe crear una línea para esta categoría.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}


