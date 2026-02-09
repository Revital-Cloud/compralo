'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Button } from "@/components/ui"
import { IconPackage, IconEye } from "@tabler/icons-react"
import { formatPrice } from "@/utils/format-price"

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
        <CardDescription>Top 5 por ventas</CardDescription>
      </div>
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
          <div
            key={product.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 transition-colors"
          >
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <IconPackage className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{product.name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">{product.sales} vendidos</span>
                {product.growth !== 0 && (
                  <Badge variant={product.growth > 0 ? "default" : "secondary"} className="text-xs">
                    {product.growth > 0 ? '+' : ''}{product.growth.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <p className="font-bold text-sm">{formatPrice(product.price)}</p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                asChild
              >
                <Link href="/admin/products">
                  <IconEye className="h-3 w-3 mr-1" aria-hidden />
                  Ver
                </Link>
              </Button>
            </div>
          </div>
        ))
      )}
    </CardContent>
  </Card>
)

export type { BestSeller } 