"use client"

import * as React from "react"
import { motion } from "framer-motion"
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

export default ThemeToggle 