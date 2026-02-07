'use client'

import React, { useState, useEffect } from 'react'
import { 
  ColorPicker as AriaColorPicker, 
  DialogTrigger,
  Popover as AriaPopover,
  Dialog as AriaDialog,
  Button as AriaButton,
  parseColor, 
  type Color 
} from 'react-aria-components'
import { ColorArea } from './color-picker/ColorArea'
import { ColorSlider } from './color-picker/ColorSlider'
import { ColorField } from './color-picker/ColorField'
import { ColorSwatch } from './color-picker/ColorSwatch'
import { Label, Input, Button as UIButton } from '@/components/ui'
import { cn } from '@/lib/utils'
import './color-picker/color-picker.css'

export interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
  placeholder?: string
}

export function ColorPicker({ value, onChange, label, placeholder = '#000000 o nombre CSS' }: ColorPickerProps) {
  const [textValue, setTextValue] = useState(value || '')
  
  // Sincronizar textValue con value cuando cambia externamente
  useEffect(() => {
    setTextValue(value || '')
  }, [value])

  // Convertir string a Color object para react-aria-components
  const colorValue = React.useMemo(() => {
    if (!value) return parseColor('#000000')
    try {
      return parseColor(value)
    } catch {
      return parseColor('#000000')
    }
  }, [value])

  const handleColorChange = (color: Color) => {
    // Convertir Color object a string hex
    const hex = color.toString('hex')
    onChange(hex)
    setTextValue(hex)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setTextValue(newValue)
    // Intentar parsear y actualizar si es válido
    try {
      const parsed = parseColor(newValue)
      onChange(parsed.toString('hex'))
    } catch {
      // Si no es válido, solo actualizar el texto (permite escribir)
      onChange(newValue)
    }
  }

  const handleClear = () => {
    onChange('')
    setTextValue('')
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <AriaColorPicker value={colorValue} onChange={handleColorChange}>
          <DialogTrigger>
            <AriaButton
              className="h-10 w-16 border-2 rounded-md p-0 flex items-center justify-center flex-shrink-0 bg-transparent hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              style={{
                backgroundColor: value || '#ffffff',
                borderColor: value ? 'transparent' : 'hsl(var(--border))',
                borderStyle: 'solid',
              }}
            >
              <ColorSwatch />
            </AriaButton>
            <AriaPopover 
              placement="bottom start"
              className="z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[entering]:animate-in data-[exiting]:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95 data-[entering]:zoom-in-95"
            >
              <AriaDialog className="flex flex-col gap-3 p-4 outline-none" style={{ minWidth: '240px' }}>
                <ColorArea
                  colorSpace="hsb"
                  xChannel="saturation"
                  yChannel="brightness"
                />
                <ColorSlider colorSpace="hsb" channel="hue" />
                <ColorField label="Hex" />
              </AriaDialog>
            </AriaPopover>
          </DialogTrigger>
        </AriaColorPicker>

        {/* Input de texto para valores personalizados */}
        <Input
          type="text"
          value={textValue}
          onChange={handleTextChange}
          placeholder={placeholder}
          className="flex-1"
        />

        {/* Botón limpiar (sin cuadrado de preview extra) */}
        {value && (
          <UIButton
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="h-10 w-10 p-0 flex-shrink-0"
            title="Limpiar"
          >
            ✕
          </UIButton>
        )}
      </div>
    </div>
  )
}
