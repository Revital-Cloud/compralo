'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Button } from "@/components/ui"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"
import { Input } from "@/components/ui"
import { Label } from "@/components/ui"

import { toast } from "sonner"
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Pencil, Power, Users, UserCircle, Shield, UserCheck, UserX } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUsers, toggleUserStatus, updateUser } from '@/services/user.service'
import type { User } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { editUserSchema, type EditUserFormData } from '@/schemas/admin/user-edit.schema'
import { useAdminTour } from '../_tour/useAdminDriverTour'
import { AdminStatsRowSkeleton, AdminTableSkeleton } from '@/components/admin/skeletons'

const getRoleBadge = (roleId: number) => {
  switch (roleId) {
    case 1:
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Admin</Badge>
    case 2:
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Cliente</Badge>
    default:
      return <Badge variant="secondary">Usuario</Badge>
  }
}

const getStatusBadge = (status: boolean) => {
  return status ? (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>
  ) : (
    <Badge variant="destructive">Inactivo</Badge>
  )
}

const getGenderLabel = (ind_genero: boolean | null | undefined) => {
  if (ind_genero === true) return 'Femenino'
  if (ind_genero === false) return 'Masculino'
  return '-'
}

const statCards = [
  { key: 'total' as const, label: 'Total', icon: Users, color: 'text-foreground', bg: 'bg-muted/50', border: 'border-l-4 border-l-slate-500' },
  { key: 'customers' as const, label: 'Clientes', icon: UserCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-l-4 border-l-emerald-500' },
  { key: 'admins' as const, label: 'Admins', icon: Shield, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', border: 'border-l-4 border-l-red-500' },
  { key: 'active' as const, label: 'Activos', icon: UserCheck, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', border: 'border-l-4 border-l-green-500' },
  { key: 'inactive' as const, label: 'Inactivos', icon: UserX, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-l-4 border-l-amber-500' },
]

const UsersPage = () => {
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const { data: usersResponse, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => toggleUserStatus(id, active),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(variables.active ? 'Usuario activado' : 'Usuario desactivado')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || 'Error al cambiar estado'
      toast.error(typeof msg === 'string' ? msg : 'Error al cambiar estado')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditUserFormData }) => {
      const payload: Record<string, unknown> = {
        nom_usuario: data.nom_usuario,
        ape_usuario: data.ape_usuario ?? '',
        email_usuario: data.email_usuario,
        cel_usuario: data.cel_usuario ?? '',
        ind_genero: data.ind_genero,
        fec_nacimiento: data.fec_nacimiento || undefined,
      }
      return updateUser(id, payload as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditOpen(false)
      setEditingUser(null)
      toast.success('Usuario actualizado')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || 'Error al actualizar'
      toast.error(typeof msg === 'string' ? msg : 'Error al actualizar')
    },
  })

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      nom_usuario: '',
      ape_usuario: '',
      email_usuario: '',
      cel_usuario: '',
      fec_nacimiento: '',
    },
  })

  const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse?.items || [])
  const totalUsers = Array.isArray(usersResponse) ? usersResponse.length : (usersResponse?.total || 0)

  const userStats = useMemo(() => ({
    total: totalUsers,
    customers: users.filter(u => Number((u as any).id_rol) === 2).length,
    admins: users.filter(u => Number((u as any).id_rol) === 1).length,
    active: users.filter(u => (u as any).ind_activo).length,
    inactive: users.filter(u => !(u as any).ind_activo).length,
  }), [totalUsers, users])

  const { startUsersTour } = useAdminTour()

  useEffect(() => {
    try {
      const seen = localStorage.getItem('revital_users_tour_seen')
      if (!seen) {
        startUsersTour()
        localStorage.setItem('revital_users_tour_seen', '1')
      }
    } catch {
      // ignore
    }
  }, [startUsersTour])

  const openEdit = useCallback((user: User) => {
    setEditingUser(user)
    form.reset({
      nom_usuario: user.nom_usuario,
      ape_usuario: user.ape_usuario ?? '',
      email_usuario: user.email_usuario,
      cel_usuario: user.cel_usuario ?? '',
      ind_genero: user.ind_genero,
      fec_nacimiento: user.fec_nacimiento ? String(user.fec_nacimiento).slice(0, 10) : '',
    })
    setEditOpen(true)
  }, [form])

  const handleEditSubmit = useMemo(
    () =>
      form.handleSubmit((data) => {
        if (!editingUser) return
        const id = Number(editingUser.id_usuario)
        updateMutation.mutate({ id, data })
      }),
    [editingUser, form, updateMutation]
  )

  const columns: ColumnDef<User>[] = useMemo(() => [
    {
      accessorKey: 'id_usuario',
      header: 'Usuario',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={undefined} alt={row.original.nom_usuario} />
            <AvatarFallback>
              {row.original.nom_usuario[0]}{row.original.ape_usuario?.[0] || ''}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{row.original.nom_usuario} {row.original.ape_usuario}</div>
            <div className="text-xs text-muted-foreground">{row.original.email_usuario}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'cel_usuario',
      header: 'Teléfono',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.cel_usuario || '-'}</span>
      ),
    },
    {
      accessorKey: 'ind_genero',
      header: 'Género',
      cell: ({ row }) => (
        <span className="text-sm">{getGenderLabel(row.original.ind_genero as unknown as boolean | null | undefined)}</span>
      ),
    },
    {
      accessorKey: 'id_rol',
      header: 'Rol',
      cell: ({ row }) => getRoleBadge(Number((row.original as any).id_rol)),
    },
    {
      accessorKey: 'ind_activo',
      header: 'Estado',
      cell: ({ row }) => getStatusBadge(row.original.ind_activo),
    },
  ], [])

  const actions: ColumnDef<User>[] = useMemo(() => [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Editar usuario"
            onClick={() => openEdit(row.original)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          {row.original.ind_activo ? (
            <Button
              variant="destructive"
              size="icon"
              aria-label="Desactivar"
              onClick={() => toggleMutation.mutate({ id: row.original.id_usuario as unknown as number, active: false })}
              disabled={toggleMutation.isPending}
            >
              <Power className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="icon"
              aria-label="Activar"
              onClick={() => toggleMutation.mutate({ id: row.original.id_usuario as unknown as number, active: true })}
              disabled={toggleMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Power className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ], [openEdit, toggleMutation])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between" data-tour-id="users-header">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona todos los usuarios de tu plataforma
          </p>
        </div>
      </div>

      {/* Tarjetas de resumen mejoradas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" data-tour-id="users-stats">
        {statCards.map(({ key, label, icon: Icon, color, bg, border }) => (
          <Card key={key} className={`overflow-hidden ${border} ${bg} transition-shadow hover:shadow-lg`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className={`text-2xl font-bold mt-1 ${color}`}>{userStats[key]}</p>
                </div>
                <div className={`rounded-lg p-2 bg-black/20 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          <AdminStatsRowSkeleton count={5} />
          <AdminTableSkeleton rows={10} />
        </div>
      )}

      {isError && (
        <div className="text-center py-12">
          <div className="text-red-600">No se pudieron cargar los usuarios.</div>
        </div>
      )}

      {!isLoading && !isError && users.length > 0 && (
        <div data-tour-id="users-table">
          <DataTable
            columns={[...columns, ...actions]}
            data={users}
            pageSize={10}
          />
        </div>
      )}

      {!isLoading && !isError && users.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">No hay usuarios registrados</div>
        </div>
      )}

      {/* Modal editar usuario */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditingUser(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom_usuario">Nombre</Label>
                <Input id="nom_usuario" {...form.register('nom_usuario')} />
                {form.formState.errors.nom_usuario && (
                  <p className="text-xs text-destructive">{form.formState.errors.nom_usuario.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ape_usuario">Apellido</Label>
                <Input id="ape_usuario" {...form.register('ape_usuario')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_usuario">Email</Label>
              <Input id="email_usuario" type="email" {...form.register('email_usuario')} />
              {form.formState.errors.email_usuario && (
                <p className="text-xs text-destructive">{form.formState.errors.email_usuario.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cel_usuario">Teléfono</Label>
              <Input id="cel_usuario" {...form.register('cel_usuario')} />
            </div>
            <div className="space-y-2">
              <Label>Género</Label>
              <select
                className="w-full border rounded-md h-9 px-3 text-sm bg-background"
                {...form.register('ind_genero', { setValueAs: (v) => v === 'true' })}
              >
                <option value="">Sin especificar</option>
                <option value="false">Masculino</option>
                <option value="true">Femenino</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fec_nacimiento">Fecha de nacimiento</Label>
              <Input id="fec_nacimiento" type="date" {...form.register('fec_nacimiento')} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UsersPage
