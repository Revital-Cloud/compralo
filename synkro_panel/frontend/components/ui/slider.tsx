"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type SliderValue = number | [number, number]

type NativeSliderProps = {
  value: SliderValue
  onValueChange: (value: [number, number]) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

const Slider = ({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: NativeSliderProps) => {
  const isRange = Array.isArray(value)
  const [minVal, maxVal] = isRange ? value : [value as number, value as number]

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Math.min(Number(e.target.value), maxVal)
    onValueChange([next, maxVal])
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Math.max(Number(e.target.value), minVal)
    onValueChange([minVal, next])
  }

  return (
    <div
      data-slot="slider-native"
      className={cn("w-full", className)}
    >
      {isRange ? (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={minVal}
            onChange={handleMinChange}
            className="w-full"
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={maxVal}
            onChange={handleMaxChange}
            className="w-full"
          />
        </div>
      ) : (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={(e) => onValueChange([Number(e.target.value), Number(e.target.value)])}
          className="w-full"
        />
      )}
    </div>
  )
}

export { Slider }
