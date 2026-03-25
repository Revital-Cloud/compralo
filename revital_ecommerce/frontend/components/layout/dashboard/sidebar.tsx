"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconCategory,
  IconListDetails,
  IconTags,
  IconBuildingFactory2,
  IconSearch,
  IconSettings,
  IconShoppingCart,
  IconPackage,
  IconUsers,
  IconTruck,
  IconMail,
  IconHeart,
  IconBrandGoogle,
  IconCreditCard,
  IconDiscount,
  IconCoins
} from "@tabler/icons-react"

import { NavMain } from "@/components/layout/dashboard/nav-main"
import { NavSecondary } from "@/components/layout/dashboard/nav-secondary"
import { NavUser } from "@/components/layout/dashboard/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
      section: "principal"
    },
    {
      title: "Órdenes",
      url: "/admin/orders",
      icon: IconShoppingCart,
      section: "principal"
    },
    {
      title: "Categorías",
      url: "/admin/categories",
      icon: IconCategory,
      section: "catalogo"
    },
    {
      title: "Atributos",
      url: "/admin/attributes",
      icon: IconListDetails,
      section: "catalogo"
    },
    {
      title: "Marcas",
      url: "/admin/brands",
      icon: IconTags,
      section: "catalogo"
    },
    {
      title: "Proveedores",
      url: "/admin/providers",
      icon: IconBuildingFactory2,
      section: "catalogo"
    },
    {
      title: "Productos",
      url: "/admin/products",
      icon: IconPackage,
      section: "catalogo"
    },
    {
      title: "Usuarios",
      url: "/admin/users",
      icon: IconUsers,
      section: "gestion"
    },
    {
      title: "Descuentos",
      url: "/admin/discounts",
      icon: IconDiscount,
      section: "gestion"
    },
    {
      title: "Puntos",
      url: "/admin/points",
      icon: IconCoins,
      section: "gestion"
    },
    {
      title: "Barra Informativa",
      url: "/admin/info-bar",
      icon: IconInnerShadowTop,
      section: "gestion"
    },
    {
      title: "Analíticas",
      url: "/admin/analytics",
      icon: IconChartBar,
      section: "otros"
    }
  ],
  navSecondary: [
    {
      title: "Configuración",
      url: "/admin/settings",
      icon: IconSettings,
    },
    {
      title: "Marketing por Email",
      url: "/admin/emails",
      icon: IconMail,
    },
    {
      title: "Favoritos",
      url: "/admin/favorites",
      icon: IconHeart,
    },
    {
      title: "Pagos",
      url: "/admin/payments",
      icon: IconCreditCard,
    },
    {
      title: "SEO y Marketing",
      url: "/admin/seo",
      icon: IconBrandGoogle,
    },
    {
      title: "Ayuda",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Buscar",
      url: "#",
      icon: IconSearch,
    },
  ],
}

export function AppSidebar({ variant }: { variant: "sidebar" | "inset" }) {
  return (
    <Sidebar
      variant={variant}
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar transition-colors duration-300"
      data-tour-id="admin-sidebar"
    >
      <SidebarHeader className="border-b border-sidebar-border transition-colors duration-300">
        <div className="flex h-[--header-height] shrink-0 items-center gap-2 px-4 lg:px-6 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center group-data-[collapsible=icon]:w-7 group-data-[collapsible=icon]:h-7">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 group-data-[collapsible=icon]:w-7 group-data-[collapsible=icon]:h-7" viewBox="0 0 680 680" xmlns="http://www.w3.org/2000/svg">
                <circle className="fill-[#ec2538]" cx="280.42" cy="568.76" r="43.83"/>
                <circle className="fill-[#ec2538]" cx="495.94" cy="568.76" r="43.83"/>
                <path className="fill-[#ec2538]" d="M53.48,164.04h82.2c3.44,0,6.42,2.37,7.2,5.73l67.48,292.67c4.66,20.22,22.67,34.55,43.42,34.55h267.95c34.64,0,64.96-23.25,73.96-56.7l57.12-212.33c4.52-16.79-8.13-33.28-25.51-33.28h-61.44c4.92,71.77-21.63,132.81-63.82,188.53,19.19,12.32,33.63,26.23,32.64,45.31,1.55,34.12-48.73,38.39-108.03,37.47h-119.7c-17.42,0-31.54-14.12-31.54-31.54v-145.6c0-22.14,23.66-36.25,43.14-25.72l27.7,14.97c23.19-21.34,40.1-48.75,49.78-83.14h-190.56c-3.24,0-6.04-2.25-6.75-5.41l-8.66-38.78c-4.94-22.13-24.58-37.87-47.26-37.87H53.47c-5.82,0-11.59,1.55-16.4,4.82-7.04,4.79-10.7,11.74-10.71,21.02-.71,10.34,3.81,17.17,11.9,21.61,4.64,2.55,9.93,3.69,15.22,3.69Z"/>
                <path className="fill-[#fec806]" d="M441.83,75.06c-4.32,118.31-38.28,185.28-84.47,231.11-3.22,3.2-8.23,3.71-12.07,1.3l-35.57-22.4c-4.62-2.91-10.64.41-10.64,5.87v140.38c0,5.26,4.25,9.53,9.51,9.56,78.36.44,153.52.47,192.25-4.16,9.85-1.18,13.22-13.75,5.29-19.7l-35.17-26.37c-3.1-2.33-3.57-6.8-1.02-9.72,103.04-118.15,93.62-227.41-15.41-311.86-5.07-3.93-12.48-.42-12.71,5.99Z"/>
              </svg>
            </div>
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#ec2538] dark:text-red-500 transition-colors duration-300 group-data-[collapsible=icon]:hidden">Compralo</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <NavMain items={data.navMain} />
          {/* <NavSecondary items={data.navSecondary} /> */}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
