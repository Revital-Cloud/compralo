"use client"

import { useState } from "react"
import { Heart, Share2, Star, Check } from "lucide-react"
import { motion } from "framer-motion"
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

interface ProductInfoProps {
  product: Product
  name: string
  price: number
  originalPrice?: number
  rating?: number
  reviewCount?: number
  colors?: { name: string; value: string; available: boolean }[]
  sizes?: { name: string; available: boolean }[]
  isNew?: boolean
  onAddToCart?: (selectedColor?: string, selectedSize?: string) => void
  onAddToWishlist?: () => void
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
  onAddToWishlist
}) => {
  const [selectedColor, setSelectedColor] = useState<string>("")
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

  const handleAddToCart = async () => {
    setIsAdding(true)
    
    // Feedback instantáneo
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

      {/* Rating */}
      {reviewCount > 0 && (
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
            ({reviewCount} reviews)
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
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => color.available && setSelectedColor(color.value)}
                disabled={!color.available}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  selectedColor === color.value
                    ? "border-gray-900 dark:border-white scale-110"
                    : "border-gray-300",
                  !color.available && "opacity-50 cursor-not-allowed"
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      {sizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">OPCIONES</h3>
            <button className="text-sm text-blue-600 hover:underline">
              VER DETALLES
            </button>
          </div>
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
            disabled={isAdding}
            className={cn(
              "flex-1 bg-black text-white hover:bg-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 transition-all duration-300 rounded-lg font-medium h-12",
              isAdding && "scale-95 bg-green-600 dark:bg-green-600"
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
        
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium h-12"
        >
          COMPRAR AHORA
        </Button>
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