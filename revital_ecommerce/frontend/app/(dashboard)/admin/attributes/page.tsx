'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'
import { attributeService, type Attribute, type AttributeCreate } from '@/services/attribute.service'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui'
import { Pencil, Trash2, List } from 'lucide-react'
import Link from 'next/link'
import { UniversalFilters } from '@/components/ui'
import { toast } from 'sonner'
import { useAdminTour } from '../_tour/useAdminDriverTour'
import { searchMatches } from '@/utils/search-helpers'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { attributeSchema, type AttributeFormValues } from '@/schemas/admin/attribute.schema'
import { AdminFiltersSkeleton, AdminTableSkeleton } from '@/components/admin/skeletons'

const DATA_TYPES = ['text', 'number', 'boolean'] as const

const AttributesPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => attributeService.getAll(),
  })
  const [search, setSearch] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editing, setEditing] = useState<Attribute | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Attribute | null>(null)
  const { startAttributesTour } = useAdminTour()

  useEffect(() => {
    try {
      const seen = localStorage.getItem('revital_attributes_tour_seen')
      if (!seen) {
        startAttributesTour()
        localStorage.setItem('revital_attributes_tour_seen', '1')
      }
    } catch {
      // ignore
    }
  }, [startAttributesTour])

  const clearFilters = () => setSearch('')

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return []
    let rows = data
    if (search.trim()) {
      rows = rows.filter((r) => searchMatches(search, r.name))
    }
    return [...rows].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [data, search])

  const createMutation = useMutation({
    mutationFn: (payload: AttributeCreate) => attributeService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] })
      setOpenCreate(false)
      toast.success('Atributo creado correctamente')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Error al crear el atributo')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: { name?: string; data_type?: 'text' | 'number' | 'boolean'; has_predefined_values?: boolean }
    }) => attributeService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] })
      setOpenEdit(false)
      setEditing(null)
      toast.success('Atributo actualizado correctamente')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Error al actualizar el atributo')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => attributeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] })
      setDeleteTarget(null)
      toast.success('Atributo eliminado correctamente')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Error al eliminar el atributo')
    },
  })

  const columns: ColumnDef<Attribute>[] = [
    { accessorKey: 'id', header: 'ID', cell: ({ row }) => <span className="text-muted-foreground">{row.original.id}</span> },
    { accessorKey: 'name', header: 'Nombre', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    {
      accessorKey: 'data_type',
      header: 'Tipo de dato',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.data_type === 'text' ? 'Texto' : row.original.data_type === 'number' ? 'Número' : 'Booleano'}
        </span>
      ),
    },
    {
      accessorKey: 'has_predefined_values',
      header: 'Valores predef.',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.has_predefined_values ? 'Sí' : 'No'}
        </span>
      ),
    },
  ]

  const actions: ColumnDef<Attribute>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.has_predefined_values && (
            <Button variant="outline" size="icon" aria-label="Valores" asChild>
              <Link href={`/admin/attributes/${row.original.id}/values`}>
                <List className="w-4 h-4" />
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            aria-label="Editar"
            onClick={() => {
              setEditing(row.original)
              setOpenEdit(true)
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Eliminar"
            onClick={() => setDeleteTarget(row.original)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div data-tour-id="attributes-header">
        <CatalogHeader
          title="Atributos"
          description="Catálogo de atributos para categorías y variantes de producto"
          onCreateClick={() => setOpenCreate(true)}
          createLabel="Agregar Atributo"
          showImportButton={false}
        />
      </div>

      <div data-tour-id="attributes-filters">
        <AttributesFilters
          search={search}
          onSearchChange={setSearch}
          onClearFilters={clearFilters}
          totalResults={filteredData.length}
        />
      </div>

      {isLoading && (
        <div className="space-y-4">
          <AdminFiltersSkeleton />
          <AdminTableSkeleton rows={8} />
        </div>
      )}
      {isError && <div className="text-sm text-red-600">No se pudieron cargar los atributos.</div>}

      {!isLoading && !isError && Array.isArray(data) && data.length === 0 && (
        <EmptyState
          title="Aún no tienes atributos"
          description="Crea atributos para asociarlos a categorías y usarlos en variantes de producto."
          iconPath="M12 6l-2 4-4 .5 3 3-.8 4.5L12 16l3.8 2-1-4.5 3-3-4-.5L12 6z"
          primaryAction={
            <Button className="bg-[#fec806] hover:bg-[#e6b800] text-black" onClick={() => setOpenCreate(true)}>
              Agregar Atributo
            </Button>
          }
        />
      )}

      {!isLoading && !isError && filteredData.length > 0 && (
        <div data-tour-id="attributes-table">
          <DataTable
            columns={[...columns, ...actions]}
            data={filteredData}
            pageSize={10}
            getRowId={(row: Attribute) => String(row.id)}
          />
        </div>
      )}

      <AttributeModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="Nuevo atributo"
        defaultValues={{ name: '', data_type: undefined, has_predefined_values: false }}
        onSubmit={(values) =>
          createMutation.mutate({
            name: values.name,
            data_type: values.data_type,
            has_predefined_values: values.has_predefined_values,
          })
        }
        isSubmitting={createMutation.isPending}
      />

      <AttributeModal
        open={openEdit}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
          setOpenEdit(open)
        }}
        title="Editar atributo"
        defaultValues={
          editing
            ? { name: editing.name, data_type: editing.data_type, has_predefined_values: editing.has_predefined_values ?? false }
            : { name: '', data_type: undefined, has_predefined_values: false }
        }
        key={editing?.id}
        onSubmit={(values) =>
          editing &&
          updateMutation.mutate({
            id: editing.id,
            payload: {
              name: values.name,
              data_type: values.data_type,
              has_predefined_values: values.has_predefined_values,
            },
          })
        }
        isSubmitting={updateMutation.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar atributo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el atributo &quot;{deleteTarget?.name}&quot;. Si está asociado a categorías o variantes, la operación puede fallar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AttributesFilters({
  search,
  onSearchChange,
  onClearFilters,
  totalResults,
}: {
  search: string
  onSearchChange: (v: string) => void
  onClearFilters: () => void
  totalResults: number
}) {
  const hasActiveFilters = !!search
  return (
    <UniversalFilters
      title="Filtros de Atributos"
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar atributo..."
      filters={[]}
      sortOptions={[]}
      totalResults={totalResults}
      onClearFilters={onClearFilters}
      hasActiveFilters={hasActiveFilters}
      showStockBadges={false}
      showTotalResults={true}
      compact={true}
    />
  )
}

function AttributeModal({
  open,
  onOpenChange,
  title,
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  defaultValues: { name: string; data_type?: 'text' | 'number' | 'boolean'; has_predefined_values?: boolean }
  onSubmit: (values: AttributeFormValues) => void
  isSubmitting: boolean
}) {
  const form = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeSchema) as Resolver<AttributeFormValues>,
    mode: 'onTouched',
    defaultValues: {
      name: defaultValues.name,
      data_type: defaultValues.data_type,
      has_predefined_values: defaultValues.has_predefined_values ?? false,
    },
  })
  React.useEffect(() => {
    if (open)
      form.reset({
        name: defaultValues.name,
        data_type: defaultValues.data_type,
        has_predefined_values: defaultValues.has_predefined_values ?? false,
      })
  }, [open, defaultValues.name, defaultValues.data_type, defaultValues.has_predefined_values, form])

  const handleSubmit = form.handleSubmit((values) => onSubmit(values as AttributeFormValues))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="attr-name">
              Nombre <span className="text-red-500" aria-hidden>*</span>
            </Label>
            <Input
              id="attr-name"
              {...form.register('name')}
              placeholder="Ej. Color"
              required
              aria-required="true"
              aria-invalid={!!form.formState.errors.name}
              aria-describedby={form.formState.errors.name ? 'attr-name-error' : undefined}
            />
            {form.formState.errors.name && (
              <p id="attr-name-error" className="text-sm text-red-600" role="alert">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Tipo de dato</Label>
            <Select
              value={form.watch('data_type') ?? ''}
              onValueChange={(v) => form.setValue('data_type', v as 'text' | 'number' | 'boolean')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione tipo" />
              </SelectTrigger>
              <SelectContent>
                {DATA_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === 'text' ? 'Texto' : t === 'number' ? 'Número' : 'Booleano'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.data_type && (
              <p className="text-sm text-red-600">{form.formState.errors.data_type.message}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="attr-has-predefined"
              checked={form.watch('has_predefined_values') ?? false}
              onCheckedChange={(checked) => form.setValue('has_predefined_values', !!checked)}
            />
            <Label htmlFor="attr-has-predefined" className="cursor-pointer font-normal">
              Usa valores predefinidos
            </Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#fec806] hover:bg-[#e6b800] text-black">
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AttributesPage
