'use client'

import * as React from 'react'
import { Popover as AriaPopover } from 'react-aria-components'
import { cn } from '@/lib/utils'

export function Popover({ className, ...props }: React.ComponentProps<typeof AriaPopover>) {
  return (
    <AriaPopover
      className={cn(
        'z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none',
        'data-[entering]:animate-in data-[exiting]:animate-out',
        'data-[entering]:fade-in-0 data-[exiting]:fade-out-0',
        'data-[exiting]:zoom-out-95 data-[entering]:zoom-in-95',
        className
      )}
      {...props}
    />
  )
}
