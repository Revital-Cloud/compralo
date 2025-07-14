"use client"

import * as React from "react"

interface ProductCounterProps {
  currentSlide: number
  totalSlides: number
}

const ProductCounter: React.FC<ProductCounterProps> = ({ currentSlide, totalSlides }) => (
  <div className="absolute top-8 right-8 bg-gray-800/40 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
    {currentSlide + 1} / {totalSlides}
  </div>
)

export default ProductCounter 