"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui"
import { Badge } from "@/components/ui"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/utils/format-price"

interface RelatedProduct {
  id: number
  name: string
  price: number
  originalPrice?: number
  image: string
  badge?: string
  badgeColor?: string
  /** Slug para enlazar al detalle: id_categoria-id_linea-id_sublinea-id_producto */
  slug?: string
}

interface RelatedProductsProps {
  title?: string
  products: RelatedProduct[]
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({
  title = "También te puede gustar",
  products
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Responsive items per view
  const getItemsPerView = () => {
    if (typeof window === 'undefined') return 2
    if (window.innerWidth >= 1024) return 4 // lg
    if (window.innerWidth >= 768) return 3  // md
    return 2 // sm and below
  }
  
  const [itemsPerView, setItemsPerView] = useState(getItemsPerView())
  const maxIndex = Math.max(0, products.length - itemsPerView)

  useEffect(() => {
    const onResize = () => setItemsPerView(getItemsPerView())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const getBadgeVariant = (color?: string) => {
    switch (color) {
      case 'blue': return 'default'
      case 'green': return 'secondary'
      case 'red': return 'destructive'
      case 'orange': return 'outline'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        
        {/* Navigation - Hidden on mobile */}
        <div className="hidden sm:flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="relative overflow-hidden">
        <div
          className="flex flex-shrink-0 transition-transform duration-300 ease-in-out"
          style={{
            width: `${(100 / itemsPerView) * products.length}%`,
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
          }}
        >
          {products.map((product) => {
            const href = product.slug ? `/products/${product.slug}` : "#"
            const content = (
              <>
                <div className="relative aspect-square bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden mb-3">
                  {product.badge && (
                    <Badge 
                      variant={getBadgeVariant(product.badgeColor)}
                      className="absolute top-2 left-2 z-10"
                    >
                      {product.badge}
                    </Badge>
                  )}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice != null && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    Ver producto
                  </Button>
                </div>
              </>
            )
            return (
              <div
                key={product.slug ?? product.id}
                className="w-1/2 md:w-1/3 lg:w-1/4 flex-shrink-0 px-2"
              >
                <div className="group cursor-pointer">
                  {product.slug ? (
                    <Link href={href} className="block">
                      {content}
                    </Link>
                  ) : (
                    <div>{content}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dots Indicator - solo si hay más de una página */}
      {products.length > 0 && maxIndex > 0 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                currentIndex === index
                  ? "bg-gray-900 dark:bg-white"
                  : "bg-gray-300 dark:bg-gray-600"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default RelatedProducts 