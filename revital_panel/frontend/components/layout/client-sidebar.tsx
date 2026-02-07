'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Server,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { Link } from '@/i18n/routing';
import { ClientNavMain } from './client-nav-main';
import { ClientNavUser } from './client-nav-user';

const navigationItemsConfig = [
  { key: 'dashboard', url: '/dashboard', icon: LayoutDashboard, section: 'overview' as const },
  { key: 'myInstance', url: '/instance', icon: Server, section: 'store' as const },
  { key: 'resources', url: '/resources', icon: BarChart3, section: 'store' as const },
  { key: 'subscription', url: '/subscription', icon: CreditCard, section: 'subscription' as const },
  { key: 'billing', url: '/billing', icon: Receipt, section: 'subscription' as const },
  { key: 'settings', url: '/settings', icon: Settings, section: 'settings' as const },
];

interface ClientSidebarProps {
  variant?: 'sidebar' | 'inset';
}

export function ClientSidebar({ variant = 'inset' }: ClientSidebarProps) {
  const t = useTranslations('sidebar');

  const navigationItems = navigationItemsConfig.map((item) => ({
    title: t(item.key),
    url: item.url,
    icon: item.icon,
    section: item.section,
  }));

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
                alt="Revital Logo"
                width={40}
                height={40}
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain transition-transform duration-200 group-hover:scale-110"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold text-revital-green transition-colors duration-200">
                Revital
              </span>
              <span className="text-xs text-muted-foreground font-medium tracking-wide hidden sm:block">
                {t('clientPortal')}
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
