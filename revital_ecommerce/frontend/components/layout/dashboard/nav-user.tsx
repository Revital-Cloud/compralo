"use client"

import React from 'react'
import Link from 'next/link'
import {
  IconDotsVertical,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react"

import { UserAvatar } from "@/components/ui"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui"
import { useAuth } from "@/hooks/use-auth"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui"
import { Button } from "@/components/ui"
import { toast } from "sonner"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, logout, isLoggingOut } = useAuth()
  const [open, setOpen] = React.useState(false)

  const handleLogout = () => {
    setOpen(true)
  }

  const confirmLogout = async () => {
    toast.info('Cerrando sesión...')
    await logout()
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
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-300"
            >
              <UserAvatar user={user} size={32} variant="squircle" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user.nom_usuario} {user.ape_usuario}
                </span>
                <span className="truncate text-xs opacity-80">
                  {user.email_usuario}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
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
                <UserAvatar user={user} size={32} variant="squircle" />
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
              <DropdownMenuItem asChild className="cursor-pointer hover:bg-sidebar-accent hover:text-[#fec806] transition-colors duration-300">
                <Link href="/admin/account" className="flex items-center gap-2">
                  <IconUserCircle />
                  Cuenta
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuItem 
              className={`cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-300 ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <IconLogout className={isLoggingOut ? 'animate-spin' : ''} />
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
