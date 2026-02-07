"use client"

import * as React from "react"
import { useState } from "react"

interface ProductThumbnailsProps {
  thumbnails: string[]
  productName: string
  selectedThumbnail: number
  onThumbnailSelect: (index: number) => void
  className?: string
}

const ProductThumbnails: React.FC<ProductThumbnailsProps> = ({
  thumbnails,
  productName,
  selectedThumbnail,
  onThumbnailSelect,
  className = ""
}) => {
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

  const handleImageError = (index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: true }))
  }

  const isPlaceholder = (src: string) => 
    src.includes('placeholder.svg') || src.startsWith('/nike-airmax.png')

  return (
    <div className={`flex space-x-2 sm:space-x-3 ${className}`}>
      {thumbnails.map((thumb, index) => (
        <button
          key={index}
          onClick={() => onThumbnailSelect(index)}
          className={`relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 border-2 hover:scale-105 ${
            selectedThumbnail === index
              ? "border-white ring-2 ring-white/50 shadow-lg"
              : "border-white/30 hover:border-white/50"
          }`}
        >
          {/* Mostrar placeholder si es necesario */}
          {imageErrors[index] || isPlaceholder(thumb) ? (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-100 to-white dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 flex items-center justify-center">
              {/* Mini icono de imagen */}
              <svg 
                className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-300 opacity-60" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
            <img
              src={thumb}
              alt={`${productName} vista ${index + 1}`}
              className="w-full h-full object-cover transition-all duration-300"
              onError={() => handleImageError(index)}
            />
          )}
          
          {/* Overlay de selección */}
          {selectedThumbnail === index && (
            <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
              <div className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-white rounded-full shadow-lg"></div>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

export default ProductThumbnails 