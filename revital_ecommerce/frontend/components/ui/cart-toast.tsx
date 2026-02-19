"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Check, ShoppingCart, X } from "lucide-react"
import { Button } from "@/components/ui"
import { useEffect } from "react"
import { formatPrice } from "@/utils/format-price"

interface CartToastProps {
  isVisible: boolean
  productName: string
  productImage: string
  price: number
  originalPrice?: number
  discountPercentage?: number
  selectedColor?: string
  selectedSize?: string
  onClose: () => void
  onViewCart?: () => void
}

const CartToast: React.FC<CartToastProps> = ({
  isVisible,
  productName,
  productImage,
  price,
  originalPrice,
  discountPercentage,
  selectedColor,
  selectedSize,
  onClose,
  onViewCart
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000) // Auto close after 5 seconds
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed top-4 right-4 z-50 w-80"
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-green-800 dark:text-green-400 text-sm">
                  ¡Agregado al carrito!
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <div className="flex gap-3">
                <img
                  src={productImage}
                  alt={productName}
                  className="w-16 h-16 object-cover rounded-md bg-gray-100"
                />
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                    {productName}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatPrice(price)}
                    </p>
                    {originalPrice != null && originalPrice > price && (
                      <>
                        <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                          {formatPrice(originalPrice)}
                        </span>
                        {discountPercentage != null && discountPercentage > 0 && (
                          <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">
                            -{discountPercentage}%
                          </span>
                        )}
                      </>
                    )}
                  </div>
                                     {(selectedColor || selectedSize) && (
                     <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                       {selectedColor && <p>Color: <span className="capitalize">{selectedColor}</span></p>}
                       {selectedSize && <p>Talla: {selectedSize}</p>}
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex-1 text-xs rounded-lg font-medium border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Continuar comprando
              </Button>
              <Button
                size="sm"
                onClick={onViewCart}
                className="flex-1 text-xs bg-black text-white hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg font-medium"
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                Ver carrito
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CartToast 