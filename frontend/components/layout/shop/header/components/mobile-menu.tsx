"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { type NavItem } from "@/lib/menu-config"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  items: NavItem[]
  isDarkMode: boolean
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, items, isDarkMode }) => {
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

export default MobileMenu 