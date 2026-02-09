"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Menu, X, Heart, Moon, Sun, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui"
import MiniCartHover from "@/components/cart/minicart-hover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui"
import { type NavItem } from "@/lib/menu-config"
import { MobileMenu, SearchBar, ProductSearchBar, UserMenu } from "./components"
import Link from "next/link"
import { defaultMenuItems } from "@/lib/menu-config"
import { useCartInfo } from "@/hooks/use-cart"
import { useFavorites } from "@/hooks/use-favorites"
import { useAuth } from "@/hooks/use-auth"
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
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  const [mounted, setMounted] = useState(false)
  const [displayCartCount, setDisplayCartCount] = useState(0)
  const [favoritesCount, setFavoritesCount] = useState(0)

  useEffect(() => {
    setMounted(true)
    setDisplayCartCount(cartCount ?? itemCount)
    setFavoritesCount(favorites.length)
  }, [cartCount, itemCount, favorites.length])

  useEffect(() => {
    if (mounted) {
      setDisplayCartCount(cartCount ?? itemCount)
    }
  }, [cartCount, itemCount, mounted])

  useEffect(() => {
    if (mounted) {
      setFavoritesCount(favorites.length)
    }
  }, [favorites.length, mounted])

  const handleCartClick = () => router.push('/cart')
  const handleFavoritesClick = () => router.push('/favorites')
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light")

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
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
              <Link href="/" prefetch={false}>
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
                    prefetch={false}
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
            
            {/* Right Side: en responsive solo carrito + menú; en desktop todo */}
            <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
              {/* Desktop: búsqueda */}
              <div className="hidden lg:block w-40 sm:w-48 lg:w-64">
                <ProductSearchBar />
              </div>

              <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
                {/* Solo en desktop: wishlist, notificaciones, tema, user menu */}
                {user && (
                  <div className="hidden lg:block">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="relative p-1.5 sm:p-2 text-gray-700 dark:text-gray-300 hover:text-[#ec2538] dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                            onClick={handleFavoritesClick}
                            aria-label="Lista de deseos"
                          >
                            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                            {mounted && favoritesCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-[#ec2538] dark:bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {favoritesCount > 99 ? "99+" : favoritesCount}
                              </span>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Lista de deseos</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
                <div className="hidden lg:block">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 sm:p-2 text-gray-700 dark:text-gray-300 hover:text-[#ec2538] dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                          onClick={toggleTheme}
                          aria-label="Cambiar tema"
                        >
                          <Sun className="w-4 h-4 sm:w-5 sm:h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                          <Moon className="absolute w-4 h-4 sm:w-5 sm:h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Cambiar tema</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Carrito: siempre visible */}
                <MiniCartHover
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative p-1.5 sm:p-2 text-gray-700 dark:text-gray-300 hover:text-[#ec2538] dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300 cursor-pointer"
                      onClick={handleCartClick}
                      disabled={isLoading}
                      aria-label={mounted && displayCartCount > 0 ? `Carrito (${displayCartCount} ${displayCartCount === 1 ? "producto" : "productos"})` : "Carrito"}
                    >
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                      {mounted && displayCartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#ec2538] dark:bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {displayCartCount > 99 ? "99+" : displayCartCount}
                        </span>
                      )}
                    </Button>
                  }
                />

                {/* Solo en desktop: menú de usuario */}
                <div className="hidden lg:block">
                  <UserMenu />
                </div>
              </div>

              {/* Solo en responsive: botón menú hamburguesa */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="lg:hidden p-1.5 sm:p-2 ml-1 text-gray-700 dark:text-gray-300 hover:text-[#ec2538] dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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