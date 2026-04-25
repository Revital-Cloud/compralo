'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'
import {
  attributeService,
  type AttributeValue,
  type AttributeValueCreate,
  type AttributeValueUpdate,
} from '@/services/attribute.service'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Checkbox,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui'
import { Pencil, Trash2, ArrowLeft, Pipette, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { attributeValueSchema, type AttributeValueFormValues } from '@/schemas/admin/attribute.schema'
import { AdminDetailSkeleton } from "@/components/admin/skeletons"

const AttributeValuesPage = () => {
  const params = useParams()
  const router = useRouter()
  const attributeId = Number(params.id)
  const queryClient = useQueryClient()
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editing, setEditing] = useState<AttributeValue | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AttributeValue | null>(null)

  const { data: attribute, isLoading: loadingAttr } = useQuery({
    queryKey: ['attribute', attributeId],
    queryFn: () => attributeService.getById(attributeId),
    enabled: !Number.isNaN(attributeId),
  })

  const { data: values = [], isLoading: loadingValues } = useQuery({
    queryKey: ['attribute-values', attributeId],
    queryFn: () => attributeService.getValues(attributeId),
    enabled: !Number.isNaN(attributeId),
  })

  const createMutation = useMutation({
    mutationFn: (payload: AttributeValueCreate) => attributeService.createValue(attributeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attribute-values', attributeId] })
      setOpenCreate(false)
      toast.success('Valor creado correctamente')
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Error al crear el valor')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ valueId, payload }: { valueId: number; payload: AttributeValueUpdate }) =>
      attributeService.updateValue(attributeId, valueId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attribute-values', attributeId] })
      setOpenEdit(false)
      setEditing(null)
      toast.success('Valor actualizado correctamente')
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Error al actualizar el valor')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (valueId: number) => attributeService.deleteValue(attributeId, valueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attribute-values', attributeId] })
      setDeleteTarget(null)
      toast.success('Valor eliminado correctamente')
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Error al eliminar el valor')
    },
  })

  const hasPredefined = attribute?.has_predefined_values ?? false
  const sortedValues = [...values].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)

  const columns: ColumnDef<AttributeValue>[] = [
    { accessorKey: 'id', header: 'ID', cell: ({ row }) => <span className="text-muted-foreground">{row.original.id}</span> },
    { accessorKey: 'value', header: 'Valor', cell: ({ row }) => <span className="font-medium">{row.original.value}</span> },
    {
      accessorKey: 'hex_color',
      header: 'Color',
      cell: ({ row }) => {
        const hex = row.original.hex_color
        if (!hex) return <span className="text-muted-foreground">—</span>
        return (
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: hex }}
              title={hex}
            />
            <span className="text-muted-foreground text-sm">{hex}</span>
          </div>
        )
      },
    },
    { accessorKey: 'sort_order', header: 'Orden', cell: ({ row }) => row.original.sort_order },
    {
      accessorKey: 'is_active',
      header: 'Activo',
      cell: ({ row }) => (row.original.is_active ? 'Sí' : 'No'),
    },
  ]

  const actions: ColumnDef<AttributeValue>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
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

  if (Number.isNaN(attributeId)) {
    return (
      <div className="space-y-6">
        <p className="text-red-600">ID de atributo no válido.</p>
        <Button variant="outline" asChild>
          <Link href="/admin/attributes">Volver a Atributos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" aria-label="Volver" asChild>
          <Link href="/admin/attributes">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <CatalogHeader
            title={`Valores: ${attribute?.name ?? '…'}`}
            description="Valores predefinidos del atributo para variantes y swatches"
            onCreateClick={hasPredefined ? () => setOpenCreate(true) : undefined}
            createLabel="Agregar valor"
            showImportButton={false}
          />
        </div>
      </div>

      {!hasPredefined && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-200">
          Este atributo no usa valores predefinidos. Edita el atributo y activa &quot;Usa valores predefinidos&quot; para poder agregar valores aquí.
        </div>
      )}

      {loadingAttr || loadingValues ? (
        <AdminDetailSkeleton />
      ) : !attribute ? (
        <div className="text-sm text-red-600">Atributo no encontrado.</div>
      ) : values.length === 0 && hasPredefined ? (
        <EmptyState
          title="Sin valores"
          description="Agrega valores predefinidos para este atributo (ej. colores con HEX para swatches)."
          iconPath="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          primaryAction={
            <Button className="bg-[#fec806] hover:bg-[#e6b800] text-black" onClick={() => setOpenCreate(true)}>
              Agregar valor
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={[...columns, ...actions]}
          data={sortedValues}
          pageSize={10}
          getRowId={(row: AttributeValue) => String(row.id)}
        />
      )}

      <ValueModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="Nuevo valor"
        attributeName={attribute?.name ?? ''}
        defaultValues={{ value: '', hex_color: '', sort_order: 0, is_active: true }}
        onSubmit={(values) =>
          createMutation.mutate({
            value: values.value,
            hex_color: values.hex_color?.trim() || undefined,
            sort_order: values.sort_order,
            is_active: values.is_active,
          })
        }
        isSubmitting={createMutation.isPending}
      />

      <ValueModal
        open={openEdit}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
          setOpenEdit(open)
        }}
        title="Editar valor"
        attributeName={attribute?.name ?? ''}
        defaultValues={
          editing
            ? {
                value: editing.value,
                hex_color: editing.hex_color ?? '',
                sort_order: editing.sort_order,
                is_active: editing.is_active,
              }
            : { value: '', hex_color: '', sort_order: 0, is_active: true }
        }
        key={editing?.id}
        onSubmit={(values) =>
          editing &&
          updateMutation.mutate({
            valueId: editing.id,
            payload: {
              value: values.value,
              hex_color: values.hex_color?.trim() || undefined,
              sort_order: values.sort_order,
              is_active: values.is_active,
            },
          })
        }
        isSubmitting={updateMutation.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar valor?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el valor &quot;{deleteTarget?.value}&quot;. Si está en uso en variantes, la operación puede fallar.
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

const isColorAttribute = (name: string) => /color|colour|cor/i.test(name?.trim() ?? '')

function ValueModal({
  open,
  onOpenChange,
  title,
  attributeName,
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  attributeName: string
  defaultValues: AttributeValueFormValues
  onSubmit: (values: AttributeValueFormValues) => void
  isSubmitting: boolean
}) {
  const showHexField = isColorAttribute(attributeName)
  const colorInputRef = React.useRef<HTMLInputElement | null>(null)
  const form = useForm<AttributeValueFormValues>({
    resolver: zodResolver(attributeValueSchema) as Resolver<AttributeValueFormValues>,
    defaultValues,
  })
  const [draftHex, setDraftHex] = React.useState<string | null>(null)
  const hexRegister = form.register('hex_color')
  const watchedHex = form.watch('hex_color')?.trim() ?? ''
  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(watchedHex)
  const normalizedCurrentHex = isValidHex ? watchedHex.toUpperCase() : ''
  const normalizedDraftHex = draftHex?.toUpperCase() ?? null
  const hasPendingColor = !!normalizedDraftHex && normalizedDraftHex !== normalizedCurrentHex
  const iconHex = normalizedDraftHex ?? normalizedCurrentHex
  const previewHex = normalizedDraftHex ?? watchedHex
  const hasPreviewHex = /^#[0-9A-Fa-f]{6}$/.test(previewHex)
  const pickerValueCandidate = normalizedDraftHex ?? watchedHex
  const colorPickerValue = /^#[0-9A-Fa-f]{6}$/.test(pickerValueCandidate) ? pickerValueCandidate : '#000000'

  React.useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      setDraftHex(null)
    }
  }, [open, defaultValues.value, defaultValues.hex_color, defaultValues.sort_order, defaultValues.is_active, form])

  const handleSubmit = (values: AttributeValueFormValues) => {
    onSubmit({
      ...values,
      hex_color: showHexField ? values.hex_color?.trim() || undefined : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Formulario para crear o editar un valor de atributo, incluyendo color, orden y estado activo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="val-value">Valor</Label>
            <Input
              id="val-value"
              {...form.register('value')}
              placeholder={showHexField ? 'Ej. Negro' : 'Ej. S, M, L'}
            />
            {form.formState.errors.value && (
              <p className="text-sm text-red-600">{form.formState.errors.value.message}</p>
            )}
          </div>
          {showHexField && (
            <div className="space-y-2">
              <Label htmlFor="val-hex">Color (HEX)</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="val-hex"
                  {...hexRegister}
                  onChange={(e) => {
                    hexRegister.onChange(e)
                    setDraftHex(null)
                  }}
                  placeholder="#000000"
                  className="font-mono"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => colorInputRef.current?.click()}
                      className="h-9 w-9 shrink-0 rounded-md border border-input bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center"
                      aria-label="Seleccionar color"
                    >
                      <Pipette className="h-4 w-4" style={iconHex ? { color: iconHex } : undefined} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Seleccionar color</TooltipContent>
                </Tooltip>
                <input
                  ref={colorInputRef}
                  id="val-hex-picker"
                  type="color"
                  value={colorPickerValue}
                  onChange={(e) => setDraftHex(e.target.value.toUpperCase())}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                />
                {hasPendingColor && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (!normalizedDraftHex) return
                        form.setValue('hex_color', normalizedDraftHex, {
                          shouldDirty: true,
                          shouldValidate: true,
                          shouldTouch: true,
                        })
                        setDraftHex(null)
                      }}
                      className="h-9 w-9 shrink-0 rounded-md border border-emerald-500/60 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 inline-flex items-center justify-center"
                      aria-label="Aceptar color"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftHex(null)}
                      className="h-9 w-9 shrink-0 rounded-md border border-red-500/60 bg-red-500/10 text-red-600 hover:bg-red-500/20 inline-flex items-center justify-center"
                      aria-label="Cancelar color"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}
                {hasPreviewHex && (
                  <span
                    className="inline-block w-8 h-8 rounded border border-gray-300 dark:border-gray-600 shrink-0"
                    style={{ backgroundColor: previewHex }}
                    title={previewHex}
                  />
                )}
              </div>
              {form.formState.errors.hex_color && (
                <p className="text-sm text-red-600">{form.formState.errors.hex_color.message}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="val-sort">Orden</Label>
            <Input id="val-sort" type="number" min={0} {...form.register('sort_order')} />
            {form.formState.errors.sort_order && (
              <p className="text-sm text-red-600">{form.formState.errors.sort_order.message}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="val-active"
              checked={form.watch('is_active') ?? true}
              onCheckedChange={(checked) => form.setValue('is_active', !!checked)}
            />
            <Label htmlFor="val-active" className="cursor-pointer">
              Activo
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

export default AttributeValuesPage
