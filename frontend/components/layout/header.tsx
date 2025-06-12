"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { 
  Search, 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  ChevronDown,
  Heart,
  Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { type NavItem } from "@/lib/menu-config"

interface EcommerceHeaderProps {
  logo?: React.ReactNode
  menuItems?: NavItem[]
  cartCount?: number
  className?: string
}

const ChevronIcon = () => (
  <ChevronDown className="w-4 h-4 opacity-60 transition-transform duration-200 group-hover:rotate-180" />
)

const Navigation: React.FC<{ 
  items: NavItem[]
  isDarkMode: boolean
  onItemClick?: () => void
}> = ({ items, isDarkMode, onItemClick }) => (
  <nav className="hidden lg:block">
    <ul className="flex items-center gap-8">
      {items.map((item, index) => {
        const hasDropdown = item.items && item.items.length > 0
        
        return (
          <li key={index} className={`relative ${hasDropdown ? 'group' : ''}`}>
            <a
              href={item.href || '#'}
              className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors duration-200"
              onClick={onItemClick}
            >
              {item.text}
              {hasDropdown && <ChevronIcon />}
            </a>
            
            {hasDropdown && (
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-background border border-border rounded-lg shadow-lg p-2 min-w-[250px]">
                  {item.items?.map((subItem, subIndex) => (
                    <a
                      key={subIndex}
                      href={subItem.href}
                      className="block p-3 rounded-md hover:bg-muted transition-colors duration-200"
                      onClick={onItemClick}
                    >
                      <div className="font-medium text-sm text-foreground">
                        {subItem.text}
                      </div>
                      {subItem.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {subItem.description}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  </nav>
)

const MobileMenu: React.FC<{
  isOpen: boolean
  onClose: () => void
  items: NavItem[]
  isDarkMode: boolean
}> = ({ isOpen, onClose, items, isDarkMode }) => {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="lg:hidden absolute top-full left-0 right-0 bg-background border-t border-border shadow-lg z-50"
    >
      <div className="p-4 space-y-4">
        {items.map((item, index) => (
          <div key={index} className="space-y-2">
            <a
              href={item.href || '#'}
              className="block text-sm font-medium text-foreground hover:text-primary transition-colors"
              onClick={onClose}
            >
              {item.text}
            </a>
            {item.items && (
              <div className="pl-4 space-y-2">
                {item.items.map((subItem, subIndex) => (
                  <a
                    key={subIndex}
                    href={subItem.href}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={onClose}
                  >
                    {subItem.text}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

const ThemeToggle: React.FC<{
  isDarkMode: boolean
  onToggle: () => void
}> = ({ isDarkMode, onToggle }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="relative p-2 hover:bg-muted"
          aria-label={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDarkMode ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isDarkMode ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </motion.div>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Cambiar a modo {isDarkMode ? 'claro' : 'oscuro'}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

const SearchBar: React.FC<{
  onSearch?: (query: string) => void
  placeholder?: string
}> = ({ onSearch, placeholder = "Buscar productos..." }) => {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(query)
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 max-w-md">
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pr-10 bg-muted/50 border-border focus:bg-background"
      />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="absolute right-1 top-1/2 -translate-y-1/2 p-2 hover:bg-muted"
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  )
}

const CartButton: React.FC<{
  count: number
  onClick?: () => void
}> = ({ count, onClick }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          className="relative p-2 hover:bg-muted"
        >
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
            >
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Carrito de compras ({count} {count === 1 ? 'producto' : 'productos'})</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

const UserMenu: React.FC<{
  onLogin?: () => void
  onProfile?: () => void
}> = ({ onLogin, onProfile }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-muted"
            >
              <User className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Menú de usuario</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-background border border-border rounded-lg shadow-lg p-2 min-w-[150px] z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onProfile?.()
              setIsOpen(false)
            }}
            className="w-full justify-start"
          >
            Mi Perfil
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onLogin?.()
              setIsOpen(false)
            }}
            className="w-full justify-start"
          >
            Iniciar Sesión
          </Button>
        </div>
      )}
    </div>
  )
}

const EcommerceHeader: React.FC<EcommerceHeaderProps> = ({
  logo,
  menuItems = [],
  cartCount = 0,
  className = ""
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className={`sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            {logo || (
              <div className="text-xl font-bold text-foreground">
                Synkro
              </div>
            )}
          </div>

          {/* Navigation */}
          <Navigation 
            items={menuItems} 
            isDarkMode={isDarkMode}
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
                    className="hidden sm:flex p-2 hover:bg-muted"
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
                    className="hidden sm:flex p-2 hover:bg-muted relative"
                  >
                    <Bell className="h-5 w-5" />
                    <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Notificaciones</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Theme Toggle */}
            <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />

            {/* Cart */}
            <CartButton count={cartCount} />

            {/* User Menu */}
            <UserMenu />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 hover:bg-muted"
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
        isDarkMode={isDarkMode}
      />
    </header>
  )
}

export default EcommerceHeader 