'use client';

import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeSwitcherButton } from '@/components/ui/theme-switcher-button';
import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';

function pathWithoutLocale(path: string): string {
  return path.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
}

export function AdminHeader() {
  const pathname = usePathname();
  const t = useTranslations('sidebar');
  const tAdmin = useTranslations('admin');
  const currentPath = pathWithoutLocale(pathname);

  const pageTitleByPath: Record<string, string> = {
    '/admin': t('dashboard'),
    '/admin/clients': t('clients'),
    '/admin/billing': t('billing'),
  };

  const pageTitle =
    pageTitleByPath[currentPath] ??
    Object.entries(pageTitleByPath).find(([path]) => currentPath.startsWith(path + '/'))?.[1] ??
    tAdmin('title');

  return (
    <header className="flex h-[--header-height] shrink-0 items-center gap-3 border-b border-sidebar-border bg-background transition-colors duration-200 py-2">
      <div className="flex w-full items-center gap-3 px-6 lg:px-8">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-3 my-auto data-[orientation=vertical]:h-6 bg-border"
        />
        <h1 className="text-lg sm:text-xl font-medium text-foreground leading-tight">{pageTitle}</h1>
      </div>
      <div className="ml-auto flex items-center gap-3 px-6 lg:px-8">
        <button
          className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
        </button>
        <ThemeSwitcherButton />
      </div>
    </header>
  );
}
