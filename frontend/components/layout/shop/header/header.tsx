"use client"

import * as React from "react"
import { useState } from "react"
import { useTheme } from "next-themes"
import { 
  Menu, 
  X, 
  Heart,
  Bell,
  Moon,
  Sun,
  ShoppingCart,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { type NavItem } from "@/lib/menu-config"
import {
  Navigation,
  MobileMenu,
  SearchBar,
  CartButton,
  UserMenu
} from "./components"
import Link from "next/link"

interface EcommerceHeaderProps {
  logo?: React.ReactNode
  menuItems?: NavItem[]
  cartCount?: number
  className?: string
}

const EcommerceHeader: React.FC<EcommerceHeaderProps> = ({
  logo,
  menuItems = [],
  cartCount = 0,
  className = ""
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  // Navegación por defecto si no se proporcionan menuItems
  const defaultMenuItems: NavItem[] = [
    { text: "Home", href: "/" },
    { text: "All products", href: "/products" },
    { text: "Categories", href: "/categories" },
    { text: "Contact", href: "/contact" }
  ]

  const navigationItems = menuItems.length > 0 ? menuItems : defaultMenuItems

  return (
    <header className={`sticky top-0 z-40 w-full ${className}`}>
      {/* Main Navigation Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              {logo || (
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-[#FF0000] rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-[#FF0000]">Compralo</span>
                </div>
              )}
              
              {/* Navigation */}
              <nav className="hidden lg:flex items-center space-x-8 ml-8">
                {navigationItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href || "#"}
                    className={`text-sm font-medium transition-colors hover:text-[#FF0000] ${
                      item.href === "/" ? "text-[#FF0000] border-b-2 border-[#FF0000] pb-2" : "text-black"
                    }`}
                  >
                    {item.text}
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Right Side */}
            <div className="flex items-center space-x-6">
              {/* Search Bar */}
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Search"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF0000] w-64"
                />
                <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-4">
                {/* Wishlist */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-2 text-gray-700 hover:text-[#FF0000]">
                        <Heart className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Lista de deseos</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Notifications */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-2 text-gray-700 hover:text-[#FF0000] relative">
                        <Bell className="w-5 h-5" />
                        <div className="absolute top-1 right-1 w-2 h-2 bg-[#FF0000] rounded-full"></div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Notificaciones</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Theme Toggle */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-2 text-gray-700 hover:text-[#FF0000]" onClick={toggleTheme}>
                        <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cambiar tema</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Cart */}
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 text-gray-700 cursor-pointer hover:text-[#FF0000]" />
                  <span className="absolute -top-2 -right-2 bg-[#FF0000] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                </div>

                {/* Login - Ahora conectado */}
                <Link 
                  href="/login" 
                  className="text-gray-700 cursor-pointer hover:text-[#FF0000] transition-colors duration-200 font-medium"
                >
                  Iniciar sesión
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="lg:hidden p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        items={navigationItems}
      />
    </header>
  )
}

export default EcommerceHeader 