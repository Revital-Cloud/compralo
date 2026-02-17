"use client"

import { useState, useMemo } from "react"
import { Heart, Share2, Star, Check } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui"
import { Badge } from "@/components/ui"
import { cn } from "@/lib/utils"
import { Product } from "@/types"
import { formatPrice } from "@/utils/format-price"
import { useFavorites } from "@/hooks/use-favorites"
import { useActiveDiscounts } from "@/hooks/use-discounts"
import { 
  getApplicableDiscount, 
  calculateDiscountedPrice, 
  calculateDiscountPercentage 
} from "@/utils/discount-utils"

export type ProductColorOption = {
  name: string
  value: string
  available: boolean
  /** Hex para el círculo (ej. #EF4444). Si no viene, se usa value como CSS color. */
  displayHex?: string
}

export type ProductAttributeValue = {
  value: string
  hex_color?: string | null
  variant_ids: number[]
  available: boolean
}

export type ProductAttribute = {
  attribute_id: number
  attribute_name: string
  values: ProductAttributeValue[]
}

interface ProductInfoProps {
  product: Product
  name: string
  price: number
  originalPrice?: number
  rating?: number
  reviewCount?: number
  colors?: ProductColorOption[]
  sizes?: { name: string; available: boolean }[]
  isNew?: boolean
  onAddToCart?: (selectedColor?: string, selectedSize?: string) => void
  onAddToWishlist?: () => void
  onColorChange?: (value: string, index: number) => void
  selectedColor?: string
  /** Atributos por nombre (Color, Almacenamiento, RAM…) con valores y disponibilidad según variantes. */
  attributes?: ProductAttribute[]
  selectedAttributes?: Record<string, string>
  onAttributeChange?: (attributeId: string, value: string) => void
  /** Descripción del producto para "Acerca del producto". */
  description?: string | null
  /** Si se pasa, se usa en lugar de la lógica interna para habilitar "Agregar al carrito". */
  canAddToCartOverride?: boolean
  /** Texto del botón cuando está deshabilitado (ej. "Selecciona todas las opciones"). */
  addToCartDisabledLabel?: string
  /** Slot para opciones (ej. ProductVariantSelector) que se muestra debajo de nombre/precio/stock. */
  optionsSlot?: React.ReactNode
  /** Precio mínimo del rango (mín de variantes). Si no hay variante seleccionada y min !== max, se muestra rango. */
  priceMin?: number
  /** Precio máximo del rango (máx de variantes). */
  priceMax?: number
  /** Si el usuario ya eligió una variante concreta; entonces se muestra un solo precio en lugar del rango. */
  hasVariantSelected?: boolean
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  name,
  price,
  originalPrice,
  rating = 0,
  reviewCount = 0,
  colors = [],
  sizes = [],
  isNew = false,
  onAddToCart,
  onAddToWishlist,
  onColorChange,
  selectedColor: controlledColor,
  attributes = [],
  selectedAttributes = {},
  onAttributeChange,
  description,
  canAddToCartOverride,
  addToCartDisabledLabel,
  optionsSlot,
  priceMin: priceMinProp,
  priceMax: priceMaxProp,
  hasVariantSelected = false,
}) => {
  const [internalColor, setInternalColor] = useState<string>("")
  const selectedColor = controlledColor !== undefined ? controlledColor : internalColor
  const setSelectedColor = (value: string) => {
    if (controlledColor === undefined) setInternalColor(value)
  }
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [isAdding, setIsAdding] = useState(false)

  const { toggleFavorite, isProductFavorite } = useFavorites()
  const { data: discounts } = useActiveDiscounts()
  
  // Asegurar que el producto tenga category_id para la comparación de descuentos
  const productForDiscount = useMemo(() => {
    if (!product) return product
    // Asegurar que tenga category_id (puede venir como id_categoria o category_id)
    const catId = (product as any).id_categoria ?? (product as any).category_id
    return {
      ...product,
      id_categoria: catId,
      category_id: catId,
      id_producto: product.id ?? (product as any).id_producto,
      id_marca: (product as any).id_marca ?? (product as any).marca_id,
    }
  }, [product])
  
  const applicableDiscount = discounts ? getApplicableDiscount(productForDiscount as any, discounts) : null
  const originalPriceValue = parseFloat(price.toString())
  const discountedPrice = applicableDiscount 
    ? calculateDiscountedPrice(originalPriceValue, applicableDiscount)
    : originalPriceValue
  const hasDiscount = applicableDiscount && discountedPrice < originalPriceValue
  const discountPercentage = hasDiscount 
    ? calculateDiscountPercentage(originalPriceValue, discountedPrice)
    : 0

  // Mostrar rango (Desde $min – $max) cuando hay varias variantes y aún no se eligió una
  const showPriceRange = Boolean(
    !hasVariantSelected &&
    priceMinProp != null &&
    priceMaxProp != null &&
    priceMinProp !== priceMaxProp
  )
  const minVal = priceMinProp ?? 0
  const maxVal = priceMaxProp ?? 0
  const rangeMin = showPriceRange ? (applicableDiscount ? calculateDiscountedPrice(minVal, applicableDiscount) : minVal) : 0
  const rangeMax = showPriceRange ? (applicableDiscount ? calculateDiscountedPrice(maxVal, applicableDiscount) : maxVal) : 0
  const rangeHasDiscount = showPriceRange && applicableDiscount != null && (rangeMin < minVal || rangeMax < maxVal)

  const useAttributes = attributes.length > 0
  const requiresColor = !useAttributes && colors.length > 0
  const requiresSize = !useAttributes && sizes.length > 0
  const missingColor = requiresColor && !selectedColor.trim()
  const missingSize = requiresSize && !selectedSize.trim()
  const canAddToCart = canAddToCartOverride !== undefined ? canAddToCartOverride : !missingColor && !missingSize

  const handleAddToCart = async () => {
    if (missingColor) {
      toast.error('Selecciona un color')
      return
    }
    if (missingSize) {
      toast.error('Selecciona una talla u opción')
      return
    }
    setIsAdding(true)
    setTimeout(() => {
      setIsAdding(false)
    }, 300)
    onAddToCart?.(selectedColor, selectedSize)
  }

  const handleToggleFavorite = async () => {
    if (!product) return
    const id_producto = Number(product.id)
    const isFavorite = isProductFavorite(id_producto)
    await toggleFavorite(id_producto, isFavorite)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        {isNew && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Nuevo Lanzamiento
          </Badge>
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {name}
        </h1>
      </div>

      {/* Price: rango (desde min – max) o precio único según variante seleccionada */}
      {showPriceRange ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Desde {formatPrice(rangeMin, 'COP')} – {formatPrice(rangeMax, 'COP')}
            </span>
            {rangeHasDiscount && (
              <Badge variant="destructive" className="text-sm font-semibold px-3 py-1">
                -{applicableDiscount ? calculateDiscountPercentage(minVal, rangeMin) : 0}%
              </Badge>
            )}
          </div>
          {rangeHasDiscount && (
            <div className="flex items-center gap-2">
              <span className="text-xl text-gray-500 dark:text-gray-400 line-through font-medium">
                Desde {formatPrice(minVal, 'COP')} – {formatPrice(maxVal, 'COP')}
              </span>
            </div>
          )}
        </div>
      ) : hasDiscount ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {formatPrice(discountedPrice, 'COP')}
            </span>
            <Badge variant="destructive" className="text-sm font-semibold px-3 py-1">
              -{discountPercentage}%
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl text-gray-500 dark:text-gray-400 line-through font-medium">
              {formatPrice(originalPriceValue, 'COP')}
            </span>
          </div>
        </div>
      ) : (
        <span className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          {formatPrice(price, 'COP')}
        </span>
      )}

      {/* Rating: mostrar si hay reseñas o si hay valor promedio */}
      {(reviewCount > 0 || (rating != null && rating > 0)) && (
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.floor(rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            ({reviewCount} reseña{reviewCount !== 1 ? 's' : ''})
          </span>
        </div>
      )}

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-3 h-3 rounded-full",
          product.num_stock > 0 ? "bg-green-500" : "bg-red-500"
        )} />
        <span className={cn(
          "text-sm font-medium",
          product.num_stock > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        )}>
          {product.num_stock > 0 ? `${product.num_stock} en stock` : 'Sin stock'}
        </span>
      </div>

      {/* Opciones (selector de variantes) cuando se pasa optionsSlot; si no, atributos/color/talla debajo */}
      {optionsSlot != null ? optionsSlot : null}

      {/* Atributos por nombre (Color, Almacenamiento, RAM, etc.) cuando no hay optionsSlot */}
      {optionsSlot == null && useAttributes && attributes.map((attr) => (
        <div key={attr.attribute_id} className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {attr.attribute_name.toUpperCase()}
          </h3>
          <div className={attr.values.some((v) => v.hex_color) ? "flex gap-2 flex-wrap" : "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2"}>
            {attr.values.map((val) => {
              const selected = (selectedAttributes[String(attr.attribute_id)] ?? "").trim() === (val.value ?? "").trim()
              const isColor = !!val.hex_color
              if (isColor) {
                const isLight = val.hex_color
                  ? (() => {
                      const h = (val.hex_color ?? "").replace("#", "")
                      if (h.length < 6) return false
                      const r = parseInt(h.slice(0, 2), 16)
                      const g = parseInt(h.slice(2, 4), 16)
                      const b = parseInt(h.slice(4, 6), 16)
                      return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7
                    })()
                  : false
                return (
                  <button
                    key={val.value}
                    type="button"
                    onClick={() => {
                      if (selected) onAttributeChange?.(String(attr.attribute_id), "")
                      else if (val.available) onAttributeChange?.(String(attr.attribute_id), val.value)
                    }}
                    disabled={!val.available && !selected}
                    title={val.value}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all shrink-0",
                      selected ? "scale-110" : "",
                      selected && isLight && "border-gray-900 dark:border-white",
                      selected && !isLight && "border-white dark:border-gray-200",
                      !val.available && !selected && "opacity-50 cursor-not-allowed"
                    )}
                    style={{ backgroundColor: val.hex_color ?? "transparent" }}
                  />
                )
              }
              return (
                <button
                  key={val.value}
                  type="button"
                  onClick={() => {
                    if (selected) onAttributeChange?.(String(attr.attribute_id), "")
                    else if (val.available) onAttributeChange?.(String(attr.attribute_id), val.value)
                  }}
                  disabled={!val.available && !selected}
                  className={cn(
                    "py-2 px-2 sm:px-3 border rounded-md text-xs sm:text-sm font-medium transition-colors",
                    selected
                      ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-gray-300 hover:border-gray-400",
                    !val.available && !selected && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {val.value}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Opciones tipo color (fallback cuando no hay variant_options.attributes ni optionsSlot).
          Nota: usamos un label genérico para no forzar siempre "COLOR" en productos donde
          las variantes representan otro atributo (ej. tamaño, presentación, etc.). */}
      {optionsSlot == null && !useAttributes && colors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">OPCIONES</h3>
            {selectedColor && (() => {
              const selected = colors.find(c => c.value === selectedColor)
              if (!selected) return null
              if (selected.displayHex) {
                return (
                  <span
                    className="inline-block w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0"
                    style={{ backgroundColor: selected.displayHex }}
                    title={selected.name}
                  />
                )
              }
              return (
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {selected.name}
                </span>
              )
            })()}
          </div>
          <div className="flex gap-2">
            {colors.map((color, index) => {
              const bgColor = color.displayHex ?? color.value
              const isLight = color.displayHex
                ? (() => {
                    const h = (color.displayHex ?? '').replace('#', '')
                    if (h.length < 6) return false
                    const r = parseInt(h.slice(0, 2), 16)
                    const g = parseInt(h.slice(2, 4), 16)
                    const b = parseInt(h.slice(4, 6), 16)
                    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7
                  })()
                : false
              return (
                <button
                  key={`${color.value}-${index}`}
                  onClick={() => {
                    if (selectedColor === color.value) {
                      if (controlledColor === undefined) setInternalColor("")
                      onColorChange?.("", -1)
                    } else if (color.available) {
                      if (controlledColor === undefined) setInternalColor(color.value)
                      onColorChange?.(color.value, index)
                    }
                  }}
                  disabled={!color.available && selectedColor !== color.value}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all shrink-0",
                    selectedColor === color.value
                      ? "scale-110"
                      : "border-gray-300 dark:border-gray-600",
                    selectedColor === color.value && isLight && "border-gray-900 dark:border-white",
                    selectedColor === color.value && !isLight && "border-white dark:border-gray-200",
                    !color.available && selectedColor !== color.value && "opacity-50 cursor-not-allowed"
                  )}
                  style={{ backgroundColor: bgColor }}
                  title={color.name}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Sizes (fallback cuando no hay variant_options.attributes ni optionsSlot) */}
      {optionsSlot == null && !useAttributes && sizes.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">OPCIONES</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {sizes.map((size) => (
              <button
                key={size.name}
                onClick={() => {
                  if (selectedSize === size.name) setSelectedSize("")
                  else if (size.available) setSelectedSize(size.name)
                }}
                disabled={!size.available && selectedSize !== size.name}
                className={cn(
                  "py-2 px-2 sm:px-3 border rounded-md text-xs sm:text-sm font-medium transition-colors",
                  selectedSize === size.name
                    ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-gray-300 hover:border-gray-400",
                  !size.available && selectedSize !== size.name && "opacity-50 cursor-not-allowed line-through"
                )}
              >
                {size.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <Button
            onClick={handleAddToCart}
            disabled={isAdding || !canAddToCart}
            className={cn(
              "flex-1 bg-black text-white hover:bg-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 transition-all duration-300 rounded-lg font-medium h-12",
              isAdding && "scale-95 bg-green-600 dark:bg-green-600",
              !canAddToCart && "opacity-70 cursor-not-allowed"
            )}
          >
            {isAdding ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                ¡Agregado!
              </motion.div>
            ) : !canAddToCart && addToCartDisabledLabel ? (
              addToCartDisabledLabel
            ) : (
              "AGREGAR AL CARRITO"
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleToggleFavorite}
            className={cn(
              "flex-shrink-0 w-12 h-12 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 rounded-lg transition-all",
              isProductFavorite(Number(product.id)) && "border-red-500 bg-red-50 dark:bg-red-900/20"
            )}
          >
            <Heart 
              className={cn(
                "h-5 w-5 transition-all",
                isProductFavorite(Number(product.id)) 
                  ? "fill-red-500 text-red-500" 
                  : "text-gray-600 dark:text-gray-400 hover:text-red-500"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Product Details */}
      <div className="border-t pt-6 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          ACERCA DEL PRODUCTO
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          {description && <p className="mb-2">{description}</p>}
          {product.spcf_producto && typeof product.spcf_producto === 'object' && Object.keys(product.spcf_producto).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(product.spcf_producto).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          ) : !description ? (
            <p>Sin especificaciones disponibles</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ProductInfo 