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
  features?: Omit<Feature, 'iconBgColor'>[]
}

const defaultFeatures: Omit<Feature, 'iconBgColor'>[] = [
  {
    icon: <Truck className="h-5 w-5 text-white" />,
    title: "Envío Gratis",
    description: "En pedidos +$75",
  },
  {
    icon: <Shield className="h-5 w-5 text-white" />,
    title: "Compra Segura", 
    description: "100% Protegida",
  },
  {
    icon: <RotateCcw className="h-5 w-5 text-white" />,
    title: "Devoluciones",
    description: "30 días gratis",
  },
  {
    icon: <CreditCard className="h-5 w-5 text-white" />,
    title: "Pago Seguro",
    description: "Múltiples métodos",
  }
]

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ features = defaultFeatures }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {features.map((feature, index) => (
        <div key={index} className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors duration-300">
          <div className="p-3 bg-[#ec2538] dark:bg-red-500 rounded-full flex-shrink-0 transition-colors duration-300">
            {feature.icon}
          </div>
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-200 text-sm sm:text-base transition-colors duration-300">{feature.title}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FeaturesSection 