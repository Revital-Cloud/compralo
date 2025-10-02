'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select } from '@/components/ui/select'
import { toast } from 'sonner'
import { useCategories } from '@/hooks/use-categories'
import { lineService } from '@/services/line.service'

const CreateLinePage = () => {
  const router = useRouter()
  const { data: categories = [] } = useCategories()
  const [idCategoria, setIdCategoria] = useState<number | ''>('' as any)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!idCategoria) return toast.error('Selecciona una categoría')
    if (!name.trim()) return toast.error('El nombre es obligatorio')
    try {
      setLoading(true)
      await lineService.createLine({ id_categoria: Number(idCategoria), nom_linea: name.trim(), desc_linea: desc || undefined, ind_activo: active })
      toast.success('Línea creada correctamente')
      router.push('/admin/lines')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Error al crear la línea')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Crear Línea</h1>
        <p className="text-muted-foreground">Define una nueva línea dentro de una categoría.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva Línea</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id_categoria">Categoría</Label>
              <select id="id_categoria" className="w-full border rounded-md h-9 px-3 text-sm" value={idCategoria as any} onChange={(e) => setIdCategoria(e.target.value ? Number(e.target.value) : ('' as any))}>
                <option value="">Seleccione</option>
                {categories.map((c: any) => (
                  <option key={c.id_categoria} value={c.id_categoria}>{c.nom_categoria}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom_linea">Nombre</Label>
              <Input id="nom_linea" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Smartphones" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc_linea">Descripción (opcional)</Label>
              <Input id="desc_linea" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción breve" />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="ind_activo" checked={active} onCheckedChange={(v: any) => setActive(Boolean(v))} />
              <Label htmlFor="ind_activo">Activo</Label>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/lines')}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateLinePage


