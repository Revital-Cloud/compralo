'use client'

import React, { useMemo, useState } from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { useActivePointsRate } from '@/hooks/use-points'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconCoins, IconCalendar, IconCheck } from '@tabler/icons-react'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { CreatePointsConfigModal } from '@/components/admin/points/create-points-config-modal'
import userService from '@/services/user.service'
import { useQuery } from '@tanstack/react-query'

const PointsPage = () => {
  const { data: activeRates } = useActivePointsRate()
  const [openConfig, setOpenConfig] = useState(false)

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['users', 'all-for-points'],
    queryFn: () => userService.getUsers(),
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'id_usuario', header: 'ID', cell: ({ row }) => <span className="text-muted-foreground">{row.original.id_usuario}</span> },
    { accessorKey: 'nom_usuario', header: 'Nombre', cell: ({ row }) => <span className="font-medium">{row.original.nom_usuario} {row.original.ape_usuario}</span> },
    { accessorKey: 'email_usuario', header: 'Email' },
    { accessorKey: 'cel_usuario', header: 'Teléfono', cell: ({ row }) => <span className="text-sm">{row.original.cel_usuario || '-'}</span> },
    { id: 'puntos', header: 'Puntos', cell: ({ row }) => <span className="font-semibold">-</span> },
    { accessorKey: 'ind_activo', header: 'Estado', cell: ({ row }) => (<Badge className={row.original.ind_activo ? 'bg-[#fec806] text-black' : 'bg-red-100 text-red-800'}>{row.original.ind_activo ? 'Activo' : 'Inactivo'}</Badge>) },
  ]

  const rows = useMemo(() => Array.isArray(users) ? users : [], [users])

  const activeRate = Array.isArray(activeRates) && activeRates.length > 0 ? activeRates[0] : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (activeRate) {
        await updateMutation.mutateAsync({
          id: activeRate.id_config_puntos,
          data: formData,
        })
        toast.success('Configuración actualizada exitosamente')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Configuración creada exitosamente')
      }
      
      // Limpiar formulario
      setFormData({
        pesos_por_punto: '',
        puntos_por_peso: '',
        fec_inicio: '',
        fec_fin: '',
        ind_activo: true,
      })
    } catch (error) {
      toast.error('Error al guardar la configuración')
    }
  }

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

      {/* Tabla de usuarios con puntos */}
      {isLoading && <div className="text-sm text-muted-foreground">Cargando usuarios...</div>}
      {isError && <div className="text-sm text-red-600">No se pudieron cargar los usuarios.</div>}
      {!isLoading && !isError && Array.isArray(rows) && (
        <DataTable columns={columns} data={rows} pageSize={10} />
      )}

      {isLoading && (
        <div className="text-sm text-muted-foreground">Cargando configuración...</div>
      )}

      {isError && (
        <div className="text-sm text-red-600">No se pudo cargar la configuración de puntos.</div>
      )}
    </div>
  )
}

export default PointsPage

