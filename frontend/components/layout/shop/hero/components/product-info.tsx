"use client"

import * as React from "react"

interface ProductInfoProps {
  name: string
  subtitle: string
  textColor?: string
}

const ProductInfo: React.FC<ProductInfoProps> = ({ 
  name, 
  subtitle, 
  textColor = "text-white dark:text-white" 
}) => (
  <div className={`space-y-4 ${textColor}`}>
    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
      {name}
    </h1>
    <p className="text-lg md:text-xl opacity-90 max-w-lg leading-relaxed">
      {subtitle}
    </p>
  </div>
)

export default ProductInfo 