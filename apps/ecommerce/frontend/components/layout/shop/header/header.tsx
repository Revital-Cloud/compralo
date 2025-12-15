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
import { Button } from "@repo/ui"
import MiniCartHover from "@/components/cart/minicart-hover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui"
import { type NavItem } from "@/lib/menu-config"
import {
  Navigation,
  MobileMenu,
  SearchBar,
  CartButton,
  UserMenu
} from "./components"
import Link from "next/link"
import { defaultMenuItems } from "@/lib/menu-config"
import { useCartInfo } from "@/hooks/use-cart"
import { useFavorites } from "@/hooks/use-favorites"
import { useRouter, usePathname } from "next/navigation"

interface EcommerceHeaderProps {
  logo?: React.ReactNode
  menuItems?: NavItem[]
  cartCount?: number
  className?: string
}

const EcommerceHeader: React.FC<EcommerceHeaderProps> = ({
  logo,
  menuItems = [],
  cartCount, // Ahora será opcional, usaremos el hook
  className = ""
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const { itemCount, isLoading } = useCartInfo()
  const { favorites } = useFavorites()
  
  // Usar el count del hook si no se proporciona uno
  const displayCartCount = cartCount ?? itemCount
  const favoritesCount = favorites.length
  
  const handleCartClick = () => {
    router.push('/cart')
  }

  const handleFavoritesClick = () => {
    router.push('/favorites')
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const navigationItems = menuItems.length > 0 ? menuItems : defaultMenuItems

  return (
    <header className={`sticky top-0 z-40 w-full ${className}`}>
      {/* Main Navigation Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/">
                {logo || (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 680 680" xmlns="http://www.w3.org/2000/svg">
                        <circle className="fill-[#ec2538]" cx="280.42" cy="568.76" r="43.83"/>
                        <circle className="fill-[#ec2538]" cx="495.94" cy="568.76" r="43.83"/>
                        <path className="fill-[#ec2538]" d="M53.48,164.04h82.2c3.44,0,6.42,2.37,7.2,5.73l67.48,292.67c4.66,20.22,22.67,34.55,43.42,34.55h267.95c34.64,0,64.96-23.25,73.96-56.7l57.12-212.33c4.52-16.79-8.13-33.28-25.51-33.28h-61.44c4.92,71.77-21.63,132.81-63.82,188.53,19.19,12.32,33.63,26.23,32.64,45.31,1.55,34.12-48.73,38.39-108.03,37.47h-119.7c-17.42,0-31.54-14.12-31.54-31.54v-145.6c0-22.14,23.66-36.25,43.14-25.72l27.7,14.97c23.19-21.34,40.1-48.75,49.78-83.14h-190.56c-3.24,0-6.04-2.25-6.75-5.41l-8.66-38.78c-4.94-22.13-24.58-37.87-47.26-37.87H53.47c-5.82,0-11.59,1.55-16.4,4.82-7.04,4.79-10.7,11.74-10.71,21.02-.71,10.34,3.81,17.17,11.9,21.61,4.64,2.55,9.93,3.69,15.22,3.69Z"/>
                        <path className="fill-[#fec806]" d="M441.83,75.06c-4.32,118.31-38.28,185.28-84.47,231.11-3.22,3.2-8.23,3.71-12.07,1.3l-35.57-22.4c-4.62-2.91-10.64.41-10.64,5.87v140.38c0,5.26,4.25,9.53,9.51,9.56,78.36.44,153.52.47,192.25-4.16,9.85-1.18,13.22-13.75,5.29-19.7l-35.17-26.37c-3.1-2.33-3.57-6.8-1.02-9.72,103.04-118.15,93.62-227.41-15.41-311.86-5.07-3.93-12.48-.42-12.71,5.99Z"/>
                      </svg>
                    </div>
                    <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#ec2538] dark:text-red-500 transition-colors duration-300">Compralo</span>
                  </div>
                )}
              </Link>
              
              {/* Navigation - Solo visible en desktop */}
              <nav className="hidden lg:flex items-center space-x-8 ml-8">
                {navigationItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href || "#"}
                    className={`text-sm font-medium transition-colors duration-300 ${
                      pathname === item.href
                        ? "text-[#ec2538] dark:text-red-500 border-b-2 border-[#ec2538] dark:border-red-500 pb-2" 
                        : "text-gray-900 dark:text-white hover:text-[#ec2538] dark:hover:text-red-500"
                    }`}
                  >
                    {item.text}
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Right Side */}
            <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
              {/* Search Bar - Oculto en móvil, visible en tablet y desktop */}
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2538] dark:focus:ring-red-500 w-40 sm:w-48 lg:w-64 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                />
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
              
              {/* Actions - Responsive con diferentes breakpoints */}
              <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
                {/* Wishlist - Oculto en móvil muy pequeño */}
                <div className="hidden sm:block">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="relative p-1.5 sm:p-2 text-gray-700 dark:text-gray-300 hover:text-[#ec2538] dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                          onClick={handleFavoritesClick}
                        >
                          <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                          {favoritesCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-[#ec2538] dark:bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {favoritesCount > 99 ? '99+' : favoritesCount}
                            </span>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Lista de deseos</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Notifications - Oculto en móvil muy pequeño */}
                <div className="hidden sm:block">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-1.5 sm:p-2 text-gray-700 dark:text-gray-300 hover:text-[#ec2538] dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300 relative"
                        >
                          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                          <div className="absolute top-1 right-1 w-2 h-2 bg-[#ec2538] dark:bg-red-500 rounded-full"></div>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Notificaciones</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Theme Toggle - Siempre visible */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1.5 sm:p-2 text-gray-700 dark:text-gray-300 hover:text-[#ec2538] dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300" 
                        onClick={toggleTheme}
                      >
                        <Sun className="w-4 h-4 sm:w-5 sm:h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute w-4 h-4 sm:w-5 sm:h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cambiar tema</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Cart con MiniCart en hover */}
                <MiniCartHover
                  trigger={
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="relative p-1.5 sm:p-2 text-gray-700 dark:text-gray-300 hover:text-[#ec2538] dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300 cursor-pointer" 
                      onClick={handleCartClick}
                      disabled={isLoading}
                      aria-label={`Carrito de compras (${displayCartCount} ${displayCartCount === 1 ? 'producto' : 'productos'})`}
                    >
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                      {displayCartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#ec2538] dark:bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {displayCartCount > 99 ? '99+' : displayCartCount}
                        </span>
                      )}
                    </Button>
                  }
                />

                {/* User Menu - Siempre visible */}
                <UserMenu />
              </div>

              {/* Mobile Menu Button - Solo visible en móvil */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="lg:hidden p-1.5 sm:p-2 ml-1 text-gray-700 dark:text-gray-300 hover:text-[#ec2538] dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Search - Solo visible en móvil */}
          <div className="sm:hidden pb-4">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        items={navigationItems}
        pathname={pathname}
      />
    </header>
  )
}

export default EcommerceHeader 