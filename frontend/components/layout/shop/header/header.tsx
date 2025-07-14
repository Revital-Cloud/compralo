"use client"

import * as React from "react"
import { useState } from "react"
import { useTheme } from "next-themes"
import { 
  Menu, 
  X, 
  Heart,
  Bell
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
  ThemeToggle,
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
  const { theme } = useTheme()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className={`sticky top-0 z-40 w-full bg-secondary/80 backdrop-blur-md border-b border-border ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            {logo || (
              <div className="text-xl font-bold text-foreground">
                <Link href="/">
                  Brillo Rosa
                </Link>
              </div>
            )}
          </div>

          {/* Navigation */}
          <Navigation 
            items={menuItems} 
            onItemClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Wishlist */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:flex p-2"
                  >
                    <Heart className="h-5 w-5" />
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:flex p-2 relative"
                  >
                    <Bell className="h-5 w-5" />
                    <div className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Notificaciones</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Cart */}
            <CartButton count={cartCount} />

            {/* User Menu */}
            <UserMenu />

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

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        items={menuItems}
      />
    </header>
  )
}

export default EcommerceHeader 