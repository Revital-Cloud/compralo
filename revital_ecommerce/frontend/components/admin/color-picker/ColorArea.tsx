'use client'

import * as React from 'react'
import { ColorArea as AriaColorArea, ColorThumb } from 'react-aria-components'
import { cn } from '@/lib/utils'

export function ColorArea({ className, ...props }: React.ComponentProps<typeof AriaColorArea>) {
  return (
    <AriaColorArea
      className={cn(
        'w-full h-48 rounded border border-gray-300 dark:border-gray-600 relative',
        'cursor-crosshair',
        className
      )}
      {...props}
    >
      <ColorThumb className="w-5 h-5 border-2 border-white rounded-full shadow-lg" />
    </AriaColorArea>
  )
}
