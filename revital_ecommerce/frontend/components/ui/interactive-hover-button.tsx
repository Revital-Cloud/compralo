import * as React from "react"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

function innerContent(
  children: React.ReactNode,
  textColor?: string,
  hoverColor?: string,
  hoverBackgroundColor?: string
) {
  const overlayTextColor = hoverColor ?? textColor
  return (
    <>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "h-2 w-2 rounded-full transition-all duration-300 group-hover:scale-[100.8]",
            !textColor && "bg-primary"
          )}
          style={textColor ? { backgroundColor: textColor } : undefined}
        />
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </div>
      <div
        className={cn(
          "absolute inset-0 z-10 flex h-full w-full items-center justify-center gap-2 rounded-full opacity-0 transition-all duration-300 translate-x-full group-hover:translate-x-0 group-hover:opacity-100",
          !overlayTextColor && "text-primary-foreground"
        )}
        style={{
          ...(overlayTextColor ? { color: overlayTextColor } : undefined),
          ...(hoverBackgroundColor ? { backgroundColor: hoverBackgroundColor } : undefined),
        }}
      >
        <span>{children}</span>
        <ArrowRight className="shrink-0" />
      </div>
    </>
  )
}

type InteractiveHoverButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string
  target?: string
  rel?: string
  /** Color de fondo del botón (hex o nombre CSS). */
  backgroundColor?: string
  /** Color del texto (y del punto / hover). */
  color?: string
  /** Color del borde (por defecto igual que color si se indica). */
  borderColor?: string
  /** Color de fondo en hover (overlay). */
  hoverBackgroundColor?: string
  /** Color del texto/icono en hover. */
  hoverColor?: string
  /** Color del borde en hover. */
  hoverBorderColor?: string
}

export function InteractiveHoverButton({
  children,
  className,
  href,
  target,
  rel,
  backgroundColor,
  color,
  borderColor,
  hoverBackgroundColor,
  hoverColor,
  hoverBorderColor,
  style: styleProp,
  ...props
}: InteractiveHoverButtonProps) {
  const baseClass = cn(
    "group relative w-auto cursor-pointer overflow-hidden rounded-full border py-3 px-7 text-center font-semibold text-sm transition-[border-color] duration-300",
    !backgroundColor && "bg-background",
    !color && "[&_.text-primary-foreground]:text-primary-foreground",
    hoverBorderColor && "hover:border-[var(--hover-border)]",
    className
  )

  const style: React.CSSProperties = { ...styleProp }
  if (backgroundColor) style.backgroundColor = backgroundColor
  if (color) style.color = color
  if (borderColor ?? color) style.borderColor = borderColor ?? color
  if (hoverBorderColor) (style as Record<string, unknown>)["--hover-border"] = hoverBorderColor
  const hasStyle = Object.keys(style).length > 0

  const content = innerContent(children, color, hoverColor, hoverBackgroundColor)

  if (href) {
    return (
      <a
        href={href}
        target={target ?? "_blank"}
        rel={rel ?? "noopener noreferrer"}
        className={baseClass}
        style={hasStyle ? style : undefined}
      >
        {content}
      </a>
    )
  }

  return (
    <button type="button" className={baseClass} style={hasStyle ? style : undefined} {...props}>
      {content}
    </button>
  )
}
