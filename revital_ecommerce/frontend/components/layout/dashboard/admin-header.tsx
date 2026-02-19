 'use client';

import { Separator, Button, SidebarTrigger } from "@/components/ui"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/layout/shop/header/components/theme-toggle"
import { AdminChatTrigger } from "@/components/admin/admin-chat-trigger"
import { IconHelpCircle } from "@tabler/icons-react"
import { useAdminTour } from "@/app/(dashboard)/admin/_tour/useAdminDriverTour"

export default function AdminHeader() {
  const {
    startAdminOverviewTour,
    startProductsListTour,
    startProductCreateTour,
    startCategoriesListTour,
    startOrdersTour,
    startAttributesTour,
    startBrandsTour,
    startProvidersTour,
    startUsersTour,
    startDiscountsTour,
    startPointsTour,
    startInfoBarTour,
    startAnalyticsTour,
  } = useAdminTour()

  return (
    <header
      className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-sidebar-border bg-background ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) transition-colors duration-300"
      data-tour-id="admin-header"
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 my-auto data-[orientation=vertical]:h-6 bg-border"
        />
        <h1 className="text-base font-medium text-foreground transition-colors duration-300">Dashboard</h1>
      </div>
      <div className="ml-auto flex items-center gap-2 px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Ayuda y recorridos">
              <IconHelpCircle className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Recorridos del panel</DropdownMenuLabel>
            <DropdownMenuItem onClick={startAdminOverviewTour}>
              Recorrido general del panel
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={startOrdersTour}>
              Tour de órdenes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={startProductsListTour}>
              Tour de productos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={startProductCreateTour}>
              Tour de creación de producto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={startCategoriesListTour}>
              Tour de categorías
            </DropdownMenuItem>
            <DropdownMenuItem onClick={startAttributesTour}>
              Tour de atributos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={startBrandsTour}>
              Tour de marcas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={startProvidersTour}>
              Tour de proveedores
            </DropdownMenuItem>
            <DropdownMenuItem onClick={startUsersTour}>
              Tour de usuarios
            </DropdownMenuItem>
            <DropdownMenuItem onClick={startDiscountsTour}>
              Tour de descuentos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={startPointsTour}>
              Tour de puntos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={startInfoBarTour}>
              Tour barra informativa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={startAnalyticsTour}>
              Tour de analytics
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AdminChatTrigger />
        <ThemeToggle />
      </div>
    </header>
  )
}
