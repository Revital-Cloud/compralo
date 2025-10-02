'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import categoryService from '@/services/category.service'

const CreateCategoryPage = () => {
  const router = useRouter()
  const [name, setName] = useState('')
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
      await categoryService.createCategory({ nom_categoria: name.trim(), ind_activo: active })
      toast.success('Categoría creada correctamente')
      router.push('/admin/categories')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Error al crear la categoría')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Crear Categoría</h1>
        <p className="text-muted-foreground">Registra una nueva categoría para tu catálogo.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom_categoria">Nombre</Label>
              <Input id="nom_categoria" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Electrónica" />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="ind_activo" checked={active} onCheckedChange={(v: any) => setActive(Boolean(v))} />
              <Label htmlFor="ind_activo">Activo</Label>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/categories')}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateCategoryPage


