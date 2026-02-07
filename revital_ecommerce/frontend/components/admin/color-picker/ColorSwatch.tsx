'use client'

import { ColorSwatch as AriaColorSwatch } from 'react-aria-components'
import { cn } from '@/lib/utils'

export function ColorSwatch({ className, ...props }: React.ComponentProps<typeof AriaColorSwatch>) {
  return (
    <AriaColorSwatch
      className={cn(
        'h-6 w-6 rounded border-2 border-gray-300 dark:border-gray-600',
        className
      )}
      {...props}
    />
  )
}
