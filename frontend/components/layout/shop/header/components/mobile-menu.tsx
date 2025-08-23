"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { type NavItem } from "@/lib/menu-config"
import { cn } from "@/lib/utils"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  items?: NavItem[]
}

export function MobileMenu({ isOpen, onClose, items = [] }: MobileMenuProps) {
  const { theme } = useTheme()

  if (!isOpen) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-y-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80",
        "lg:hidden"
      )}
    >
      <div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md">
        <nav className="grid grid-flow-row auto-rows-max text-sm">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline",
              )}
              onClick={onClose}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
} 