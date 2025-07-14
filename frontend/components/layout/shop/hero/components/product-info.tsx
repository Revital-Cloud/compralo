"use client"

import * as React from "react"

interface ProductInfoProps {
  name: string
  subtitle: string
  isMobile?: boolean
}

const ProductInfo: React.FC<ProductInfoProps> = ({ 
  name, 
  subtitle, 
  isMobile = false
}) => (
  <div className={`space-y-3 sm:space-y-4 ${isMobile ? 'text-center' : ''}`}>
    <h1 className={`font-black leading-tight tracking-tight ${
      isMobile 
        ? "text-3xl sm:text-4xl md:text-5xl" 
        : "text-5xl md:text-6xl lg:text-7xl"
    }`}>
      {name}
    </h1>
    <p className={`opacity-90 leading-relaxed ${
      isMobile 
        ? "text-base sm:text-lg max-w-xs sm:max-w-sm mx-auto" 
        : "text-lg md:text-xl max-w-lg"
    }`}>
      {subtitle}
    </p>
  </div>
)

export default ProductInfo 