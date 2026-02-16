import React, { useState } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui"
import { Card, CardContent } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Heart } from 'lucide-react'
import { formatPrice } from '@/utils/format-price'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  id: string
  name: string
  brand: string
  price: number
  originalPrice?: number
  image: string
  hoverImage?: string
  badge?: string
  badgeColor?: 'blue' | 'red' | 'green' | 'yellow'
  colorsAvailable?: number
  category?: string
  onToggleFavorite?: (id: string) => void
  onClick?: (id: string) => void
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
  hoverImage,
  badge,
  badgeColor = 'blue',
  colorsAvailable,
  category,
  onToggleFavorite,
  onClick,
  isFavorite = false,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const texts = {
    viewProduct: 'VER PRODUCTO'
  }

  const badgeColorClasses = {
    blue: 'bg-blue-600 text-white',
    red: 'bg-red-600 text-white',
    green: 'bg-green-600 text-white',
    yellow: 'bg-yellow-600 text-black'
  }

  const handleClick = () => {
    onClick?.(id)
  }

  return (
    <div 
      className={`group cursor-pointer transition-all duration-300 ${className}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Imagen del producto */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800 mb-4">
        <Image
          src={isHovered && hoverImage ? hoverImage : image}
          alt={name}
          fill
          className="object-cover transition-all duration-500"
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
          className="absolute top-3 right-3 z-10 h-8 w-8 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer hover:scale-110"
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite?.(id)
          }}
        >
          <Heart 
            className={cn(
              "h-4 w-4 transition-all",
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
            )}
          />
        </Button>
      </div>

      {/* Información del producto */}
      <div className="space-y-1">
        {/* Precio */}
        {originalPrice && originalPrice > price ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xl text-gray-900 dark:text-white">
                {formatPrice(price)}
              </span>
              {(() => {
                const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100)
                return (
                  <Badge variant="destructive" className="text-xs font-semibold px-2 py-0.5">
                    -{discountPercent}%
                  </Badge>
                )
              })()}
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 line-through">
              {formatPrice(originalPrice)}
            </span>
          </div>
        ) : (
          <span className="font-bold text-xl text-gray-900 dark:text-white">
            {formatPrice(price)}
          </span>
        )}

        {/* Nombre del producto */}
        <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
          {name}
        </h3>

        {/* Categoría */}
        {category && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {category}
          </p>
        )}

        {/* Colores disponibles */}
        {colorsAvailable && colorsAvailable > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {colorsAvailable} {colorsAvailable === 1 ? 'color' : 'colores'}
          </p>
        )}
      </div>
    </div>
  )
}

export { ProductCard }
export default ProductCard