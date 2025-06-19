"use client"

import * as React from "react"
import { type NavItem } from "@/lib/menu-config"
import ChevronIcon from "./chevron-icon"

interface NavigationProps {
  items: NavItem[]
  isDarkMode: boolean
  onItemClick?: () => void
}

const Navigation: React.FC<NavigationProps> = ({ items, isDarkMode, onItemClick }) => (
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

export default Navigation 