"use client"

import { useState, useMemo, useCallback, useLayoutEffect } from "react"
import type { ProductDetailForSelector } from "@/types/product"
import {
  getValidVariants,
  findExactVariant,
  isOptionAvailable as isOptionAvailableHelper,
} from "@/lib/variant-selector-helpers"

/**
 * Hook para selector de variantes en detalle de producto.
 *
 * Funciones:
 * - Mantener atributos seleccionados por nombre.
 * - Calcular opciones válidas según selección parcial.
 * - Resolver variante exacta solo cuando están completos los atributos requeridos.
 */

const EMPTY_SELECTION: Record<string, string | null> = {}

export function useVariantSelector(
  product: ProductDetailForSelector | null | undefined,
  /** Slug del producto: al cambiar (nueva página) se resetea la selección. */
  slug?: string
) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string | null>>(EMPTY_SELECTION)

  const variants = product?.variants ?? []

  // Reset antes del paint para que nunca se vea una selección previa o preseleccionada
  useLayoutEffect(() => {
    setSelectedAttributes(EMPTY_SELECTION)
  }, [product?.id, slug, (product?.attributeDefinitions?.length ?? 0)])

  const validVariants = useMemo(
    () => getValidVariants(selectedAttributes, variants),
    [selectedAttributes, variants]
  )

  // Solo exigir atributos donde realmente hay elección:
  // - aparecen en 2+ variantes
  // - y tienen 2+ valores distintos entre las variantes
  const requiredAttrNames = useMemo(() => {
    const defs = product?.attributeDefinitions ?? []
    if (!defs.length || !variants.length) return []
    const required: string[] = []
    for (const def of defs) {
      const name = def.name
      if (!name?.trim()) continue
      const distinct = new Set<string>()
      let presentCount = 0
      for (const v of variants) {
        const raw = v.attributes?.[name]
        if (raw == null) continue
        const val = String(raw).trim()
        if (!val) continue
        presentCount += 1
        distinct.add(val.toLowerCase())
      }
      if (presentCount >= 2 && distinct.size >= 2) {
        required.push(name)
      }
    }
    return required
  }, [product?.attributeDefinitions, variants])
  const selectedVariant = useMemo(
    () => findExactVariant(selectedAttributes, variants, requiredAttrNames),
    [selectedAttributes, variants, requiredAttrNames]
  )

  const handleSelectAttribute = useCallback((attrName: string, value: string | null) => {
    setSelectedAttributes((prev) => ({ ...prev, [attrName]: value }))
  }, [])

  const isOptionAvailable = useCallback(
    (attrName: string, attrValue: string) =>
      isOptionAvailableHelper(attrName, attrValue, selectedAttributes, variants),
    [selectedAttributes, variants]
  )

  // Sin producto no hay selección; evita mostrar estado de un producto anterior
  if (!product?.variants?.length || !product?.attributeDefinitions?.length) {
    return {
      selectedAttributes: EMPTY_SELECTION,
      setSelectedAttributes: () => {},
      handleSelectAttribute: () => {},
      validVariants: [],
      selectedVariant: null,
      isOptionAvailable: () => false,
      attributeDefinitions: [],
    }
  }

  return {
    selectedAttributes,
    setSelectedAttributes,
    handleSelectAttribute,
    validVariants,
    selectedVariant,
    isOptionAvailable,
    attributeDefinitions: product.attributeDefinitions,
  }
}
