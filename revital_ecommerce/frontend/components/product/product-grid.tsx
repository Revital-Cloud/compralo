"use client"

import { Heart, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { useFavorites } from "@/hooks/use-favorites"
import { useActiveDiscounts } from "@/hooks/use-discounts"
import { Badge } from "@/components/ui"

import type { Product } from '@/types'
import { getProductImageUrl } from "@/utils/image-helpers"
import { formatPrice } from "@/utils/format-price"
import { 
  getApplicableDiscount, 
  calculateDiscountedPrice, 
  calculateDiscountPercentage 
} from "@/utils/discount-utils"

interface ProductGridProps {
  products: Product[]
  loading?: boolean
  onToggleFavorite?: (productId: string) => void
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  onToggleFavorite
}) => {
  const { toggleFavorite, isProductFavorite } = useFavorites()
  const { data: discounts } = useActiveDiscounts()

  const handleToggleFavorite = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    const id_producto = Number(product.id)
    const isFavorite = isProductFavorite(id_producto)
    await toggleFavorite(id_producto, isFavorite)
    onToggleFavorite?.(product.id.toString())
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse w-full">
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 sm:mb-3 w-full"></div>
            <div className="space-y-2">
              <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
      {products.map((product, index) => {
        const applicableDiscount = discounts ? getApplicableDiscount(product, discounts) : null
        const priceMin = parseFloat(String((product as any).price_min ?? product.val_precio ?? 0)) || 0
        const priceMaxRaw = (product as any).price_max
        const priceMax = priceMaxRaw != null ? parseFloat(String(priceMaxRaw)) || priceMin : priceMin
        const showPriceRange = !Number.isNaN(priceMin) && !Number.isNaN(priceMax) && priceMin !== priceMax

        const originalPrice = priceMin
        const discountedPrice = applicableDiscount 
          ? calculateDiscountedPrice(originalPrice, applicableDiscount)
          : originalPrice
        const hasDiscount = applicableDiscount && discountedPrice < originalPrice
        const discountPercentage = hasDiscount 
          ? calculateDiscountPercentage(originalPrice, discountedPrice)
          : 0

        const rangeDiscountedMin = showPriceRange && applicableDiscount ? calculateDiscountedPrice(priceMin, applicableDiscount) : priceMin
        const rangeDiscountedMax = showPriceRange && applicableDiscount ? calculateDiscountedPrice(priceMax, applicableDiscount) : priceMax
        const rangeHasDiscount = showPriceRange && applicableDiscount != null && (rangeDiscountedMin < priceMin || rangeDiscountedMax < priceMax)

        return (
          <Link
            key={product.slug ?? String(product.id)}
            href={`/products/${product.slug ?? product.id}`}
            className="group cursor-pointer w-full transition-all duration-300"
          >
            {/* Imagen del producto */}
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden mb-4 w-full">
              <Image
                src={getProductImageUrl((product as any).image_url ?? product.img_producto)}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-500"
                width={300}
                height={300}
                priority={index < 4}
              />

              {/* Botón de favorito - solo visible en hover */}
              <button
                onClick={(e) => handleToggleFavorite(e, product)}
                className={cn(
                  "absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-800/80 flex items-center justify-center transition-all duration-300",
                  "opacity-0 group-hover:opacity-100",
                  "cursor-pointer hover:bg-white dark:hover:bg-gray-700 hover:scale-110"
                )}
              >
                <Heart 
                  className={cn(
                    "w-4 h-4 transition-all",
                    isProductFavorite(Number(product.id))
                      ? "fill-red-500 text-red-500"
                      : "text-gray-600 dark:text-gray-400 hover:text-red-500"
                  )}
                />
              </button>
            </div>

            {/* Información del producto */}
            <div className="space-y-1 w-full min-w-0">
              {/* Precio: rango (min – max) o precio único; misma altura para alinear cards */}
              <div className="min-h-[3.25rem] flex flex-col justify-center">
                {showPriceRange ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xl text-gray-900 dark:text-white">
                        {formatPrice(rangeHasDiscount ? rangeDiscountedMin : priceMin)}
                        <span className="mx-1 font-normal text-gray-500 dark:text-gray-400">–</span>
                        {formatPrice(rangeHasDiscount ? rangeDiscountedMax : priceMax)}
                      </span>
                      {rangeHasDiscount && (
                        <Badge variant="destructive" className="text-xs font-semibold px-2 py-0.5">
                          -{discountPercentage}%
                        </Badge>
                      )}
                    </div>
                    {rangeHasDiscount && (
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 line-through">
                        {formatPrice(priceMin)} – {formatPrice(priceMax)}
                      </span>
                    )}
                  </div>
                ) : hasDiscount ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xl text-gray-900 dark:text-white">
                        {formatPrice(discountedPrice)}
                      </span>
                      <Badge variant="destructive" className="text-xs font-semibold px-2 py-0.5">
                        -{discountPercentage}%
                      </Badge>
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  </div>
                ) : (
                  <span className="font-bold text-xl text-gray-900 dark:text-white">
                    {formatPrice(discountedPrice)}
                  </span>
                )}
              </div>

              {/* Nombre del producto */}
              <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
                {product.name}
              </h3>

              {/* Rating */}
              {product.rating && product.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {product.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default ProductGrid 