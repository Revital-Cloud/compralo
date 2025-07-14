"use client"

import * as React from "react"
import { Zap, Star } from "lucide-react"

interface Feature {
  icon: React.ReactNode
  text: string
}

interface ProductFeaturesProps {
  features?: Feature[]
  isMobile?: boolean
}

const defaultFeatures: Feature[] = [
  {
    icon: <Zap className="w-4 h-4" />,
    text: "Free Shipping"
  },
  {
    icon: <Star className="w-4 h-4 fill-current" />,
    text: "4.8/5 Rating"
  }
]

const ProductFeatures: React.FC<ProductFeaturesProps> = ({ 
  features = defaultFeatures, 
  isMobile = false
}) => (
  <div className={`flex items-center opacity-80 ${
    isMobile 
      ? 'space-x-4 text-sm justify-center pt-2' 
      : 'space-x-6 pt-4 text-sm'
  }`}>
    {features.map((feature, index) => (
      <div key={index} className="flex items-center space-x-2">
        <span className={isMobile ? 'text-xs' : ''}>{feature.icon}</span>
        <span className={isMobile ? 'text-xs' : ''}>{feature.text}</span>
      </div>
    ))}
  </div>
)

export default ProductFeatures 