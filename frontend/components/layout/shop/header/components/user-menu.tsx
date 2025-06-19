"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface UserMenuProps {
  onLogin?: () => void
  onProfile?: () => void
}

const UserMenu: React.FC<UserMenuProps> = ({ onLogin, onProfile }) => {
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
            <Link href="/login">
              Iniciar Sesión
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

export default UserMenu 