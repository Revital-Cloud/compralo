'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Users,
  Receipt,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { Link } from '@/i18n/routing';
import { AdminNavMain } from './admin-nav-main';
import { ClientNavUser } from './client-nav-user';

const navigationItemsConfig = [
  { key: 'dashboard', url: '/admin', icon: LayoutDashboard, section: 'overview' as const },
  { key: 'clients', url: '/admin/clients', icon: Users, section: 'management' as const },
  { key: 'billing', url: '/admin/billing', icon: Receipt, section: 'management' as const },
];

interface AdminSidebarProps {
  variant?: 'sidebar' | 'inset';
}

export function AdminSidebar({ variant = 'inset' }: AdminSidebarProps) {
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
          <Link href="/admin" className="flex items-center gap-3 group">
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
                {t('adminPortal')}
              </span>
            </div>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <AdminNavMain items={navigationItems} />
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <ClientNavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
