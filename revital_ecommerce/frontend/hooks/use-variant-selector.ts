"use client"

import { useState, useMemo, useCallback, useLayoutEffect } from "react"
import type { ProductDetailForSelector } from "@/types/product"
import {
  getValidVariants,
  findExactVariant,
  isOptionAvailable as isOptionAvailableHelper,
} from "@/lib/variant-selector-helpers"

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

  const requiredAttrNames = useMemo(
    () => product?.attributeDefinitions?.map((a) => a.name) ?? [],
    [product?.attributeDefinitions]
  )
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
