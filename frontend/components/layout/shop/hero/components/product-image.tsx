"use client"

import * as React from "react"
import { useState } from "react"
import Image from "next/image"

interface ProductImageProps {
  src: string
  alt: string
  className?: string
}

const ProductImage: React.FC<ProductImageProps> = ({ 
  src, 
  alt, 
  className = "" 
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

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
      <div className={`relative w-80 h-80 lg:w-96 lg:h-96 ${className}`}>
        {/* Placeholder con gradiente atractivo */}
        <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-100 to-white dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 rounded-2xl shadow-2xl flex items-center justify-center border border-gray-200 dark:border-gray-600">
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-2xl"></div>
          
          {/* Contenido del placeholder */}
          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-300 space-y-4">
            {/* Icono de imagen */}
            <svg 
              className="w-16 h-16 opacity-60" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            
            {/* Texto */}
            <div className="text-center">
              <p className="text-sm font-medium">Imagen del producto</p>
              <p className="text-xs opacity-75">{alt}</p>
            </div>
          </div>
          
          {/* Efecto de resplandor */}
          <div className="absolute inset-0 rounded-2xl shadow-inner opacity-30"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-80 h-80 lg:w-96 lg:h-96 ${className}`}>
      {/* Loading placeholder */}
      {imageLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl animate-pulse"></div>
      )}
      
      {/* Imagen real */}
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain drop-shadow-2xl transition-all duration-700 hover:scale-105"
        onError={handleImageError}
        onLoad={handleImageLoad}
        priority
      />
      
      {/* Efecto de resplandor alrededor de la imagen */}
      <div className="absolute inset-0 rounded-2xl shadow-2xl opacity-20 bg-gradient-to-tr from-white/50 via-transparent to-white/30"></div>
    </div>
  )
}

export default ProductImage 