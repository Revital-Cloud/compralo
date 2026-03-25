'use client'

import React from 'react'
import { Label, Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui'
import { cn } from '@/lib/utils'
import { getHexForColorName } from '@/utils/color-map'
import type { AttributeValueSummary } from '@/services/category.service'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check } from 'lucide-react'

export interface AttributeValueSelectProps {
  name: string
  values: AttributeValueSummary[]
  value: number | undefined
  onChange: (attributeValueId: number) => void
  required?: boolean
  disabled?: boolean
}

/**
 * Selector de valor predefinido: círculos de color cuando hay hex_color, sino opciones de texto.
 */
export function AttributeValueSelect({
  name,
  values,
  value,
  onChange,
  required,
  disabled,
}: AttributeValueSelectProps) {
  const isColorAttr = (name ?? '').trim().toLowerCase() === 'color'
  const hasHex = values.some((v) => v.hex_color || (isColorAttr && (v.value ?? '').trim()))
  const numericValue = value !== undefined && value !== null ? Number(value) : undefined
  const safeNumericValue = numericValue != null && !Number.isNaN(numericValue) ? numericValue : undefined

  // En algunos casos el valor puede venir como string/number; comparamos por string para evitar mismatches.
  const selectedItem = safeNumericValue != null ? values.find((v) => String(v.id) === String(safeNumericValue)) : undefined
  const circleBg =
    selectedItem?.hex_color ??
    (isColorAttr ? getHexForColorName(selectedItem?.value ?? '') : undefined) ??
    '#9ca3af'

  if (values.length === 0) {
    return (
      <div className="space-y-1">
        <Label className="text-muted-foreground">{name}{required && ' *'}</Label>
        <p className="text-xs text-muted-foreground">Sin valores definidos. Agrega valores en Atributos → Valores.</p>
      </div>
    )
  }

  const handleSelect = (v: AttributeValueSummary) => {
    const id = Number(v.id)
    if (!Number.isNaN(id)) onChange(id)
  }

  if (hasHex) {
    return (
      <div className="space-y-2">
        <Label className={cn(required && 'text-foreground')}>
          {name}
          {required && ' *'}
        </Label>
        <Select
          value={safeNumericValue != null ? String(safeNumericValue) : undefined}
          onValueChange={(v) => onChange(Number(v))}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              {safeNumericValue != null ? (
                <span
                  className="inline-block w-5 h-5 rounded-full shrink-0 border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: circleBg }}
                  aria-hidden
                />
              ) : null}
              <SelectValue placeholder="Selecciona una opción" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {values.map((v) => {
              const bg = v.hex_color ?? (isColorAttr ? getHexForColorName(v.value ?? '') : '#e5e7eb')
              return (
                <SelectPrimitive.Item
                  key={v.id}
                  value={String(v.id)}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pe-2 ps-8 text-sm outline-none',
                    'focus:bg-accent focus:text-accent-foreground',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                  )}
                >
                  <span className="absolute start-2 flex size-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4" />
                    </SelectPrimitive.ItemIndicator>
                  </span>

                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-4 h-4 rounded-full shrink-0 border border-gray-300 dark:border-gray-600"
                      aria-hidden
                      style={{ backgroundColor: bg }}
                    />
                    <SelectPrimitive.ItemText>{v.value}</SelectPrimitive.ItemText>
                  </div>
                </SelectPrimitive.Item>
              )
            })}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label className={cn(required && 'text-foreground')}>
        {name}
        {required && ' *'}
      </Label>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => {
          const id = Number(v.id)
          const isSelected = numericValue !== undefined && id === numericValue
          return (
            <button
              key={v.id}
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSelect(v)
              }}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm transition-colors',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {v.value}
            </button>
          )
        })}
      </div>
    </div>
  )
}

