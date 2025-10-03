"use client"

import { Heart, ShoppingCart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { Product } from "@/types"
import Image from "next/image"
import { getProductImageUrl } from "@/utils/image-helpers"
import { useFavorites } from "@/hooks/use-favorites"

interface ProductListProps {
  products: Product[]
  loading?: boolean
  onAddToCart?: (productId: string) => void
  onToggleFavorite?: (productId: string) => void
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  loading = false,
  onAddToCart,
  onToggleFavorite
}) => {
  const { toggleFavorite, isProductFavorite } = useFavorites()

  const getBadgeVariant = (color?: string) => {
    switch (color) {
      case 'orange': return 'default'
      case 'blue': return 'secondary'
      case 'red': return 'destructive'
      case 'green': return 'outline'
      default: return 'default'
    }
  }

  const handleAddToCart = (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart?.(productId)
  }

  const handleToggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const product = products.find(p => p.id_producto.toString() === productId)
    if (!product) return

    const isFavorite = isProductFavorite(
      product.id_categoria,
      product.id_linea,
      product.id_sublinea,
      product.id_producto
    )

    await toggleFavorite(
      product.id_categoria,
      product.id_linea,
      product.id_sublinea,
      product.id_producto,
      isFavorite
    )

    onToggleFavorite?.(productId)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <div
          key={product.id_producto}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all duration-200 overflow-hidden"
        >
          <div className="flex items-center p-4">
            {/* Product Image */}
            <Link
              href={`/products/${product.id_producto}`}
              className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden group"
            >
              
              <Image
                src={getProductImageUrl(product.img_producto)}
                alt={product.nom_producto}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </Link>

            {/* Product Info - Responsive Layout */}
            <div className="flex-1 ml-3 sm:ml-4">
              {/* Mobile Layout */}
              <div className="block md:hidden">
                <Link
                  href={`/products/${product.id_producto}`}
                  className="block group"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm">
                    {product.nom_producto}
                  </h3>
                </Link>
                
                <div className="flex items-center justify-between mt-2">
                    <div className="flex flex-col">
                     <span className="font-bold text-lg text-gray-900 dark:text-white">
                       ${typeof product.val_precio === 'string' ? parseFloat(product.val_precio).toFixed(2) : product.val_precio}
                     </span>
                   </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleToggleFavorite(e, product.id_producto.toString())}
                      className={cn(
                        "w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center transition-all",
                        isProductFavorite(product.id_categoria, product.id_linea, product.id_sublinea, product.id_producto) && "border-red-500 bg-red-50 dark:bg-red-900/20"
                      )}
                    >
                      <Heart 
                        className={cn(
                          "w-3 h-3",
                          isProductFavorite(product.id_categoria, product.id_linea, product.id_sublinea, product.id_producto) ? "fill-red-500 text-red-500" : "text-gray-600"
                        )}
                      />
                    </button>
                    
                    <Button
                      onClick={(e) => handleAddToCart(e, product.id_producto.toString())}
                      size="sm"
                      className="bg-black text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-xs"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </div>
                
                {/* Rating Mobile - Comentado hasta que se agregue rating al tipo Product */}
                {/* {product.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3 h-3",
                            i < Math.floor(product.rating!)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">({product.rating})</span>
                  </div>
                )} */}
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                {/* Product Name & Rating */}
                <div className="col-span-5">
                  <Link
                    href={`/products/${product.id_categoria}-${product.id_linea}-${product.id_sublinea}-${product.id_producto}`}
                    className="block group"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm">
                      {product.nom_producto}
                    </h3>
                  </Link>
                  
                  {/* Rating - Comentado hasta que se agregue rating al tipo Product */}
                  {/* {product.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-3 h-3",
                              i < Math.floor(product.rating!)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">({product.rating})</span>
                    </div>
                  )} */}
                </div>

                {/* Price */}
                <div className="col-span-3">
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                      ${typeof product.val_precio === 'string' ? parseFloat(product.val_precio).toFixed(2) : product.val_precio}
                    </span>
                    {product.val_precio && product.val_precio > product.val_precio && (
                      <span className="text-sm text-gray-500 line-through">
                        ${product.val_precio.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-4 flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => handleToggleFavorite(e, product.id_producto.toString())}
                    className={cn(
                      "w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center transition-all hover:border-gray-400 dark:hover:border-gray-500",
                      isProductFavorite(product.id_categoria, product.id_linea, product.id_sublinea, product.id_producto) && "border-red-500 bg-red-50 dark:bg-red-900/20"
                    )}
                  >
                    <Heart 
                      className={cn(
                        "w-4 h-4",
                        isProductFavorite(product.id_categoria, product.id_linea, product.id_sublinea, product.id_producto) ? "fill-red-500 text-red-500" : "text-gray-600"
                      )}
                    />
                  </button>
                  
                  <Button
                    onClick={(e) => handleAddToCart(e, product.id_producto.toString())}
                    className="bg-black text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 h-10"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProductList 