'use client'

import React, { useMemo, useState } from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { useActivePointsRate, useAllUsersWithPoints } from '@/hooks/use-points'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconCoins, IconCalendar, IconCheck } from '@tabler/icons-react'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { CreatePointsConfigModal } from '@/components/admin/points/create-points-config-modal'
import { PointsStatsCards } from '@/components/admin/points/points-stats-cards'
import { UserPointsHistoryModal } from '@/components/admin/points/user-points-history-modal'
import { Input } from '@/components/ui/input'
import type { UserWithPoints } from '@/types/points'

const PointsPage = () => {
  const { data: activeRates } = useActivePointsRate()
  const { data: users = [], isLoading, isError } = useAllUsersWithPoints()
  const [openConfig, setOpenConfig] = useState(false)
  const [openHistory, setOpenHistory] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null)
  const [search, setSearch] = useState('')

  const filteredUsers = useMemo(() => {
    if (!search) return users
    const q = search.toLowerCase()
    return users.filter(user => 
      user.nom_usuario.toLowerCase().includes(q) ||
      user.ape_usuario.toLowerCase().includes(q) ||
      user.email_usuario.toLowerCase().includes(q)
    )
  }, [users, search])

  const columns: ColumnDef<UserWithPoints>[] = [
    { 
      accessorKey: 'id_usuario', 
      header: 'ID', 
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.id_usuario}</span> 
    },
    { 
      accessorKey: 'nom_usuario', 
      header: 'Nombre', 
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.nom_usuario} {row.original.ape_usuario}
        </span>
      ) 
    },
    { 
      accessorKey: 'email_usuario', 
      header: 'Email' 
    },
    { 
      accessorKey: 'cel_usuario', 
      header: 'Teléfono', 
      cell: ({ row }) => <span className="text-sm">{row.original.cel_usuario || '-'}</span> 
    },
    { 
      id: 'puntos_disponibles', 
      header: 'Puntos Disponibles', 
      cell: ({ row }) => (
        <span className="font-semibold text-blue-600">
          {row.original.puntos_disponibles.toLocaleString()}
        </span>
      ) 
    },
    { 
      id: 'puntos_totales_ganados', 
      header: 'Total Ganados', 
      cell: ({ row }) => (
        <span className="text-sm text-green-600">
          {row.original.puntos_totales_ganados.toLocaleString()}
        </span>
      ) 
    },
    { 
      id: 'puntos_totales_canjeados', 
      header: 'Total Canjeados', 
      cell: ({ row }) => (
        <span className="text-sm text-orange-600">
          {row.original.puntos_totales_canjeados.toLocaleString()}
        </span>
      ) 
    },
    { 
      id: 'fec_ultimo_canje', 
      header: 'Último Canje', 
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.fec_ultimo_canje 
            ? new Date(row.original.fec_ultimo_canje).toLocaleDateString('es-CO')
            : '-'
          }
        </span>
      ) 
    },
    { 
      accessorKey: 'ind_activo', 
      header: 'Estado', 
      cell: ({ row }) => (
        <Badge className={row.original.ind_activo ? 'bg-[#fec806] text-black' : 'bg-red-100 text-red-800'}>
          {row.original.ind_activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ) 
    },
  ]

  const actions: ColumnDef<UserWithPoints>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setSelectedUser({
              id: row.original.id_usuario,
              name: `${row.original.nom_usuario} ${row.original.ape_usuario}`
            })
            setOpenHistory(true)
          }}
        >
          Ver Historial
        </Button>
      ),
    },
  ]

  const activeRate = Array.isArray(activeRates) && activeRates.length > 0 ? activeRates[0] : null

  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Sistema de Puntos"
        description="Gestiona el programa de lealtad y consulta los puntos de tus usuarios"
        onCreateClick={() => setOpenConfig(true)}
        createLabel={activeRate ? 'Actualizar Configuración' : 'Nueva Configuración'}
      />
      <CreatePointsConfigModal open={openConfig} onOpenChange={setOpenConfig} />

      {/* Estadísticas actuales */}
      {activeRate && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa Actual</CardTitle>
              <IconCoins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${activeRate.pesos_por_punto} = 1 punto
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                1 punto = ${activeRate.puntos_por_peso}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fecha de Inicio</CardTitle>
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(activeRate.fec_inicio).toLocaleDateString('es-CO')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeRate.fec_fin 
                  ? `Hasta: ${new Date(activeRate.fec_fin).toLocaleDateString('es-CO')}`
                  : 'Sin fecha de fin'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <IconCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge className={activeRate.ind_activo ? 'bg-[#fec806] text-black' : 'bg-red-100 text-red-800'}>
                {activeRate.ind_activo ? 'Activo' : 'Inactivo'}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Creado: {new Date(activeRate.fec_insert || '').toLocaleDateString('es-CO')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estadísticas de usuarios */}
      <PointsStatsCards users={users} />

      {/* Búsqueda */}
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Tabla de usuarios con puntos */}
      {isLoading && <div className="text-sm text-muted-foreground">Cargando usuarios...</div>}
      {isError && <div className="text-sm text-red-600">No se pudieron cargar los usuarios.</div>}
      {!isLoading && !isError && Array.isArray(filteredUsers) && (
        <DataTable 
          columns={[...columns, ...actions]} 
          data={filteredUsers} 
          pageSize={10} 
        />
      )}

      {/* Modal de historial */}
      {selectedUser && (
        <UserPointsHistoryModal
          open={openHistory}
          onOpenChange={setOpenHistory}
          userId={selectedUser.id}
          userName={selectedUser.name}
        />
      )}
    </div>
  )
}

export default PointsPage

