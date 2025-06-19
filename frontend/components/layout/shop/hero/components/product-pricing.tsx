"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"

interface ProductPricingProps {
  price: string
  originalPrice: string
  textColor?: string
  isMobile?: boolean
}

const ProductPricing: React.FC<ProductPricingProps> = ({ 
  price, 
  originalPrice, 
  textColor = "text-white dark:text-white",
  isMobile = false
}) => {
  const calculateDiscount = () => {
    const originalValue = Number.parseFloat(originalPrice.slice(1))
    const currentValue = Number.parseFloat(price.slice(1))
    return Math.round(((originalValue - currentValue) / originalValue) * 100)
  }

  return (
    <div className={`flex items-center space-x-3 sm:space-x-4 ${textColor} ${isMobile ? 'justify-center flex-wrap gap-2' : ''}`}>
      <span className={`font-bold ${
        isMobile 
          ? "text-2xl sm:text-3xl" 
          : "text-3xl md:text-4xl"
      }`}>
        {price}
      </span>
      <span className={`text-white/60 dark:text-gray-400/60 line-through ${
        isMobile 
          ? "text-lg sm:text-xl" 
          : "text-xl"
      }`}>
        {originalPrice}
      </span>
      <Badge variant="destructive" className={`bg-red-500 dark:bg-red-600 text-white ${
        isMobile ? 'text-xs px-2 py-1' : ''
      }`}>
        SAVE {calculateDiscount()}%
      </Badge>
    </div>
  )
}

export default ProductPricing 