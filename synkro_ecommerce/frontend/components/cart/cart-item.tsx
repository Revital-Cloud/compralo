import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Badge } from "@/components/ui"
import { Trash2, Minus, Plus } from 'lucide-react'
import { Input } from "@/components/ui"
import { formatPrice } from '@/utils/format-price'
import { toast } from 'sonner'
import { CART_LIMITS } from '@/services/cart.service'

interface CartItemProps {
  id: string
  productId?: number
  productSlug?: string
  name: string
  brand: string
  /** Opciones elegidas por el cliente (ej. { color: "rojo", talla: "39" }). Se muestran de forma genérica. */
  opciones_elegidas?: Record<string, string>
  /** @deprecated Usar opciones_elegidas. Se mantiene por compatibilidad. */
  color?: string
  /** @deprecated Usar opciones_elegidas. Se mantiene por compatibilidad. */
  size?: string
  price: number
  originalPrice?: number
  /** Porcentaje de descuento aplicado (ej. 25 para "25% OFF") */
  discountPercentage?: number
  quantity: number
  image: string
  stock_disponible?: number
  cartTotal?: number
  onQuantityChange: (id: string, quantity: number, stock_disponible?: number) => void
  onRemove: (id: string) => void
}

const CartItem: React.FC<CartItemProps> = ({
  id,
  productId,
  productSlug,
  name,
  brand,
  opciones_elegidas = {},
  color: colorLegacy,
  size: sizeLegacy,
  price,
  originalPrice,
  discountPercentage,
  quantity,
  image,
  stock_disponible,
  cartTotal = 0,
  onQuantityChange,
  onRemove
}) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  
  // Deshabilitar "+" si el siguiente incremento excede stock o el límite de carrito
  const isPlusDisabled = (() => {
    const exceedsStock = stock_disponible !== undefined && quantity >= stock_disponible
    const currentItemTotal = price * quantity
    const nextItemTotal = price * (quantity + 1)
    const totalWithoutCurrentItem = (cartTotal || 0) - currentItemTotal
    const nextTotal = totalWithoutCurrentItem + nextItemTotal
    const exceedsLimit = nextTotal > CART_LIMITS.MAX_TOTAL
    return isUpdating || exceedsStock || exceedsLimit
  })()

  const plusDisabledReason = (() => {
    if (isUpdating) return null
    if (stock_disponible !== undefined && quantity >= stock_disponible) {
      return `Stock insuficiente. Solo hay ${stock_disponible} unidades disponibles`
    }
    const currentItemTotal = price * quantity
    const nextItemTotal = price * (quantity + 1)
    const totalWithoutCurrentItem = (cartTotal || 0) - currentItemTotal
    const nextTotal = totalWithoutCurrentItem + nextItemTotal
    if (nextTotal > CART_LIMITS.MAX_TOTAL) {
      return `Límite de carrito alcanzado. El máximo permitido es ${formatPrice(CART_LIMITS.MAX_TOTAL)}`
    }
    return null
  })()
  
  const texts = { quantity: 'Cantidad:' }
  const opts = Object.keys(opciones_elegidas).length > 0
    ? opciones_elegidas
    : { ...(sizeLegacy && { talla: sizeLegacy }), ...(colorLegacy && { color: colorLegacy }) }

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity !== quantity) {
      // Validar stock disponible
      if (stock_disponible !== undefined && newQuantity > stock_disponible) {
        toast.error(`Stock insuficiente. Solo hay ${stock_disponible} unidades disponibles`)
        return
      }
      
      // Validar límite del carrito
      const currentItemTotal = price * quantity
      const newItemTotal = price * newQuantity
      const totalWithoutCurrentItem = cartTotal - currentItemTotal
      const newTotal = totalWithoutCurrentItem + newItemTotal
      
      if (newTotal > CART_LIMITS.MAX_TOTAL) {
        toast.error(`Límite de carrito alcanzado. El máximo permitido es ${formatPrice(CART_LIMITS.MAX_TOTAL)}`)
        return
      }
      
      setIsUpdating(true)
      try {
        await onQuantityChange(id, newQuantity, stock_disponible)
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleRemove = async () => {
    setIsUpdating(true)
    try {
      await onRemove(id)
    } finally {
      setIsUpdating(false)
    }
  }


  // Debug: verificar si productId se está pasando
  console.log('CartItem productId:', productId, 'name:', name)

  const handleImageClick = () => {
    const slug = productSlug || (productId ? String(productId) : undefined)
    if (slug) {
      console.log('Navigating to product slug:', slug)
      router.push(`/products/${slug}`)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
      {/* Imagen del producto */}
      <div className="relative w-full h-32 sm:w-24 sm:h-24 md:w-32 md:h-32 flex-shrink-0 mx-auto sm:mx-0">
        <div 
          onClick={handleImageClick}
          className={`${productId ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
        >
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover rounded-xl"
          />
        </div>
      </div>

      {/* Información del producto */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white break-words mb-1">
              {name}
            </h3>
            {brand && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {brand}
              </p>
            )}
          </div>

          {/* Acciones del producto */}
          <div className="flex gap-2 justify-end sm:justify-start">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={handleRemove}
              disabled={isUpdating}
            >
              <Trash2 className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Opciones elegidas (color, talla, etc.) y stock */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mb-4">
          {Object.entries(opts).length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {Object.entries(opts).map(([key, value]) =>
                value ? (
                  <span key={key} className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{value}</span>
                  </span>
                ) : null
              )}
            </div>
          )}
          {stock_disponible !== undefined && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              (Stock: {stock_disponible})
            </span>
          )}
        </div>

        {/* Control de cantidad */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">{texts.quantity}</span>
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md w-fit">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={isUpdating || quantity <= 1}
            >
              <Minus className="h-2.5 w-2.5" />
            </Button>
            
            <Input
              type="number"
              value={quantity}
              onChange={(e) => {
                const newQuantity = parseInt(e.target.value) || 1
                if (newQuantity >= 1) {
                  handleQuantityChange(newQuantity)
                }
              }}
              className="w-12 h-6 text-center border-0 focus:ring-0 text-xs"
              min="1"
              disabled={isUpdating}
            />
            
            <span
              onClick={() => {
                if (isPlusDisabled && plusDisabledReason) {
                  toast.error(plusDisabledReason)
                }
              }}
              className={isPlusDisabled ? 'cursor-not-allowed' : ''}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={isPlusDisabled}
              >
                <Plus className="h-2.5 w-2.5" />
              </Button>
            </span>
          </div>
        </div>


        {/* Precio: mismo patrón que product-info / product-card (precio final, original tachado, % OFF) */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white">
            {formatPrice(price)}
          </span>
          {originalPrice != null && originalPrice > price && (
            <>
              <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
              {(discountPercentage != null && discountPercentage > 0) && (
                <Badge variant="destructive" className="text-xs shrink-0">
                  -{discountPercentage}% OFF
                </Badge>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CartItem