"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  sizeVariant?: "sm" | "default"
  fullWidth?: boolean
}

const Select = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, sizeVariant = "default", fullWidth = false, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          data-slot="select-native"
          className={cn(
            "appearance-none border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 rounded-md border bg-transparent text-sm shadow-xs transition-all duration-200 outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
            sizeVariant === "default" ? "h-10 px-3 py-2" : "h-8 px-2.5 py-1.5",
            fullWidth ? "w-full" : "w-[140px] sm:w-[180px]",
            "hover:border-ring/50 focus:border-ring",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className={cn(
          "absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none transition-colors",
          props.disabled ? "text-muted-foreground/50" : "text-muted-foreground"
        )} />
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }