'use client'

import React from 'react'
import { Label } from '@/components/ui'
import { cn } from '@/lib/utils'
import { getHexForColorName } from '@/utils/color-map'
import type { AttributeValueSummary } from '@/services/category.service'

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
        <div className="flex flex-wrap gap-2">
          {values.map((v) => {
            const id = Number(v.id)
            const isSelected = numericValue !== undefined && id === numericValue
            const bg = v.hex_color ?? (isColorAttr ? getHexForColorName(v.value ?? '') : '#e5e7eb')
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
                title={v.value}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border-2 px-2 py-1 text-sm transition-colors',
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-transparent hover:border-gray-400 dark:hover:border-gray-500',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span
                  className="inline-block w-5 h-5 rounded-full shrink-0 border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: bg }}
                />
                <span>{v.value}</span>
              </button>
            )
          })}
        </div>
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

