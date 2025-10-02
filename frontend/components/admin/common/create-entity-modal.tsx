'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCategories } from '@/hooks/use-categories'
import { useLinesByCategory } from '@/hooks/use-lines'
import { Checkbox } from '@/components/ui/checkbox'

type EntityType = 'category' | 'brand' | 'provider' | 'line' | 'subline'

const schemas: Record<EntityType, z.ZodSchema<any>> = {
  category: z.object({ nom_categoria: z.string().min(2, 'Requerido'), ind_activo: z.boolean().optional().default(true) }),
  brand: z.object({ nom_marca: z.string().min(2, 'Requerido'), ind_activo: z.boolean().optional().default(true) }),
  provider: z.object({ nom_proveedor: z.string().min(2, 'Requerido'), ind_activo: z.boolean().optional().default(true) }),
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
  const form = useForm<any>({ resolver: zodResolver(schemas[type]), defaultValues: { ind_activo: true } })
  const { data: categories = [], isLoading: loadingCategories } = useCategories()
  const categoryId = form.watch('id_categoria') ? Number(form.watch('id_categoria')) : 0
  const { data: lines = [], isLoading: loadingLines } = useLinesByCategory(categoryId)

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
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input {...form.register('nom_proveedor')} placeholder="Ej. Importaciones XYZ" />
            </div>
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
                <Label>Categoría</Label>
                <select className="w-full border rounded-md h-9 px-3 text-sm bg-white dark:bg-gray-900" {...form.register('id_categoria')}
                  onChange={(e) => { form.setValue('id_categoria', Number(e.target.value) || ''); form.setValue('id_linea', ''); }}>
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
                <Label>Línea</Label>
                <select className="w-full border rounded-md h-9 px-3 text-sm bg-white dark:bg-gray-900" {...form.register('id_linea')} disabled={!categoryId}>
                  <option value="">{loadingLines ? 'Cargando...' : (!categoryId ? 'Seleccione categoría' : 'Seleccione')}</option>
                  {Array.isArray(lines) && lines.length > 0 && lines.map((l: any, idx: number) => (
                    <option key={`line-${l.id_categoria}-${l.id_linea}-${idx}`} value={l.id_linea}>{l.nom_linea}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-[#fec806] hover:bg-[#e6b800] text-black">Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


