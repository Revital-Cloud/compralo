'use client'

import * as React from 'react'
import { ColorSlider as AriaColorSlider, SliderTrack, ColorThumb } from 'react-aria-components'
import { cn } from '@/lib/utils'

export function ColorSlider({ className, channel, ...props }: React.ComponentProps<typeof AriaColorSlider>) {
  return (
    <AriaColorSlider
      className={cn(
        'w-full h-8 rounded border border-gray-300 dark:border-gray-600 relative',
        'cursor-pointer',
        className
      )}
      channel={channel}
      {...props}
    >
      <SliderTrack className="h-full w-full rounded relative">
        <ColorThumb className="w-5 h-5 border-2 border-white rounded-full shadow-lg" />
      </SliderTrack>
    </AriaColorSlider>
  )
}
