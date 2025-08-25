"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconSearch,
  IconSettings,
  IconShoppingCart,
  IconPackage,
  IconUsers,
  IconTruck,
  IconMail,
  IconHeart,
  IconBrandGoogle,
  IconCreditCard
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
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Usuario Admin",
    email: "admin@synkro.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Analíticas",
      url: "/admin/analytics",
      icon: IconChartBar,
    },
    {
      title: "Productos",
      url: "/admin/products",
      icon: IconPackage,
    },
    {
      title: "Órdenes",
      url: "/admin/orders",
      icon: IconShoppingCart,
    },
    {
      title: "Usuarios",
      url: "/admin/users",
      icon: IconUsers,
    },
    {
      title: "Envíos",
      url: "/admin/shipping",
      icon: IconTruck,
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
    <Sidebar variant={variant} className="border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 transition-colors duration-300">
      <SidebarHeader className="border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="flex h-[--header-height] shrink-0 items-center gap-2 px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center transition-colors duration-300">
              <IconInnerShadowTop className="w-5 h-5 text-white dark:text-black" />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Synkro</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <NavMain items={data.navMain} />
          <NavSecondary items={data.navSecondary} />
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
