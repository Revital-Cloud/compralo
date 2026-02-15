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
  /** Si se proporciona, solo el clic en la imagen grande dispara navegación; miniaturas/flechas solo cambian la imagen. */
  onMainImageClick?: () => void
}

const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productName,
  selectedIndex: controlledIndex,
  onSelectedIndexChange,
  onMainImageClick
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
      {/* Main Image: solo aquí navega al producto si onMainImageClick está definido */}
      <div
        className={cn(
          "relative aspect-square bg-gray-50 rounded-lg overflow-hidden",
          onMainImageClick && "cursor-pointer"
        )}
        onClick={onMainImageClick}
        role={onMainImageClick ? "button" : undefined}
        aria-label={onMainImageClick ? "Ver detalle del producto" : undefined}
      >
        <img
          src={images[currentImage]}
          alt={`${productName} - Vista ${currentImage + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Navigation arrows: solo cuando hay más de una imagen */}
        {images.length > 1 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation()
                prevImage()
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation()
                nextImage()
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails: todas las imágenes del producto (siempre que haya al menos una) */}
      {images.length >= 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              type="button"
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentImage(index)
              }}
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