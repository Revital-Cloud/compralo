"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui"
import { cn } from "@/lib/utils"

interface ProductGalleryProps {
  images: string[]
  productName: string
  /** Índice controlado desde fuera (ej. al seleccionar un color). */
  selectedIndex?: number
  /** Se llama al cambiar de imagen (flechas o miniatura). */
  onSelectedIndexChange?: (index: number) => void
}

const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productName,
  selectedIndex: controlledIndex,
  onSelectedIndexChange
}) => {
  const [internalIndex, setInternalIndex] = useState(0)
  const isControlled = controlledIndex !== undefined && controlledIndex !== null
  const currentImage = isControlled
    ? Math.min(Math.max(0, controlledIndex), Math.max(0, images.length - 1))
    : internalIndex

  const setCurrentImage = (next: number) => {
    const idx = Math.min(Math.max(0, next), Math.max(0, images.length - 1))
    if (!isControlled) setInternalIndex(idx)
    onSelectedIndexChange?.(idx)
  }

  const nextImage = () => {
    setCurrentImage((currentImage + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImage((currentImage - 1 + images.length) % images.length)
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden">
        <img
          src={images[currentImage]}
          alt={`${productName} - Vista ${currentImage + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={cn(
                "aspect-square rounded-md overflow-hidden border-2 transition-colors",
                currentImage === index
                  ? "border-primary"
                  : "border-transparent hover:border-gray-300"
              )}
            >
              <img
                src={image}
                alt={`${productName} - Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductGallery 