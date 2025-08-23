"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface NavigationButtonsProps {
  onPrev: () => void
  onNext: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onPrev,
  onNext,
  onMouseEnter,
  onMouseLeave
}) => (
  <>
    <button
      onClick={onPrev}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute left-6 top-1/2 -translate-y-1/2 bg-gray-800/40 hover:bg-gray-700/60 backdrop-blur-sm text-white p-4 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
      aria-label="Previous product"
    >
      <ChevronLeft className="w-6 h-6" />
    </button>

    <button
      onClick={onNext}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute right-6 top-1/2 -translate-y-1/2 bg-gray-800/40 hover:bg-gray-700/60 backdrop-blur-sm text-white p-4 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
      aria-label="Next product"
    >
      <ChevronRight className="w-6 h-6" />
    </button>
  </>
)

export default NavigationButtons 