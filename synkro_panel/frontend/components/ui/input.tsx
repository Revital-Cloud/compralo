import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs",
        "border-border/80 dark:border-border/60",
        "transition-all duration-200 outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "hover:border-border dark:hover:border-border/80",
        "focus:border-ring focus:ring-ring/50 focus:ring-[3px]",
        "aria-[invalid=true]:not(:focus):ring-destructive/20 dark:aria-[invalid=true]:not(:focus):ring-destructive/40 aria-[invalid=true]:not(:focus):border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
