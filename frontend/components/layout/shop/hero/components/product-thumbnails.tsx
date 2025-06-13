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
    <div className={`flex space-x-3 ${className}`}>
      {thumbnails.map((thumb, index) => (
        <button
          key={index}
          onClick={() => onThumbnailSelect(index)}
          className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden transition-all duration-300 border-2 hover:scale-105 ${
            selectedThumbnail === index
              ? "border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/50 dark:ring-blue-500/50 shadow-lg"
              : "border-white/30 dark:border-gray-600 hover:border-white/50 dark:hover:border-gray-500"
          }`}
        >
          {/* Mostrar placeholder si es necesario */}
          {imageErrors[index] || isPlaceholder(thumb) ? (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-100 to-white dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 flex items-center justify-center">
              {/* Mini icono de imagen */}
              <svg 
                className="w-6 h-6 text-gray-400 dark:text-gray-300 opacity-60" 
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
            <div className="absolute inset-0 bg-blue-400/20 dark:bg-blue-500/20 flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-500 dark:bg-blue-400 rounded-full shadow-lg"></div>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

export default ProductThumbnails 