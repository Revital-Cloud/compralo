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
    icon: <Truck className="h-5 w-5 text-primary-foreground" />,
    title: "Envío Gratis",
    description: "En pedidos +$75",
  },
  {
    icon: <Shield className="h-5 w-5 text-primary-foreground" />,
    title: "Compra Segura", 
    description: "100% Protegida",
  },
  {
    icon: <RotateCcw className="h-5 w-5 text-primary-foreground" />,
    title: "Devoluciones",
    description: "30 días gratis",
  },
  {
    icon: <CreditCard className="h-5 w-5 text-primary-foreground" />,
    title: "Pago Seguro",
    description: "Múltiples métodos",
  }
]

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ features = defaultFeatures }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {features.map((feature, index) => (
        <div key={index} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <div className="p-3 bg-primary rounded-full flex-shrink-0">
            {feature.icon}
          </div>
          <div>
            <p className="font-medium text-muted-foreground text-sm sm:text-base">{feature.title}</p>
            <p className="text-xs sm:text-sm text-muted-foreground/80">{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FeaturesSection 