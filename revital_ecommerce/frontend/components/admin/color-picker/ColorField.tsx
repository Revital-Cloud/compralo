'use client'

import * as React from 'react'
import { ColorField as AriaColorField, Input, Label } from 'react-aria-components'
import { cn } from '@/lib/utils'

interface ColorFieldProps extends React.ComponentProps<typeof AriaColorField> {
  label?: string
}

export function ColorField({ label, className, ...props }: ColorFieldProps) {
  return (
    <AriaColorField className={cn('flex flex-col gap-1', className)} {...props}>
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <Input className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" />
    </AriaColorField>
  )
}
