'use client'

import React, { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"
import { Button } from "@/components/ui"
import { Input } from "@/components/ui"
import { Label } from "@/components/ui"
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCategories } from '@/hooks/use-categories'
import { useLinesByCategory } from '@/hooks/use-lines'
import { Checkbox } from "@/components/ui"

type EntityType = 'line' | 'subline' | 'category' | 'brand' | 'provider'

const schemas: Record<EntityType, z.ZodSchema<any>> = {
  category: z.object({ nom_categoria: z.string().min(2), ind_activo: z.boolean().optional().default(true) }),
  brand: z.object({ nom_marca: z.string().min(2), ind_activo: z.boolean().optional().default(true) }),
  provider: z.object({ 
    nom_proveedor: z.string().min(2).optional(), 
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    tel_proveedor: z.coerce.number().positive('Teléfono debe ser positivo').optional().or(z.literal('')),
    ind_activo: z.boolean().optional().default(true) 
  }),
  line: z.object({ id_categoria: z.coerce.number(), nom_linea: z.string().min(2), ind_activo: z.boolean().optional().default(true) }),
  subline: z.object({ id_categoria: z.coerce.number(), id_linea: z.coerce.number(), nom_sublinea: z.string().min(2), ind_activo: z.boolean().optional().default(true) }),
}

export interface EditEntityModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  type: EntityType
  title?: string
  initialValues: any
  onSubmit: (values: any) => Promise<void> | void
}

export const EditEntityModal: React.FC<EditEntityModalProps> = ({ open, onOpenChange, type, title, initialValues, onSubmit }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({ resolver: zodResolver(schemas[type] as any), defaultValues: initialValues })

  useEffect(() => { form.reset(initialValues) }, [initialValues, form])

  const { data: categories = [], isLoading: loadingCategories } = useCategories()
  const categoryId = form.watch('id_categoria') ? Number(form.watch('id_categoria')) : 0
  const { data: lines = [], isLoading: loadingLines } = useLinesByCategory(categoryId)

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title || `Editar ${type}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'line' && (
            <>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <select className="w-full border rounded-md h-9 px-3 text-sm bg-white dark:bg-gray-900" {...form.register('id_categoria')}>
                  <option value="">{loadingCategories ? 'Cargando...' : 'Seleccione'}</option>
                  {Array.isArray(categories) && categories.map((c: any, idx: number) => (
                    <option key={`cat-${c.id}-${idx}`} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input {...form.register('nom_linea')} />
              </div>
            </>
          )}

          {type === 'subline' && (
            <>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <select className="w-full border rounded-md h-9 px-3 text-sm bg-white dark:bg-gray-900" {...form.register('id_categoria')}>
                  <option value="">{loadingCategories ? 'Cargando...' : 'Seleccione'}</option>
                  {Array.isArray(categories) && categories.map((c: any, idx: number) => (
                    <option key={`cat-${c.id}-${idx}`} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Línea</Label>
                <select className="w-full border rounded-md h-9 px-3 text-sm bg-white dark:bg-gray-900" {...form.register('id_linea')}>
                  <option value="">{loadingLines ? 'Cargando...' : 'Seleccione'}</option>
                  {Array.isArray(lines) && lines.map((l: any, idx: number) => (
                    <option key={`line-${l.id_categoria}-${l.id_linea}-${idx}`} value={l.id_linea}>{l.nom_linea}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input {...form.register('nom_sublinea')} />
              </div>
            </>
          )}

          {type === 'category' && (
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input {...form.register('nom_categoria')} />
            </div>
          )}

          {type === 'brand' && (
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input {...form.register('nom_marca')} />
            </div>
          )}

          {type === 'provider' && (
            <>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input {...form.register('nom_proveedor')} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
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
                <Label>Teléfono</Label>
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

          <div className="flex items-center gap-2">
            <Checkbox id="ind_activo_edit" checked={!!form.watch('ind_activo')} onCheckedChange={(v: any) => form.setValue('ind_activo', Boolean(v))} />
            <Label htmlFor="ind_activo_edit">Activo</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-[#fec806] hover:bg-[#e6b800] text-black">Guardar cambios</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


