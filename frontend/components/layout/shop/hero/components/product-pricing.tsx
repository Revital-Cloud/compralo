"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"

interface ProductPricingProps {
  price: string
  originalPrice: string
  textColor?: string
}

const ProductPricing: React.FC<ProductPricingProps> = ({ 
  price, 
  originalPrice, 
  textColor = "text-white dark:text-white" 
}) => {
  const calculateDiscount = () => {
    const originalValue = Number.parseFloat(originalPrice.slice(1))
    const currentValue = Number.parseFloat(price.slice(1))
    return Math.round(((originalValue - currentValue) / originalValue) * 100)
  }

  return (
    <div className={`flex items-center space-x-4 ${textColor}`}>
      <span className="text-3xl md:text-4xl font-bold">{price}</span>
      <span className="text-xl text-white/60 dark:text-gray-400/60 line-through">{originalPrice}</span>
      <Badge variant="destructive" className="bg-red-500 dark:bg-red-600 text-white">
        SAVE {calculateDiscount()}%
      </Badge>
    </div>
  )
}

export default ProductPricing 