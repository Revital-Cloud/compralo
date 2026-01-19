'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard,
  Server,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  HelpCircle,
  User,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
} from '@repo/ui';
import { ClientNavMain } from './client-nav-main';
import { ClientNavUser } from './client-nav-user';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    section: 'overview',
  },
  {
    title: 'My Instance',
    url: '/instance',
    icon: Server,
    section: 'store',
  },
  {
    title: 'Resources',
    url: '/resources',
    icon: BarChart3,
    section: 'store',
  },
  {
    title: 'Subscription',
    url: '/subscription',
    icon: CreditCard,
    section: 'subscription',
  },
  {
    title: 'Billing',
    url: '/billing',
    icon: Receipt,
    section: 'subscription',
  },
  {
    title: 'Profile',
    url: '/settings/profile',
    icon: User,
    section: 'settings',
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    section: 'settings',
  },
];

interface ClientSidebarProps {
  variant?: 'sidebar' | 'inset';
}

export function ClientSidebar({ variant = 'inset' }: ClientSidebarProps) {
  return (
    <Sidebar 
      variant={variant} 
      className="border-r border-sidebar-border bg-sidebar transition-colors duration-200"
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-[--header-height] shrink-0 items-center gap-2 px-4 lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <Image
                src="/logo.webp"
                alt="Synkro Logo"
                width={40}
                height={40}
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain transition-transform duration-200 group-hover:scale-110"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold text-synkro-green transition-colors duration-200">
                Synkro
              </span>
              <span className="text-xs text-muted-foreground font-medium tracking-wide hidden sm:block">
                Client Portal
              </span>
            </div>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <ClientNavMain items={navigationItems} />
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <ClientNavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
