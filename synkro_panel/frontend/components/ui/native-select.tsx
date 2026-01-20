"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  sizeVariant?: "sm" | "default"
  fullWidth?: boolean
}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, sizeVariant = "default", fullWidth = false, children, ...props }, ref) => {
    return (
      <div className={cn("relative", fullWidth && "w-full")}> 
        <select
          ref={ref}
          data-slot="select-native"
          className={cn(
            "appearance-none data-placeholder:text-muted-foreground rounded-md border text-sm shadow-xs",
            "border-border/80 dark:border-border/60",
            "bg-white dark:bg-input/30",
            "transition-all duration-200 outline-none",
            "hover:border-border dark:hover:border-border/80",
            "focus:border-ring focus:ring-ring/50 focus:ring-[3px]",
            "aria-[invalid=true]:not(:focus):ring-destructive/20 dark:aria-[invalid=true]:not(:focus):ring-destructive/40 aria-[invalid=true]:not(:focus):border-destructive",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
            sizeVariant === "default" ? "h-10 pl-3 pr-8 py-2" : "h-8 pl-2.5 pr-8 py-1.5",
            "w-full",
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
NativeSelect.displayName = "NativeSelect"

export { NativeSelect }
