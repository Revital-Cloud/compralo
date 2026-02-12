'use client'

import React, { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"
import { Button, Input, Label } from "@/components/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCategories } from '@/hooks/use-categories'
import { useLinesByCategory } from '@/hooks/use-lines'
import { PHONE_COUNTRY_CODES, parsePhoneForEdit } from '@/lib/phone-country-codes'
import { Checkbox } from "@/components/ui"

type EntityType = 'line' | 'subline' | 'category' | 'brand' | 'provider'

const schemas: Record<EntityType, z.ZodSchema<any>> = {
  category: z.object({ nom_categoria: z.string().min(2), ind_activo: z.boolean().optional().default(true) }),
  brand: z.object({ nom_marca: z.string().min(2), ind_activo: z.boolean().optional().default(true) }),
  provider: z.object({ 
    nom_proveedor: z.string().min(2).optional(), 
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    tel_country_code: z.string().optional(),
    tel_numero: z.string().optional(),
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

  useEffect(() => {
    if (type === 'provider' && initialValues?.tel_proveedor != null) {
      const { code, numero } = parsePhoneForEdit(initialValues.tel_proveedor)
      form.reset({ ...initialValues, tel_country_code: code, tel_numero: numero })
    } else {
      form.reset(initialValues)
    }
  }, [initialValues, form, type])

  const { data: categories = [], isLoading: loadingCategories } = useCategories()
  const categoryId = form.watch('id_categoria') ? Number(form.watch('id_categoria')) : 0
  const { data: lines = [], isLoading: loadingLines } = useLinesByCategory(categoryId)

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload = { ...values }
    if (type === 'provider') {
      const code = payload.tel_country_code
      const numero = String(payload.tel_numero ?? '').trim()
      if (code && numero.length > 0) {
        payload.tel_proveedor = Number(code + numero)
      }
      delete payload.tel_country_code
      delete payload.tel_numero
    }
    await onSubmit(payload)
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
                <Select
                  value={form.watch('id_categoria') ? String(form.watch('id_categoria')) : ''}
                  onValueChange={(v) => form.setValue('id_categoria', v ? Number(v) : undefined)}
                  disabled={loadingCategories}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCategories ? 'Cargando...' : 'Seleccione'} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(categories) && categories.map((c: any, idx: number) => (
                      <SelectItem key={`cat-${c.id ?? c.id_categoria}-${idx}`} value={String(c.id ?? c.id_categoria)}>{c.name ?? c.nom_categoria}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select
                  value={form.watch('id_categoria') ? String(form.watch('id_categoria')) : ''}
                  onValueChange={(v) => {
                    form.setValue('id_categoria', v ? Number(v) : undefined)
                    form.setValue('id_linea', '')
                  }}
                  disabled={loadingCategories}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCategories ? 'Cargando...' : 'Seleccione'} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(categories) && categories.map((c: any, idx: number) => (
                      <SelectItem key={`cat-${c.id ?? c.id_categoria}-${idx}`} value={String(c.id ?? c.id_categoria)}>{c.name ?? c.nom_categoria}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Línea</Label>
                <Select
                  value={form.watch('id_linea') ? String(form.watch('id_linea')) : ''}
                  onValueChange={(v) => form.setValue('id_linea', v ? Number(v) : undefined)}
                  disabled={loadingLines || !categoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingLines ? 'Cargando...' : !categoryId ? 'Seleccione categoría primero' : 'Seleccione'} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(lines) && lines.map((l: any, idx: number) => (
                      <SelectItem key={`line-${l.id_categoria}-${l.id_linea}-${idx}`} value={String(l.id_linea)}>{l.nom_linea}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <div className="flex gap-2">
                  <Select
                    value={form.watch('tel_country_code') || '57'}
                    onValueChange={(v) => form.setValue('tel_country_code', v)}
                  >
                    <SelectTrigger className="w-[180px] shrink-0">
                      <SelectValue placeholder="País" />
                    </SelectTrigger>
                    <SelectContent>
                      {PHONE_COUNTRY_CODES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="Ej. 3001234567"
                    className="flex-1"
                    value={form.watch('tel_numero') ?? ''}
                    onChange={(e) => form.setValue('tel_numero', e.target.value.replace(/\D/g, ''), { shouldValidate: true })}
                  />
                </div>
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


