"use client"

import * as React from "react"
import {
  CreditCard,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react"

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
  iconBgColor: string
}

interface FeaturesSectionProps {
  features?: Feature[]
}

const defaultFeatures: Feature[] = [
  {
    icon: <Truck className="h-5 w-5 text-white" />,
    title: "Envío Gratis",
    description: "En pedidos +$75",
    iconBgColor: "bg-blue-600"
  },
  {
    icon: <Shield className="h-5 w-5 text-white" />,
    title: "Compra Segura", 
    description: "100% Protegida",
    iconBgColor: "bg-green-600"
  },
  {
    icon: <RotateCcw className="h-5 w-5 text-white" />,
    title: "Devoluciones",
    description: "30 días gratis",
    iconBgColor: "bg-purple-600"
  },
  {
    icon: <CreditCard className="h-5 w-5 text-white" />,
    title: "Pago Seguro",
    description: "Múltiples métodos",
    iconBgColor: "bg-orange-600"
  }
]

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ features = defaultFeatures }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {features.map((feature, index) => (
        <div key={index} className="flex items-center gap-4 p-4 bg-gray-800/30 dark:bg-gray-700/30 rounded-lg">
          <div className={`p-3 ${feature.iconBgColor} rounded-full flex-shrink-0`}>
            {feature.icon}
          </div>
          <div>
            <p className="font-medium text-white dark:text-white text-sm sm:text-base">{feature.title}</p>
            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FeaturesSection 