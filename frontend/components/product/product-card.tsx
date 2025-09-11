import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart } from 'lucide-react'

interface ProductCardProps {
  id: string
  name: string
  brand: string
  price: number
  originalPrice?: number
  image: string
  badge?: string
  badgeColor?: 'blue' | 'red' | 'green' | 'yellow'
  onAddToCart?: (id: string) => void
  onToggleFavorite?: (id: string) => void
  isFavorite?: boolean
  className?: string
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  brand,
  price,
  originalPrice,
  image,
  badge,
  badgeColor = 'blue',
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  className = ''
}) => {
  const texts = {
    viewProduct: 'VER PRODUCTO'
  }

  const badgeColorClasses = {
    blue: 'bg-blue-600 text-white',
    red: 'bg-red-600 text-white',
    green: 'bg-green-600 text-white',
    yellow: 'bg-yellow-600 text-black'
  }

  return (
    <Card className={`group cursor-pointer hover:shadow-lg dark:hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${className}`}>
      <CardContent className="p-0">
        <div className="relative">
          {/* Imagen del producto */}
          <div className="relative aspect-square overflow-hidden rounded-t-lg">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Badge */}
            {badge && (
              <Badge 
                variant="secondary" 
                className={`absolute top-3 left-3 z-10 font-bold text-xs px-2 py-1 ${badgeColorClasses[badgeColor]}`}
              >
                {badge}
              </Badge>
            )}

            {/* Botón de favorito */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-10 h-8 w-8 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800"
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite?.(id)
              }}
            >
              <Heart 
                className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-400'}`} 
              />
            </Button>
          </div>

          {/* Información del producto */}
          <div className="p-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1 line-clamp-2 uppercase">
              {name}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 uppercase">
              {brand}
            </p>

            {/* Precio */}
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                ${price.toFixed(2)}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                  ${originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Botón Agregar al Carrito */}
            <Button
              variant="default"
              size="sm"
              className="w-full text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation()
                onAddToCart?.(id)
              }}
            >
              AGREGAR AL CARRITO
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { ProductCard }
export default ProductCard