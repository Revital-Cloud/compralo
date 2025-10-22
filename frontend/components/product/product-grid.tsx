"use client"

import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { useFavorites } from "@/hooks/use-favorites"

import type { Product } from '@/types'
import { getProductImageUrl } from "@/utils/image-helpers"
import { formatPrice } from "@/utils/format-price"

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

  const handleToggleFavorite = async (e: React.MouseEvent, productKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Parsear el key compuesto: "categoria-linea-sublinea-producto"
    const [cat, lin, sub, prod] = productKey.split('-')
    
    const product = products.find(p => 
      p.id_categoria.toString() === cat &&
      p.id_linea.toString() === lin &&
      p.id_sublinea.toString() === sub &&
      p.id_producto.toString() === prod
    )
    
    if (!product) {
      console.error('❌ Producto no encontrado:', productKey)
      return
    }

    // Log: Ver IDs originales del producto (antes de conversión)
    console.log('📦 Producto original:', {
      id_categoria: product.id_categoria,
      id_linea: product.id_linea,
      id_sublinea: product.id_sublinea,
      id_producto: product.id_producto,
      nombre: product.nom_producto,
      tipos: {
        categoria: typeof product.id_categoria,
        linea: typeof product.id_linea,
        sublinea: typeof product.id_sublinea,
        producto: typeof product.id_producto
      }
    })

    // Convertir strings a numbers explícitamente
    const id_categoria = Number(product.id_categoria)
    const id_linea = Number(product.id_linea)
    const id_sublinea = Number(product.id_sublinea)
    const id_producto = Number(product.id_producto)

    console.log('🔍 ProductGrid - IDs convertidos:', {
      id_categoria,
      id_linea,
      id_sublinea,
      id_producto,
      nombre: product.nom_producto
    })

    const isFavorite = isProductFavorite(
      id_categoria,
      id_linea,
      id_sublinea,
      id_producto
    )

    await toggleFavorite(
      id_categoria,
      id_linea,
      id_sublinea,
      id_producto,
      isFavorite
    )

    onToggleFavorite?.(product.id_producto.toString())
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
      {products.map((product, index) => (
        <Link
          key={`${product.id_categoria}-${product.id_linea}-${product.id_sublinea}-${product.id_producto}`}
          href={`/products/${product.id_categoria}-${product.id_linea}-${product.id_sublinea}-${product.id_producto}`}
          className="group cursor-pointer w-full transition-all duration-300"
        >
          {/* Imagen del producto */}
          <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden mb-4 w-full">
            <Image
              src={getProductImageUrl(product.img_producto)}
              alt={product.nom_producto}
              className="w-full h-full object-cover transition-all duration-500"
              width={300}
              height={300}
              priority={index < 4}
            />

            {/* Botón de favorito - solo visible en hover */}
            <button
              onClick={(e) => handleToggleFavorite(e, `${product.id_categoria}-${product.id_linea}-${product.id_sublinea}-${product.id_producto}`)}
              className={cn(
                "absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-800/80 flex items-center justify-center transition-all duration-300",
                "opacity-0 group-hover:opacity-100",
                "cursor-pointer hover:bg-white dark:hover:bg-gray-700 hover:scale-110"
              )}
            >
              <Heart 
                className={cn(
                  "w-4 h-4 transition-all",
                  isProductFavorite(product.id_categoria, product.id_linea, product.id_sublinea, product.id_producto)
                    ? "fill-red-500 text-red-500"
                    : "text-gray-600 dark:text-gray-400 hover:text-red-500"
                )}
              />
            </button>
          </div>

          {/* Información del producto */}
          <div className="space-y-1 w-full min-w-0">
            {/* Precio */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                {formatPrice(product.val_precio)}
              </span>
            </div>

            {/* Nombre del producto */}
            <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
              {product.nom_producto}
            </h3>

            {/* Categoría o marca */}
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Producto
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default ProductGrid 