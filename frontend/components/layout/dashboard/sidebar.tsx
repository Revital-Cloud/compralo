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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/admin">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Synkro Admin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
