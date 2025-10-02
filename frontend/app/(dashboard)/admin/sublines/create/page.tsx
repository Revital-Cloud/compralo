'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useCategories } from '@/hooks/use-categories'
import { useLinesByCategory } from '@/hooks/use-lines'
import { lineService } from '@/services/line.service'

const CreateSublinePage = () => {
  const router = useRouter()
  const { data: categories = [] } = useCategories()
  const [idCategoria, setIdCategoria] = useState<number | ''>('' as any)
  const { data: lines = [] } = useLinesByCategory(Number(idCategoria))
  const [idLinea, setIdLinea] = useState<number | ''>('' as any)
  const [name, setName] = useState('')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!idCategoria) return toast.error('Selecciona una categoría')
    if (!idLinea) return toast.error('Selecciona una línea')
    if (!name.trim()) return toast.error('El nombre es obligatorio')
    try {
      setLoading(true)
      await lineService.createSubline({ id_categoria: Number(idCategoria), id_linea: Number(idLinea), nom_sublinea: name.trim(), ind_activo: active })
      toast.success('Sublínea creada correctamente')
      router.push('/admin/sublines')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Error al crear la sublínea')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Crear Sublínea</h1>
        <p className="text-muted-foreground">Crea una sublínea dentro de una línea existente.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva Sublínea</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id_categoria">Categoría</Label>
              <select id="id_categoria" className="w-full border rounded-md h-9 px-3 text-sm" value={idCategoria as any} onChange={(e) => { setIdCategoria(e.target.value ? Number(e.target.value) : ('' as any)); setIdLinea('' as any); }}>
                <option value="">Seleccione</option>
                {categories.map((c: any) => (
                  <option key={c.id_categoria} value={c.id_categoria}>{c.nom_categoria}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_linea">Línea</Label>
              <select id="id_linea" className="w-full border rounded-md h-9 px-3 text-sm" value={idLinea as any} onChange={(e) => setIdLinea(e.target.value ? Number(e.target.value) : ('' as any))} disabled={!idCategoria}>
                <option value="">Seleccione</option>
                {Array.isArray(lines) && lines.map((l: any) => (
                  <option key={l.id_linea} value={l.id_linea}>{l.nom_linea}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom_sublinea">Nombre</Label>
              <Input id="nom_sublinea" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Accesorios" />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="ind_activo" checked={active} onCheckedChange={(v: any) => setActive(Boolean(v))} />
              <Label htmlFor="ind_activo">Activo</Label>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/sublines')}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateSublinePage


