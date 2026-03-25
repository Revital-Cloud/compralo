'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { useActivePointsRate, useAllUsersWithPoints } from '@/hooks/use-points'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui"
import { IconCoins, IconCalendar, IconCheck } from '@tabler/icons-react'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { CreatePointsConfigModal } from '@/components/admin/points/create-points-config-modal'
import { PointsStatsCards } from '@/components/admin/points/points-stats-cards'
import type { UserWithPoints } from '@/types/points'
import Link from 'next/link'
import { useAdminTour } from '../_tour/useAdminDriverTour'
import { searchMatches } from '@/utils/search-helpers'
import { AdminStatsRowSkeleton, AdminTableSkeleton } from '@/components/admin/skeletons'

const PointsPage = () => {
  const { data: activeRates } = useActivePointsRate()
  const { data: users = [], isLoading, isError } = useAllUsersWithPoints()
  const [openConfig, setOpenConfig] = useState(false)
  const [search, setSearch] = useState('')

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    return users.filter(
      (user) =>
        searchMatches(search, user.nom_usuario) ||
        searchMatches(search, user.ape_usuario) ||
        searchMatches(search, user.email_usuario)
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
      cell: ({ row }) => {
        const fullName = `${row.original.nom_usuario} ${row.original.ape_usuario}`.trim()
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-medium max-w-[220px] truncate block">
                {fullName}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {fullName}
            </TooltipContent>
          </Tooltip>
        )
      } 
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
        <Link
          href={`/admin/points/${row.original.id_usuario}?name=${encodeURIComponent(
            `${row.original.nom_usuario} ${row.original.ape_usuario}`
          )}`}
        >
          <Button 
            variant="outline" 
            size="sm"
          >
            Ver Historial
          </Button>
        </Link>
      ),
    },
  ]

  const activeRate = Array.isArray(activeRates) && activeRates.length > 0 ? activeRates[0] : null

  const formatDateSafe = (value: string | null | undefined): string => {
    if (value == null || value === '') return 'Sin fecha'
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? 'Sin fecha' : d.toLocaleDateString('es-CO')
  }

  const { startPointsTour } = useAdminTour()

  useEffect(() => {
    try {
      const seen = localStorage.getItem('revital_points_tour_seen')
      if (!seen) {
        startPointsTour()
        localStorage.setItem('revital_points_tour_seen', '1')
      }
    } catch {
      // ignore
    }
  }, [startPointsTour])

  return (
    <div className="space-y-6">
      <div data-tour-id="points-header">
        <CatalogHeader 
          title="Sistema de Puntos"
          description="Gestiona el programa de lealtad y consulta los puntos de tus usuarios"
          onCreateClick={() => setOpenConfig(true)}
          createLabel={activeRate ? 'Actualizar Configuración' : 'Nueva Configuración'}
          showImportButton={false}
        />
      </div>
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
                {formatDateSafe(activeRate.fec_inicio)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeRate.fec_fin
                  ? `Hasta: ${formatDateSafe(activeRate.fec_fin)}`
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
                Creado: {formatDateSafe(activeRate.fec_insert)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estadísticas de usuarios */}
      <div data-tour-id="points-stats">
        <PointsStatsCards users={users} />
      </div>

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
      {isLoading && (
        <div className="space-y-4">
          <AdminStatsRowSkeleton count={3} />
          <AdminTableSkeleton rows={10} />
        </div>
      )}
      {isError && <div className="text-sm text-red-600">No se pudieron cargar los usuarios.</div>}
      {!isLoading && !isError && Array.isArray(filteredUsers) && (
        <div data-tour-id="points-table">
          <DataTable 
            columns={[...columns, ...actions]} 
            data={filteredUsers} 
            pageSize={10} 
          />
        </div>
      )}
    </div>
  )
}

export default PointsPage

