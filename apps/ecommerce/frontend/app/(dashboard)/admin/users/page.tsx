'use client';

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IconDownload } from "@tabler/icons-react"

import { toast } from "sonner"
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Pencil, Power } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUsers, toggleUserStatus } from '@/services/user.service'
import type { User } from '@/types'

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

const UsersPage = () => {
  const queryClient = useQueryClient()
  const { data: usersResponse, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => toggleUserStatus(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse?.items || [])
  const totalUsers = Array.isArray(usersResponse) ? usersResponse.length : (usersResponse?.total || 0)

  // Calcular estadísticas
  const userStats = {
    total: totalUsers,
    customers: users.filter(u => Number((u as any).id_rol) === 2).length,
    admins: users.filter(u => Number((u as any).id_rol) === 1).length,
    active: users.filter(u => (u as any).ind_activo).length,
    inactive: users.filter(u => !(u as any).ind_activo).length,
  }

  const handleExportComplete = (filename: string) => {
    toast.success(`¡Usuarios exportados exitosamente en ${filename}!`);
  };

  const columns: ColumnDef<User>[] = [
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
  ]

  const actions: ColumnDef<User>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Editar usuario"
            onClick={() => window.location.href = `/admin/users/${row.original.id_usuario}/edit`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          {row.original.ind_activo ? (
            <Button
              variant="destructive"
              size="icon"
              aria-label="Desactivar"
              onClick={() => toggleMutation.mutate({ id: row.original.id_usuario as unknown as number, active: false })}
            >
              <Power className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="icon"
              aria-label="Activar"
              onClick={() => toggleMutation.mutate({ id: row.original.id_usuario as unknown as number, active: true })}
            >
              <Power className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona todos los usuarios de tu plataforma
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{userStats.total}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{userStats.customers}</div>
            <p className="text-sm text-muted-foreground">Clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{userStats.admins}</div>
            <p className="text-sm text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{userStats.active}</div>
            <p className="text-sm text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{userStats.inactive}</div>
            <p className="text-sm text-muted-foreground">Inactivos</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Cargando usuarios...</div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="text-center py-12">
          <div className="text-red-600">No se pudieron cargar los usuarios.</div>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && !isError && users.length > 0 && (
        <DataTable 
          columns={[...columns, ...actions]} 
          data={users}
          pageSize={10}
        />
      )}

      {/* Empty State */}
      {!isLoading && !isError && users.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">No hay usuarios registrados</div>
        </div>
      )}
    </div>
  )
}

export default UsersPage