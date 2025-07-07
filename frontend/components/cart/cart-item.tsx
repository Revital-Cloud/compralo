import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Heart, Trash2, Minus, Plus } from 'lucide-react'

interface CartItemProps {
  id: string
  name: string
  brand: string
  color: string
  size: string
  price: number
  originalPrice?: number
  quantity: number
  image: string
  onQuantityChange: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  onToggleFavorite: (id: string) => void
  isFavorite?: boolean
}

const CartItem: React.FC<CartItemProps> = ({
  id,
  name,
  brand,
  color,
  size,
  price,
  originalPrice,
  quantity,
  image,
  onQuantityChange,
  onRemove,
  onToggleFavorite,
  isFavorite = false
}) => {
  const texts = {
    size: 'Talla:',
    quantity: 'Cantidad:'
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      onQuantityChange(id, newQuantity)
    }
  }

  return (
    <div className="flex gap-6 p-6">
      {/* Imagen del producto */}
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover rounded-xl"
        />
      </div>

      {/* Información del producto */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate mb-1">
              {name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {brand}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {color}
            </p>
          </div>

          {/* Acciones del producto */}
          <div className="flex gap-2 ml-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onToggleFavorite(id)}
            >
              <Heart 
                className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}`} 
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onRemove(id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Línea de tamaño y cantidad */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{texts.size}</span>
              <select className="text-sm border-0 bg-transparent text-gray-900 dark:text-white font-medium focus:outline-none">
                <option value={size}>{size}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{texts.quantity}</span>
              <select className="text-sm border-0 bg-transparent text-gray-900 dark:text-white font-medium focus:outline-none">
                <option value={quantity}>{quantity}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Precio */}
        <div className="flex items-center gap-3">
          <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
            ${price.toFixed(2)}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default CartItem