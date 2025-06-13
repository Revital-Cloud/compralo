"use client"

import * as React from "react"

interface SlideIndicatorsProps {
  totalSlides: number
  currentSlide: number
  onSlideChange: (index: number) => void
}

const SlideIndicators: React.FC<SlideIndicatorsProps> = ({
  totalSlides,
  currentSlide,
  onSlideChange
}) => (
  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3">
    {Array.from({ length: totalSlides }, (_, index) => (
      <button
        key={index}
        onClick={() => onSlideChange(index)}
        className={`transition-all duration-300 rounded-full ${
          index === currentSlide 
            ? "bg-white dark:bg-blue-400 w-12 h-3" 
            : "bg-white/40 dark:bg-gray-400/40 hover:bg-white/60 dark:hover:bg-gray-400/60 w-3 h-3"
        }`}
        aria-label={`Go to product ${index + 1}`}
      />
    ))}
  </div>
)

export default SlideIndicators 