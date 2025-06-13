"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ThemeToggleProps {
  isDarkMode: boolean
  onToggle: () => void
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDarkMode, onToggle }) => (
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
          <div className="relative w-4 h-4">
            <AnimatePresence mode="wait">
              {isDarkMode ? (
                <motion.div
                  key="moon"
                  initial={{ scale: 0, rotate: -90, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Moon className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ scale: 0, rotate: 90, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Sun className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Cambiar a modo {isDarkMode ? 'claro' : 'oscuro'}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

export default ThemeToggle 