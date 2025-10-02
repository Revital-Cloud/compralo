'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { providerService } from '@/services/provider.service'

const CreateProviderPage = () => {
  const router = useRouter()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    try {
      setLoading(true)
      await providerService.createProvider({ nom_proveedor: name.trim(), des_proveedor: desc || undefined, ind_activo: active })
      toast.success('Proveedor creado correctamente')
      router.push('/admin/providers')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Error al crear el proveedor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Crear Proveedor</h1>
        <p className="text-muted-foreground">Registra un nuevo proveedor para tu inventario.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo Proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom_proveedor">Nombre</Label>
              <Input id="nom_proveedor" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Distribuciones XYZ" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="des_proveedor">Descripción (opcional)</Label>
              <Input id="des_proveedor" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción breve" />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="ind_activo" checked={active} onCheckedChange={(v: any) => setActive(Boolean(v))} />
              <Label htmlFor="ind_activo">Activo</Label>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/providers')}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateProviderPage


