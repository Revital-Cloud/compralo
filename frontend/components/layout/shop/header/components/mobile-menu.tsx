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
  pathname?: string
}

export function MobileMenu({ isOpen, onClose, items = [], pathname }: MobileMenuProps) {
  const { theme } = useTheme()

  if (!isOpen) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-y-auto p-4 sm:p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80",
        "lg:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-colors duration-300"
      )}
    >
      <div className="relative z-20 grid gap-4 sm:gap-6 rounded-md bg-white dark:bg-gray-800 p-3 sm:p-4 text-gray-900 dark:text-white shadow-lg dark:shadow-gray-900/25 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        {/* Navigation Items - Solo navegación del sitio */}
        <nav className="grid grid-flow-row auto-rows-max text-sm">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href || ""}
              className={cn(
                "flex w-full items-center rounded-md p-2 text-xs sm:text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#ec2538] dark:hover:text-red-500 transition-colors duration-300",
                pathname === item.href ? "text-[#ec2538] dark:text-red-500 font-semibold" : "text-gray-700 dark:text-gray-300"
              )}
              onClick={onClose}
            >
              {item.text}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
} 