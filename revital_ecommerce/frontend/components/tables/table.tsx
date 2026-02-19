import React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  Row,
  PaginationState,
} from '@tanstack/react-table'
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui"
import { Button } from "@/components/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

export type GenericTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  /** Opciones para el select "Filas por página". Si no se pasa, se usa [5, 10, 20, 50] */
  pageSizeOptions?: number[]
  className?: string
  /** Contenido a mostrar cuando no hay filas (se renderiza dentro del tbody). */
  emptyMessage?: React.ReactNode
  actions?: (row: Row<TData>) => React.ReactNode
  actionsHeader?: React.ReactNode
  /** Clave única por fila (evita duplicados cuando id_linea/id_sublinea se repiten por categoría) */
  getRowId?: (row: TData) => string
  /** Paginación en servidor: los datos ya son la página actual, total de páginas y página actual vienen de fuera */
  manualPagination?: boolean
  /** Total de páginas (solo con manualPagination) */
  pageCount?: number
  /** Índice de página actual 0-based (solo con manualPagination) */
  pageIndex?: number
  /** Al cambiar de página (solo con manualPagination); recibe índice 0-based */
  onPageChange?: (pageIndex: number) => void
  /** Al cambiar tamaño de página (solo con manualPagination) */
  onPageSizeChange?: (pageSize: number) => void
}

function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
  emptyMessage = 'No hay datos disponibles',
  actions,
  actionsHeader = 'Acciones',
  getRowId,
  manualPagination = false,
  pageCount: controlledPageCount,
  pageIndex: controlledPageIndex = 0,
  onPageChange,
  onPageSizeChange,
}: GenericTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })

  const pagination = manualPagination
    ? { pageIndex: controlledPageIndex, pageSize }
    : internalPagination

  const table = useReactTable({
    data,
    columns,
    getRowId: getRowId as (row: TData, index: number) => string,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: manualPagination ? undefined : (updater) => {
      setInternalPagination((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : prev
        return next ?? prev
      })
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(manualPagination
      ? { manualPagination: true, pageCount: controlledPageCount ?? 1 }
      : { getPaginationRowModel: getPaginationRowModel() }),
  })

  return (
    <div className={cn('w-full space-y-3', className)}>
      <UITable>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          header.column.getCanSort() && 'cursor-pointer select-none'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getIsSorted() === 'asc' && (
                          <span className="ml-1">↑</span>
                        )}
                        {header.column.getIsSorted() === 'desc' && (
                          <span className="ml-1">↓</span>
                        )}
                      </div>
                    )}
                  </TableHead>
                )
              })}
              {actions ? (
                <TableHead>{actionsHeader}</TableHead>
              ) : null}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
                {actions ? (
                  <TableCell>{actions(row)}</TableCell>
                ) : null}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </UITable>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Filas por página</span>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(v) => {
              const size = Number(v)
              if (manualPagination && onPageSizeChange) {
                onPageSizeChange(size)
              } else {
                table.setPageSize(size)
                table.setPageIndex(0)
              }
            }}
          >
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (manualPagination && onPageChange) {
                onPageChange(table.getState().pagination.pageIndex - 1)
              } else {
                table.previousPage()
              }
            }}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="mr-1" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (manualPagination && onPageChange) {
                onPageChange(table.getState().pagination.pageIndex + 1)
              } else {
                table.nextPage()
              }
            }}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
            <ChevronRight className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DataTable
