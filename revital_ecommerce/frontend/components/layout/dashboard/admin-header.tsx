'use client';

import { Separator, Button, SidebarTrigger } from "@/components/ui"
import { ThemeToggle } from "@/components/layout/shop/header/components/theme-toggle"
import { AdminChatTrigger } from "@/components/admin/admin-chat-trigger"
import { IconHelpCircle } from "@tabler/icons-react"
import { useAdminTour } from "@/app/(dashboard)/admin/_tour/useAdminDriverTour"
import { usePathname } from "next/navigation"
import { useMemo, useCallback } from "react"

export default function AdminHeader() {
  const pathname = usePathname()
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

  const currentSectionTour = useMemo(() => {
    if (!pathname) return null

    // Normalizar eliminando querystring/fragmento
    const basePath = pathname.split('?')[0].split('#')[0]

    if (basePath.startsWith('/admin/orders')) {
      return {
        label: 'Tour de órdenes',
        onClick: startOrdersTour,
      }
    }
    if (basePath.startsWith('/admin/products/create')) {
      return {
        label: 'Tour de creación de producto',
        onClick: startProductCreateTour,
      }
    }
    if (basePath.startsWith('/admin/products')) {
      return {
        label: 'Tour de productos',
        onClick: startProductsListTour,
      }
    }
    if (
      basePath.startsWith('/admin/categories') ||
      basePath.startsWith('/admin/lines') ||
      basePath.startsWith('/admin/sublines')
    ) {
      return {
        label: 'Tour de categorías',
        onClick: startCategoriesListTour,
      }
    }
    if (basePath.startsWith('/admin/attributes')) {
      return {
        label: 'Tour de atributos',
        onClick: startAttributesTour,
      }
    }
    if (basePath.startsWith('/admin/brands')) {
      return {
        label: 'Tour de marcas',
        onClick: startBrandsTour,
      }
    }
    if (basePath.startsWith('/admin/providers')) {
      return {
        label: 'Tour de proveedores',
        onClick: startProvidersTour,
      }
    }
    if (basePath.startsWith('/admin/users')) {
      return {
        label: 'Tour de usuarios',
        onClick: startUsersTour,
      }
    }
    if (basePath.startsWith('/admin/discounts')) {
      return {
        label: 'Tour de descuentos',
        onClick: startDiscountsTour,
      }
    }
    if (basePath.startsWith('/admin/points')) {
      return {
        label: 'Tour de puntos',
        onClick: startPointsTour,
      }
    }
    if (basePath.startsWith('/admin/info-bar')) {
      return {
        label: 'Tour barra informativa',
        onClick: startInfoBarTour,
      }
    }
    if (basePath.startsWith('/admin/analytics')) {
      return {
        label: 'Tour de analytics',
        onClick: startAnalyticsTour,
      }
    }

    // En el dashboard principal u otras rutas, solo mostramos el recorrido general
    return null
  }, [
    pathname,
    startOrdersTour,
    startProductCreateTour,
    startProductsListTour,
    startCategoriesListTour,
    startAttributesTour,
    startBrandsTour,
    startProvidersTour,
    startUsersTour,
    startDiscountsTour,
    startPointsTour,
    startInfoBarTour,
    startAnalyticsTour,
  ])

  const handleHelpClick = useCallback(() => {
    if (currentSectionTour) {
      currentSectionTour.onClick()
    } else {
      startAdminOverviewTour()
    }
  }, [currentSectionTour, startAdminOverviewTour])

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
        <Button
          variant="outline"
          size="icon"
          aria-label="Ayuda y recorridos"
          onClick={handleHelpClick}
        >
          <IconHelpCircle className="h-4 w-4" />
        </Button>
        <AdminChatTrigger />
        <ThemeToggle />
      </div>
    </header>
  )
}
