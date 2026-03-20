"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Moon, Sun, User, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui"
import { type NavItem } from "@/lib/menu-config"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  items?: NavItem[]
  pathname?: string
}

export function MobileMenu({ isOpen, onClose, items = [], pathname }: MobileMenuProps) {
  const { theme, setTheme } = useTheme()
  const { logout, isAuthenticated } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      onClose()
    } catch (e) {
      console.error(e)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-80",
        "lg:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-colors duration-300"
      )}
    >
      {/* Barra superior con cerrar: cubre toda la cabecera incluido el buscador */}
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 flex-shrink-0 bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-700">
        <span className="text-lg font-semibold text-gray-900 dark:text-white">Menú</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-2 text-gray-700 dark:text-gray-300 hover:text-[#ec2538] dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
      <div className="relative z-20 grid gap-4 sm:gap-6 rounded-md bg-white dark:bg-gray-800 p-3 sm:p-4 text-gray-900 dark:text-white shadow-lg dark:shadow-gray-900/25 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        {/* Navegación del sitio */}
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

          {isAuthenticated ? (
            // Solo mostrar perfil si el usuario está autenticado.
            <Link
              href="/profile"
              className={cn(
                "flex w-full items-center gap-2 rounded-md p-2 text-xs sm:text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#ec2538] dark:hover:text-red-500 transition-colors duration-300",
                pathname === "/profile" ? "text-[#ec2538] dark:text-red-500 font-semibold" : "text-gray-700 dark:text-gray-300"
              )}
              onClick={onClose}
            >
              <User className="w-4 h-4" />
              Mi perfil
            </Link>
          ) : (
            // En no autenticados, mostramos login/registro en el menú mobile.
            <>
              <Link
                href="/login"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md p-2 text-xs sm:text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#ec2538] dark:hover:text-red-500 transition-colors duration-300",
                  pathname === "/login" ? "text-[#ec2538] dark:text-red-500 font-semibold" : "text-gray-700 dark:text-gray-300"
                )}
                onClick={onClose}
              >
                <User className="w-4 h-4" />
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md p-2 text-xs sm:text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#ec2538] dark:hover:text-red-500 transition-colors duration-300",
                  pathname === "/register" ? "text-[#ec2538] dark:text-red-500 font-semibold" : "text-gray-700 dark:text-gray-300"
                )}
                onClick={onClose}
              >
                <User className="w-4 h-4" />
                Registrarme
              </Link>
            </>
          )}

          {/* Tema: Dark / Light */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
            <p className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tema</p>
            <button
              type="button"
              onClick={() => {
                setTheme("light")
                onClose()
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md p-2 text-xs sm:text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 text-left",
                theme === "light" ? "text-[#ec2538] dark:text-red-500" : "text-gray-700 dark:text-gray-300"
              )}
            >
              <Sun className="w-4 h-4" />
              Claro
            </button>
            <button
              type="button"
              onClick={() => {
                setTheme("dark")
                onClose()
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md p-2 text-xs sm:text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 text-left",
                theme === "dark" ? "text-[#ec2538] dark:text-red-500" : "text-gray-700 dark:text-gray-300"
              )}
            >
              <Moon className="w-4 h-4" />
              Oscuro
            </button>
          </div>

          {/* Línea y Cerrar sesión */}
          {isAuthenticated && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-600 my-3" />
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </Button>
              </div>
            </>
          )}
        </nav>
      </div>
      </div>
    </div>
  )
} 