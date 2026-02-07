"use client"

import { useState } from "react"
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
  /** Se llama al seleccionar un color; index coincide con la posición en colors (para sincronizar galería). */
  onColorChange?: (value: string, index: number) => void
  /** Color seleccionado desde el padre (para sincronizar con la galería). */
  selectedColor?: string
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
  selectedColor: controlledColor
}) => {
  const [internalColor, setInternalColor] = useState<string>("")
  const selectedColor = controlledColor !== undefined ? controlledColor : internalColor
  const setSelectedColor = (value: string) => {
    if (controlledColor === undefined) setInternalColor(value)
  }
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [isAdding, setIsAdding] = useState(false)
  
  // Hook de favoritos
  const { toggleFavorite, isProductFavorite } = useFavorites()
  
  // Obtener descuentos activos
  const { data: discounts } = useActiveDiscounts()
  
  // Verificar si hay descuento aplicable
  const applicableDiscount = discounts ? getApplicableDiscount(product, discounts) : null
  const originalPriceValue = parseFloat(price.toString())
  const discountedPrice = applicableDiscount 
    ? calculateDiscountedPrice(originalPriceValue, applicableDiscount)
    : originalPriceValue
  const hasDiscount = applicableDiscount && discountedPrice < originalPriceValue
  const discountPercentage = hasDiscount 
    ? calculateDiscountPercentage(originalPriceValue, discountedPrice)
    : 0

  const requiresColor = colors.length > 0
  const requiresSize = sizes.length > 0
  const missingColor = requiresColor && !selectedColor.trim()
  const missingSize = requiresSize && !selectedSize.trim()
  const canAddToCart = !missingColor && !missingSize

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
    
    const id_categoria = Number(product.id_categoria)
    const id_linea = Number(product.id_linea)
    const id_sublinea = Number(product.id_sublinea)
    const id_producto = Number(product.id_producto)
    
    const isFavorite = isProductFavorite(id_categoria, id_linea, id_sublinea, id_producto)
    
    await toggleFavorite(id_categoria, id_linea, id_sublinea, id_producto, isFavorite)
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

      {/* Price */}
      <div className="flex items-baseline gap-3 flex-nowrap">
        <div className="flex items-baseline gap-3 flex-1 min-w-0">
          <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
            {formatPrice(hasDiscount ? discountedPrice : price, 'COP')}
          </span>
          {hasDiscount && (
            <span className="text-lg text-gray-500 line-through whitespace-nowrap flex-shrink-0">
              {formatPrice(originalPriceValue, 'COP')}
            </span>
          )}
        </div>
        {hasDiscount && (
          <Badge variant="destructive" className="text-sm whitespace-nowrap flex-shrink-0">
            -{discountPercentage}% OFF
          </Badge>
        )}
      </div>

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

      {/* Colors */}
      {colors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">COLOR</h3>
            {selectedColor && (
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {colors.find(c => c.value === selectedColor)?.name}
              </span>
            )}
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
                    if (!color.available) return
                    if (controlledColor === undefined) setInternalColor(color.value)
                    onColorChange?.(color.value, index)
                  }}
                  disabled={!color.available}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all shrink-0",
                    selectedColor === color.value
                      ? "scale-110"
                      : "border-gray-300 dark:border-gray-600",
                    selectedColor === color.value && isLight && "border-gray-900 dark:border-white",
                    selectedColor === color.value && !isLight && "border-white dark:border-gray-200",
                    !color.available && "opacity-50 cursor-not-allowed"
                  )}
                  style={{ backgroundColor: bgColor }}
                  title={color.name}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Sizes */}
      {sizes.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">OPCIONES</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {sizes.map((size) => (
              <button
                key={size.name}
                onClick={() => size.available && setSelectedSize(size.name)}
                disabled={!size.available}
                className={cn(
                  "py-2 px-2 sm:px-3 border rounded-md text-xs sm:text-sm font-medium transition-colors",
                  selectedSize === size.name
                    ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-gray-300 hover:border-gray-400",
                  !size.available && "opacity-50 cursor-not-allowed line-through"
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
            ) : (
              "AGREGAR AL CARRITO"
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleToggleFavorite}
            className={cn(
              "flex-shrink-0 w-12 h-12 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 rounded-lg transition-all",
              isProductFavorite(Number(product.id_categoria), Number(product.id_linea), Number(product.id_sublinea), Number(product.id_producto)) && "border-red-500 bg-red-50 dark:bg-red-900/20"
            )}
          >
            <Heart 
              className={cn(
                "h-5 w-5 transition-all",
                isProductFavorite(Number(product.id_categoria), Number(product.id_linea), Number(product.id_sublinea), Number(product.id_producto)) 
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
          {product.spcf_producto && typeof product.spcf_producto === 'object' ? (
            <div className="space-y-2">
              {Object.entries(product.spcf_producto).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>{product.spcf_producto || 'Sin especificaciones disponibles'}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductInfo 