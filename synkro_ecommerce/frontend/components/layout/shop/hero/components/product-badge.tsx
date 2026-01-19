"use client"

import * as React from "react"
import { Award } from "lucide-react"
import { Badge } from "@/components/ui"

interface ProductBadgeProps {
  badge: string
  icon?: React.ReactNode
}

const ProductBadge: React.FC<ProductBadgeProps> = ({ badge, icon = <Award className="w-4 h-4 mr-2" /> }) => (
  <div className="flex items-start">
    <Badge
      className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-sm font-medium"
    >
      {icon}
      {badge}
    </Badge>
  </div>
)

export default ProductBadge 