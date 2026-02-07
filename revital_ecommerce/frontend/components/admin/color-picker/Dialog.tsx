'use client'

import * as React from 'react'
import { Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger } from 'react-aria-components'
import { cn } from '@/lib/utils'

export function Dialog({ className, ...props }: React.ComponentProps<typeof AriaDialog>) {
  return (
    <AriaDialog
      className={cn('outline-none', className)}
      {...props}
    />
  )
}

export function DialogTrigger(props: React.ComponentProps<typeof AriaDialogTrigger>) {
  return <AriaDialogTrigger {...props} />
}
