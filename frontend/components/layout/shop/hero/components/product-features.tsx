"use client"

import * as React from "react"
import { Zap, Star } from "lucide-react"

interface Feature {
  icon: React.ReactNode
  text: string
}

interface ProductFeaturesProps {
  features?: Feature[]
  textColor?: string
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
  textColor = "text-white dark:text-gray-300" 
}) => (
  <div className={`flex items-center space-x-6 pt-4 text-sm opacity-80 ${textColor}`}>
    {features.map((feature, index) => (
      <div key={index} className="flex items-center space-x-2">
        {feature.icon}
        <span>{feature.text}</span>
      </div>
    ))}
  </div>
)

export default ProductFeatures 