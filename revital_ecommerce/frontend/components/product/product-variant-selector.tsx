"use client"

import { cn } from "@/lib/utils"
import { getHexForColorName } from "@/utils/color-map"
import type { AttributeDefinition } from "@/types/product"

interface ProductVariantSelectorProps {
  attributeDefinitions: AttributeDefinition[]
  selectedAttributes: Record<string, string | null>
  /** value: string para seleccionar, null para deseleccionar (clic en la opción ya seleccionada). */
  onSelectAttribute: (attrName: string, value: string | null) => void
  isOptionAvailable: (attrName: string, attrValue: string) => boolean
}

function isLightHex(hex: string): boolean {
  const h = hex.replace("#", "")
  if (h.length < 6) return false
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7
}

export default function ProductVariantSelector({
  attributeDefinitions,
  selectedAttributes,
  onSelectAttribute,
  isOptionAvailable,
}: ProductVariantSelectorProps) {
  if (attributeDefinitions.length === 0) return null

  return (
    <div className="space-y-6">
      {attributeDefinitions.map((attr) => {
        const rawName = (attr.name ?? "").trim()
        const isColorAttr = rawName.toLowerCase() === "color"
        const hasHexSwatches = attr.values.some((v) => !!v.hex_color)
        // Solo tratamos como "color" real si hay hex_color en al menos uno de los valores.
        const hasColorSwatches = isColorAttr && hasHexSwatches
        const title =
          rawName && !(isColorAttr && !hasColorSwatches)
            ? rawName
            : "Opciones"
        const selectedValue = selectedAttributes[attr.name] ?? null
        const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase()

        return (
          <div key={attr.name} className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {title.toUpperCase()}
            </h3>
            {attr.values.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay opciones disponibles</p>
            ) : hasColorSwatches ? (
              <div className="flex gap-2 flex-wrap">
                {attr.values.map((val) => {
                  const available = isOptionAvailable(attr.name, val.value)
                  const selected = norm(selectedValue) === norm(val.value)
                  const hex = val.hex_color ?? (isColorAttr ? getHexForColorName(val.value ?? "") : undefined)
                  const isLight = hex ? isLightHex(hex) : false
                  return (
                    <button
                      key={val.value}
                      type="button"
                      onClick={() => {
                        if (selected) onSelectAttribute(attr.name, null)
                        else if (available) onSelectAttribute(attr.name, val.value)
                      }}
                      disabled={!available && !selected}
                      aria-pressed={selected}
                      aria-disabled={!available && !selected}
                      title={val.value}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all shrink-0",
                        selected && "scale-110",
                        selected && isLight && "border-gray-900 dark:border-white",
                        selected && !isLight && "border-white dark:border-gray-200",
                        !selected && "border-gray-300 dark:border-gray-600",
                        !available && !selected && "opacity-40 cursor-not-allowed"
                      )}
                      style={{ backgroundColor: hex ?? "transparent" }}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {attr.values.map((val) => {
                  const available = isOptionAvailable(attr.name, val.value)
                  const selected = norm(selectedValue) === norm(val.value)
                  return (
                    <button
                      key={val.value}
                      type="button"
                      onClick={() => {
                        if (selected) onSelectAttribute(attr.name, null)
                        else if (available) onSelectAttribute(attr.name, val.value)
                      }}
                      disabled={!available && !selected}
                      aria-pressed={selected}
                      aria-disabled={!available && !selected}
                      className={cn(
                        "py-2 px-2 sm:px-3 border rounded-md text-xs sm:text-sm font-medium transition-colors",
                        selected
                          ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-black"
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
                        !available && !selected && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {val.value}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
