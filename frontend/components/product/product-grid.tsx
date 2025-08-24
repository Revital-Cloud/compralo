"use client"

import { Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"

import type { Product } from '@/types'
import { getProductImageUrl } from "@/utils/image-helpers"

interface ProductGridProps {
  products: Product[]
  loading?: boolean
  onAddToCart?: (productId: string) => void
  onToggleFavorite?: (productId: string) => void
}



const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  onAddToCart,
  onToggleFavorite
}) => {

  const handleAddToCart = (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart?.(productId)
  }

  const handleToggleFavorite = (e: React.MouseEvent, productId: string) => {
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
          key={product.id_producto}
          href={`/products/${product.id_categoria}-${product.id_linea}-${product.id_sublinea}-${product.id_producto}`}
          className="group cursor-pointer w-full"
        >
          <div className="relative aspect-square bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden mb-2 sm:mb-3 w-full">
            {/* Product Badge */}
            {product.num_stock > 0 ? (
              <Badge 
                variant="outline"
                className="absolute top-2 left-2 z-10 text-xs"
              >
                En stock
              </Badge>
            ) : (
              <Badge 
                variant="destructive"
                className="absolute top-2 left-2 z-10 text-xs"
              >
                Agotado
              </Badge>
            )}

            {/* Favorite Button */}
            <button
              onClick={(e) => handleToggleFavorite(e, product.id_producto.toString())}
              className={cn(
                "absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center transition-all",
                "opacity-0 group-hover:opacity-100"
              )}
            >
              <Heart 
                className="w-4 h-4 text-gray-600"
              />
            </button>

            {/* Product Image */}
            <Image
              src={getProductImageUrl(product.img_producto)}
              alt={product.nom_producto}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              width={300}
              height={300}
            />

            {/* Quick Add to Cart */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
              <Button
                onClick={(e) => handleAddToCart(e, product.id_producto.toString())}
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
              {product.nom_producto}
            </h3>
            
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                ${typeof product.val_precio === 'string' ? parseFloat(product.val_precio).toFixed(2) : product.val_precio}
              </span>
            </div>

            {/* Stock Info */}
            <div className="text-xs text-gray-500">
              Stock: {product.num_stock} unidades
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default ProductGrid 