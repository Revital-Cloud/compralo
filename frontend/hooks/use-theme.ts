"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function useThemeState() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evitar hidratación incorrecta
  useEffect(() => {
    setMounted(true)
  }, [])

  // Función para alternar entre light y dark
  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("light")
    } else {
      // Si es system, alternar basado en el tema del sistema
      setTheme(systemTheme === "dark" ? "light" : "dark")
    }
  }

  // Función para establecer tema específico
  const setSpecificTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
  }

  // Obtener el tema actual (resolviendo system)
  const currentTheme = theme === "system" ? systemTheme : theme

  // Obtener el tema opuesto
  const oppositeTheme = currentTheme === "light" ? "dark" : "light"

  return {
    theme,
    systemTheme,
    currentTheme,
    oppositeTheme,
    setTheme,
    toggleTheme,
    setSpecificTheme,
    mounted,
    isLight: currentTheme === "light",
    isDark: currentTheme === "dark",
    isSystem: theme === "system"
  }
}
