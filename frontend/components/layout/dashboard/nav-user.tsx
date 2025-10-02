"use client"

import React from 'react'
import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, logout, isLoggingOut } = useAuth()
  const [open, setOpen] = React.useState(false)

  const handleLogout = () => {
    setOpen(true)
  }

  const confirmLogout = () => {
    toast.info('Cerrando sesión...')
    logout()
  }

  // Si no hay usuario, no mostrar nada
  if (!user) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-gray-100 data-[state=open]:text-black text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarFallback className="rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {user.nom_usuario?.charAt(0)}{user.ape_usuario?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-gray-900 dark:text-white">
                  {user.nom_usuario} {user.ape_usuario}
                </span>
                <span className="text-gray-500 dark:text-gray-400 truncate text-xs">
                  {user.email_usuario}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4 text-gray-700 dark:text-gray-300" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-colors duration-300"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {user.nom_usuario?.charAt(0)}{user.ape_usuario?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-gray-900 dark:text-white">
                    {user.nom_usuario} {user.ape_usuario}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 truncate text-xs">
                    {user.email_usuario}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300">
                <IconUserCircle className="text-gray-700 dark:text-gray-300" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300">
                <IconCreditCard className="text-gray-700 dark:text-gray-300" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300">
                <IconNotification className="text-gray-700 dark:text-gray-300" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuItem 
              className={`text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300 ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <IconLogout className={`text-gray-700 dark:text-gray-300 ${isLoggingOut ? 'animate-spin' : ''}`} />
              {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      {/* Dialogo de confirmación de logout */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cerrar sesión?</DialogTitle>
            <DialogDescription>
              Saldrás de tu cuenta y se limpiarán los datos locales.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmLogout}>Cerrar sesión</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarMenu>
  )
}
