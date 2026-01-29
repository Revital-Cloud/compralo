'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Pencil, Power, Eye } from 'lucide-react'

export interface Discount {
  id_descuento: number
  nom_descuento: string
  des_descuento: string
  tipo_calculo: boolean // true = porcentaje, false = monto fijo
  val_porce_descuento: number
  val_monto_descuento: number
  aplica_a: string
  codigo_descuento?: string
  costo_puntos_canje?: number
  ind_activo: boolean
  max_usos_total?: number
  usos_actuales_total: number
  fec_inicio?: string
  fec_fin?: string
  min_valor_pedido: number
  ind_canjeable_puntos: boolean
  solo_primera_compra: boolean
  requiere_codigo: boolean
  fec_insert?: string
}

interface UseDiscountColumnsProps {
  onViewExchanges: (id: string, name: string) => void
  onEdit: (discount: any) => void
  onToggleStatus: (id: string, activate: boolean) => void
  isToggling?: boolean
}

export const useDiscountColumns = ({
  onViewExchanges,
  onEdit,
  onToggleStatus,
  isToggling = false
}: UseDiscountColumnsProps) => {
  const columns: ColumnDef<Discount>[] = [
    {
      accessorKey: 'id_descuento',
      header: 'ID',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.id_descuento}</span>,
    },
    {
      accessorKey: 'nom_descuento',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-medium">{row.original.nom_descuento}</span>,
    },
    {
      accessorKey: 'tipo_calculo',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.tipo_calculo === true ? 'Porcentaje' : 'Monto Fijo'}
        </Badge>
      ),
    },
    {
      accessorKey: 'valor',
      header: 'Valor',
      cell: ({ row }) => {
        const valor = row.original.tipo_calculo === true 
          ? row.original.val_porce_descuento 
          : row.original.val_monto_descuento
        
        return (
          <span className="font-semibold text-green-600">
            {row.original.tipo_calculo === true
              ? `${valor}%` 
              : `$${valor.toLocaleString('es-CO')}`
            }
          </span>
        )
      },
    },
    {
      accessorKey: 'codigo_descuento',
      header: 'Código',
      cell: ({ row }) => (
        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
          {row.original.codigo_descuento || '-'}
        </code>
      ),
    },
    {
      accessorKey: 'costo_puntos_canje',
      header: 'Puntos',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.costo_puntos_canje ? `${row.original.costo_puntos_canje} pts` : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'usos',
      header: 'Usos',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.usos_actuales_total} / {row.original.max_usos_total || '∞'}
        </span>
      ),
    },
    {
      accessorKey: 'ind_activo',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = !!row.original.ind_activo;
        return (
          <span className={isActive ? 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#fec806] text-black' : 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-600 text-white'}>
            {isActive ? 'Activo' : 'Inactivo'}
          </span>
        );
      },
    },
  ]

  const actions: ColumnDef<Discount>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            aria-label="Ver canjes"
            onClick={() => onViewExchanges(
              String(row.original.id_descuento),
              row.original.nom_descuento
            )}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            aria-label="Editar descuento"
            onClick={() => onEdit({ ...row.original, id_descuento: String(row.original.id_descuento) })}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant={row.original.ind_activo ? "default" : "destructive"}
            size="icon"
            aria-label={row.original.ind_activo ? "Desactivar descuento" : "Activar descuento"}
            onClick={() => onToggleStatus(String(row.original.id_descuento), !row.original.ind_activo)}
            disabled={isToggling}
            className={row.original.ind_activo ? "bg-green-600 hover:bg-green-700 text-white" : ""}
          >
            <Power className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  return [...columns, ...actions]
}

