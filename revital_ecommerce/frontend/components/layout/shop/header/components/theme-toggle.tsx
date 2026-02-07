"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useThemeState } from "@/hooks/use-theme"

import { Button } from "@/components/ui"

export function ThemeToggle() {
  const { toggleTheme, currentTheme, mounted } = useThemeState()

  // Evitar hidratación incorrecta
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="p-2 text-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-gray-800 transition-colors duration-300"
        disabled
      >
        <div className="h-5 w-5 animate-pulse bg-gray-300 dark:bg-gray-600 rounded" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="p-2 text-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-gray-800 transition-colors duration-300"
      onClick={toggleTheme}
      title={`Cambiar a modo ${currentTheme === "light" ? "oscuro" : "claro"}`}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground dark:text-gray-300" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground dark:text-gray-300" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
} 