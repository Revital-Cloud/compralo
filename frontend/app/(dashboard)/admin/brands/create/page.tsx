'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { brandService } from '@/services/brand.service'

const CreateBrandPage = () => {
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
      await brandService.createBrand({ nom_marca: name.trim(), des_marca: desc || undefined, ind_activo: active })
      toast.success('Marca creada correctamente')
      router.push('/admin/brands')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Error al crear la marca')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Crear Marca</h1>
        <p className="text-muted-foreground">Registra una nueva marca para tus productos.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva Marca</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom_marca">Nombre</Label>
              <Input id="nom_marca" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Acme" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="des_marca">Descripción (opcional)</Label>
              <Input id="des_marca" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción breve" />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="ind_activo" checked={active} onCheckedChange={(v: any) => setActive(Boolean(v))} />
              <Label htmlFor="ind_activo">Activo</Label>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/brands')}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateBrandPage


