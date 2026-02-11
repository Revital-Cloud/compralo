"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  User, 
  Heart, 
  Settings, 
  LogOut, 
  ChevronDown,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui"
import { UserAvatar } from "@/components/ui"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

interface UserMenuProps {
  className?: string
}

const UserMenu: React.FC<UserMenuProps> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { user, logout, isAuthenticated, isLoadingUser } = useAuth()
  const menuRef = useRef<HTMLDivElement>(null)

  // Evitar hidratación mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      setIsOpen(false)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  // No renderizar nada hasta que el componente esté montado en el cliente
  if (!isMounted || isLoadingUser) {
    return (
      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
    )
  }

  // Si no está autenticado, mostrar botón de login
  if (!isAuthenticated) {
    return (
      <Link 
        href="/login" 
        className="text-gray-700 dark:text-gray-300 cursor-pointer hover:text-[#ec2538] dark:hover:text-red-500 transition-colors duration-200 font-medium text-sm sm:text-base"
      >
        Iniciar sesión
      </Link>
    )
  }

  // Obtener iniciales del usuario para el avatar
  const getUserInitials = () => {
    if (!user) return "U"
    const { nom_usuario, ape_usuario } = user
    if (nom_usuario && ape_usuario) {
      return `${nom_usuario.charAt(0)}${ape_usuario.charAt(0)}`.toUpperCase()
    }
    if (nom_usuario) {
      return nom_usuario.charAt(0).toUpperCase()
    }
    if (user.email_usuario) {
      return user.email_usuario.charAt(0).toUpperCase()
    }
    return "U"
  }

  // Obtener color de fondo para el avatar
  const getAvatarColor = () => {
    const colors = [
      "bg-gradient-to-br from-[#ec2538] to-[#FF8C00]",
      "bg-gradient-to-br from-[#FF8C00] to-[#fec806]",
      "bg-gradient-to-br from-[#fec806] to-[#ec2538]",
      "bg-gradient-to-br from-[#ec2538] to-[#fec806]",
      "bg-gradient-to-br from-[#FF8C00] to-[#ec2538]"
    ]
    const index = (user?.id_usuario || 0) % colors.length
    return colors[index]
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón del avatar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 sm:space-x-2 p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-300"
        aria-label="Menú de usuario"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user && <UserAvatar user={user} size={32} className="w-6 h-6 sm:w-8 sm:h-8" />}
        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Menú desplegable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-48 sm:w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/25 border border-gray-200 dark:border-gray-700 py-2 z-50 transition-colors duration-300"
          >
            {/* Header del usuario */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                {user && <UserAvatar user={user} size={40} />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user?.nom_usuario && user?.ape_usuario 
                      ? `${user.nom_usuario} ${user.ape_usuario}`
                      : user?.email_usuario || "Usuario"
                    }
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email_usuario || ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Opciones del menú - Solo opciones esenciales */}
            <div className="py-1">
              <Link
                href="/profile"
                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4" />
                <span>Mi Perfil</span>
              </Link>

              {/* Separador */}
              <div className="border-t border-gray-100 dark:border-gray-600 my-1"></div>

              {/* Cerrar sesión */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300 w-full text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UserMenu 