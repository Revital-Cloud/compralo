"use client"

import { useState } from "react"
import { Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ProductGridItem {
  id: number
  name: string
  price: number
  originalPrice?: number
  image: string
  badge?: string
  badgeColor?: string
  rating?: number
  isNew?: boolean
  isFavorite?: boolean
}

interface ProductGridProps {
  products: ProductGridItem[]
  loading?: boolean
  onAddToCart?: (productId: number) => void
  onToggleFavorite?: (productId: number) => void
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  onAddToCart,
  onToggleFavorite
}) => {
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null)

  const getBadgeVariant = (color?: string) => {
    switch (color) {
      case 'orange': return 'default'
      case 'blue': return 'secondary'
      case 'red': return 'destructive'
      case 'green': return 'outline'
      default: return 'default'
    }
  }

  const handleAddToCart = (e: React.MouseEvent, productId: number) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart?.(productId)
  }

  const handleToggleFavorite = (e: React.MouseEvent, productId: number) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleFavorite?.(productId)
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
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.id}`}
          className="group cursor-pointer w-full"
          onMouseEnter={() => setHoveredProduct(product.id)}
          onMouseLeave={() => setHoveredProduct(null)}
        >
          <div className="relative aspect-square bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden mb-2 sm:mb-3 w-full">
            {/* Product Badge */}
            {product.badge && (
              <Badge 
                variant={getBadgeVariant(product.badgeColor)}
                className="absolute top-2 left-2 z-10 text-xs"
              >
                {product.badge}
              </Badge>
            )}

            {/* Favorite Button */}
            <button
              onClick={(e) => handleToggleFavorite(e, product.id)}
              className={cn(
                "absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center transition-all",
                "opacity-0 group-hover:opacity-100",
                product.isFavorite && "opacity-100 bg-red-50 dark:bg-red-900/20"
              )}
            >
              <Heart 
                className={cn(
                  "w-4 h-4",
                  product.isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
                )}
              />
            </button>

            {/* Product Image */}
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Quick Add to Cart */}
            <div 
              className={cn(
                "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent transition-all duration-300",
                hoveredProduct === product.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <Button
                onClick={(e) => handleAddToCart(e, product.id)}
                size="sm"
                className="w-full bg-white text-black hover:bg-gray-100 text-xs font-medium"
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                Agregar al carrito
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-1 w-full min-w-0">
            <h3 className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {product.name}
            </h3>
            
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs sm:text-sm text-gray-500 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 h-2 sm:w-3 sm:h-3 rounded-full",
                        i < Math.floor(product.rating!)
                          ? "bg-yellow-400"
                          : "bg-gray-200 dark:bg-gray-600"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">({product.rating})</span>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

export default ProductGrid 