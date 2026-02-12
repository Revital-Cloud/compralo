'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"
import { Button, Input, Label } from "@/components/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAllCategories } from '@/hooks/use-categories'
import { useAllLines, useLinesByCategory } from '@/hooks/use-lines'
import { PHONE_COUNTRY_CODES } from '@/lib/phone-country-codes'
import { Checkbox } from "@/components/ui"

const COUNTRY_PHONE_CODES = PHONE_COUNTRY_CODES

type EntityType = 'category' | 'brand' | 'provider' | 'line' | 'subline'

const schemas: Record<EntityType, z.ZodSchema<any>> = {
  category: z.object({ nom_categoria: z.string().min(2, 'Requerido'), ind_activo: z.boolean().optional().default(true) }),
  brand: z.object({ nom_marca: z.string().min(2, 'Requerido'), ind_activo: z.boolean().optional().default(true) }),
  provider: z.object({ 
    nom_proveedor: z.string().min(2, 'Requerido'), 
    email: z.string().email('Email inválido').min(1, 'Requerido'),
    tel_country_code: z.string().min(1, 'Seleccione país'),
    tel_numero: z.string().min(7, 'Mínimo 7 dígitos').regex(/^\d+$/, 'Solo números'),
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
  const form = useForm<any>({
    resolver: zodResolver(schemas[type] as any),
    defaultValues: { ind_activo: true, tel_country_code: '57', tel_numero: '' }
  })
  const { data: allCategories = [], isLoading: loadingCategories } = useAllCategories()
  const categories = React.useMemo(() => {
    return Array.isArray(allCategories)
      ? allCategories.map((c: any) => ({ id: Number(c.id_categoria), name: c.nom_categoria }))
      : []
  }, [allCategories])
  const watchedCategoryId = form.watch('id_categoria')
  const categoryId = watchedCategoryId && watchedCategoryId !== '' && !isNaN(Number(watchedCategoryId)) ? Number(watchedCategoryId) : null
  const { data: lines = [], isLoading: loadingLines } = useLinesByCategory(categoryId || 0)
  const { data: allLines = [], isLoading: loadingAllLines } = useAllLines()

  const sublineCat = form.watch('id_categoria')
  const sublineLineId = form.watch('id_linea')
  const isSublineFormValid = React.useMemo(() => {
    if (type !== 'subline') return true
    return !!sublineCat && !!sublineLineId && !isNaN(Number(sublineCat)) && !isNaN(Number(sublineLineId))
  }, [type, sublineCat, sublineLineId])

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload = { ...values }
    if (type === 'provider' && payload.tel_country_code != null && payload.tel_numero != null) {
      payload.tel_proveedor = Number(payload.tel_country_code + payload.tel_numero)
      delete payload.tel_country_code
      delete payload.tel_numero
    }
    await onSubmit(payload)
    onOpenChange(false)
    form.reset({ ind_activo: true, tel_country_code: '57', tel_numero: '' })
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
                <div className="flex gap-2">
                  <Select
                    value={form.watch('tel_country_code') || '57'}
                    onValueChange={(v) => form.setValue('tel_country_code', v)}
                  >
                    <SelectTrigger className="w-[180px] shrink-0">
                      <SelectValue placeholder="País" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_PHONE_CODES.map((c) => (
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
                {(form.formState.errors.tel_numero || form.formState.errors.tel_country_code) && (
                  <p className="text-xs text-red-600">
                    {(form.formState.errors.tel_numero?.message ?? form.formState.errors.tel_country_code?.message) as string}
                  </p>
                )}
              </div>
            </>
          )}

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
                      <SelectItem key={`cat-${c.id}-${idx}`} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!loadingCategories && Array.isArray(categories) && categories.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">No hay categorías. Cree una primero.</p>
                )}
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
                <Select
                  value={form.watch('id_categoria') ? String(form.watch('id_categoria')) : ''}
                  onValueChange={(v) => {
                    form.setValue('id_categoria', v ? Number(v) : undefined)
                    form.setValue('id_linea', '')
                  }}
                  disabled={loadingCategories}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCategories ? 'Cargando...' : 'Seleccione una categoría'} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(categories) && categories.map((c: any, idx: number) => (
                      <SelectItem key={`cat-${c.id}-${idx}`} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!loadingCategories && Array.isArray(categories) && categories.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">No hay categorías. Cree una primero.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Línea *</Label>
                <Select
                  value={
                    form.watch('id_categoria') && form.watch('id_linea')
                      ? `${form.watch('id_categoria')}-${form.watch('id_linea')}`
                      : ''
                  }
                  onValueChange={(v) => {
                    if (v && v.includes('-')) {
                      const [catId, lineId] = v.split('-').map(Number)
                      form.setValue('id_categoria', catId)
                      form.setValue('id_linea', lineId)
                    } else {
                      form.setValue('id_categoria', form.watch('id_categoria') || undefined)
                      form.setValue('id_linea', undefined)
                    }
                  }}
                  disabled={loadingAllLines}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingAllLines ? 'Cargando...' : 'Seleccione una línea (se asigna su categoría)'} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(allLines) && allLines.map((l: any, idx: number) => (
                      <SelectItem key={`line-${l.id_categoria}-${l.id_linea}-${idx}`} value={`${l.id_categoria}-${l.id_linea}`}>
                        {l.nom_linea} {(l as any).nom_categoria ? `(${(l as any).nom_categoria})` : `— Cat ${l.id_categoria}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Puede elegir categoría primero o una línea (se asignará su categoría).</p>
                {!loadingAllLines && Array.isArray(allLines) && allLines.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">No hay líneas. Cree antes una categoría y una línea.</p>
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
              ⚠️ Seleccione una línea y complete el nombre.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}


