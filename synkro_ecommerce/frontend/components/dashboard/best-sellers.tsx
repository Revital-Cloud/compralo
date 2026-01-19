'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Button } from "@/components/ui"
import { IconPackage, IconEye, IconDots } from "@tabler/icons-react"

interface BestSeller {
  id: string
  name: string
  price: number
  sales: string
  growth: number
  category: string
  image?: string
}

interface BestSellersProps {
  bestSellers: BestSeller[]
  loading: boolean
}

export const BestSellers = ({ bestSellers, loading }: BestSellersProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <div>
        <CardTitle>Productos Destacados</CardTitle>
        <CardDescription>Artículos con mejor rendimiento</CardDescription>
      </div>
      <Button variant="ghost" size="sm">
        <IconDots className="h-4 w-4" />
      </Button>
    </CardHeader>
    <CardContent className="space-y-4">
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="w-16 h-8 bg-gray-200 rounded" />
          </div>
        ))
      ) : (
        bestSellers.map((product, index) => (
          <div key={product.id} className="flex items-center space-x-3 group hover:bg-gray-50 p-2 rounded-lg transition-colors">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <IconPackage className="h-6 w-6 text-blue-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{product.name}</p>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-muted-foreground">{product.sales}</p>
                <Badge variant={product.growth > 0 ? "default" : "secondary"} className="text-xs">
                  {product.growth > 0 ? '+' : ''}{product.growth.toFixed(1)}%
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">${product.price.toFixed(2)}</p>
              <Button variant="outline" size="sm" className="text-xs h-6 px-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <IconEye className="h-3 w-3 mr-1" />
                Ver
              </Button>
            </div>
          </div>
        ))
      )}
    </CardContent>
  </Card>
)

export type { BestSeller } 