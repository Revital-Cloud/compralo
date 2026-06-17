'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"
import { Button, Input, Label } from "@/components/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PHONE_COUNTRY_CODES } from '@/lib/phone-country-codes'
import { Checkbox } from "@/components/ui"
import { getEntitySchemas, type EntityType } from '@/schemas/admin/entity.schema'

const COUNTRY_PHONE_CODES = PHONE_COUNTRY_CODES

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
    resolver: zodResolver(getEntitySchemas('create')[type] as any),
    defaultValues: { ind_activo: true, tel_country_code: '57', tel_numero: '' }
  })
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
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{title || `Crear ${type}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'category' && (
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input {...form.register('name')} placeholder="Ej. Electrónicos" />
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
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select
                    value={form.watch('tel_country_code') || '57'}
                    onValueChange={(v) => form.setValue('tel_country_code', v)}
                  >
                    <SelectTrigger className="w-full shrink-0 sm:w-[180px]">
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

          {/* Campo activo opcional */}
          {['category','brand','provider'].includes(type) && (
            <div className="flex items-center gap-2">
              <Checkbox id="ind_activo" checked={!!form.watch('ind_activo')} onCheckedChange={(v: any) => form.setValue('ind_activo', Boolean(v))} />
              <Label htmlFor="ind_activo">Activo</Label>
            </div>
          )}

          {extraFields}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button 
              type="submit" 
              className="w-full bg-brand-secondary text-black hover:bg-[#e6b800] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" 
            >
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


