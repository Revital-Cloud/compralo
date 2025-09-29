"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  sizeVariant?: "sm" | "default"
}

const Select = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, sizeVariant = "default", children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        data-slot="select-native"
        className={cn(
          "border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 w-[140px] sm:w-[180px] rounded-md border bg-transparent text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          sizeVariant === "default" ? "h-9 px-3 py-2" : "h-8 px-2.5 py-1.5",
          className
        )}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

export { Select }