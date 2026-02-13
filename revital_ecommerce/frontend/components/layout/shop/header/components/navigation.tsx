"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui"
import { cn } from "@/lib/utils"
import { type NavItem } from "@/lib/menu-config"

interface NavigationProps {
  items?: NavItem[]
  onItemClick?: () => void
}

export function Navigation({ items = [], onItemClick }: NavigationProps) {
  const { theme } = useTheme()

  if (!items.length) {
    return null
  }

  return (
    <nav className="hidden lg:flex items-center gap-6">
      {items.map((item, index) => {
        const hasChildren = item.items && item.items.length > 0
        const itemClasses = cn(
          "flex items-center text-sm font-medium transition-colors",
          "hover:text-primary",
          "text-foreground/80"
        )

        if (hasChildren) {
          return (
            <DropdownMenu key={index}>
              <DropdownMenuTrigger className={itemClasses}>
                <span>{item.text}</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {item.items!.map((child, childIndex) => (
                  <DropdownMenuItem key={childIndex} asChild>
                    <Link href={child.href} onClick={onItemClick}>{child.text}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }

        return (
          <Link
            key={index}
            href={item.href ?? "#"}
            className={itemClasses}
            onClick={onItemClick}
          >
            {item.text}
          </Link>
        )
      })}
    </nav>
  )
} 