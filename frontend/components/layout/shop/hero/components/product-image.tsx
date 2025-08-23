"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"

interface ProductImageProps {
  src: string
  alt: string
  className?: string
}

const ProductImage: React.FC<ProductImageProps> = ({ 
  src, 
  alt, 
  className = "w-80 h-80 lg:w-96 lg:h-96" 
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [currentSrc, setCurrentSrc] = useState(src)

  // Reset states when src changes
  useEffect(() => {
    if (src !== currentSrc) {
      setImageLoading(true)
      setImageError(false)
      setCurrentSrc(src)
    }
  }, [src, currentSrc])

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  // Mostrar placeholder si hay error de imagen o si la imagen es un placeholder
  if (imageError || src.includes('placeholder.svg') || src.startsWith('/nike-airmax.png')) {
    return (
      <div className={`relative transition-all duration-500 ease-in-out ${className}`}>
        {/* Placeholder con gradiente atractivo */}
        <div className="w-full h-full bg-gradient-to-br from-secondary via-muted to-background rounded-2xl shadow-2xl flex items-center justify-center border border-border transition-all duration-300">
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-2xl"></div>
          
          {/* Contenido del placeholder */}
          <div className="flex flex-col items-center justify-center text-muted-foreground space-y-3 sm:space-y-4 px-4">
            {/* Icono de imagen */}
            <svg 
              className="w-12 h-12 sm:w-16 sm:h-16 opacity-60 transition-all duration-300" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            
            {/* Texto */}
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium">Imagen del producto</p>
              <p className="text-xs opacity-75 max-w-32 truncate">{alt}</p>
            </div>
          </div>
          
          {/* Efecto de resplandor */}
          <div className="absolute inset-0 rounded-2xl shadow-inner opacity-30"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative transition-all duration-500 ease-in-out ${className}`}>
      {/* Loading placeholder */}
      {imageLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted rounded-2xl animate-pulse z-10"></div>
      )}
      
      {/* Imagen real */}
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-contain drop-shadow-2xl transition-all duration-700 hover:scale-105 ${
          imageLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        priority
        sizes="(max-width: 640px) 256px, (max-width: 1024px) 320px, 384px"
      />
      
      {/* Efecto de resplandor alrededor de la imagen */}
      <div className="absolute inset-0 rounded-2xl shadow-2xl opacity-20 bg-gradient-to-tr from-white/50 via-transparent to-white/30 transition-all duration-300"></div>
    </div>
  )
}

export default ProductImage 