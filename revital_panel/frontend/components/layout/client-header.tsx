'use client';

import { usePathname } from 'next/navigation';
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeSwitcherButton } from '@/components/ui/theme-switcher-button';
import { LanguageSwitcherButton } from '@/components/ui/language-switcher-button';
import { useTranslations } from 'next-intl';

function pathWithoutLocale(path: string): string {
  return path.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
}

export function ClientHeader() {
  const pathname = usePathname();
  const t = useTranslations('sidebar');
  const tSettings = useTranslations('settings');
  const currentPath = pathWithoutLocale(pathname);

  const pageTitleByPath: Record<string, string> = {
    '/dashboard': t('dashboard'),
    '/instance': t('myInstance'),
    '/instance/settings': tSettings('title'),
    '/subscription': t('subscription'),
    '/billing': t('billing'),
    '/resources': t('resources'),
    '/settings': t('settings'),
    '/settings/profile': t('profile'),
    '/settings/security': tSettings('sections.security.title'),
  };

  const pageTitle =
    pageTitleByPath[currentPath] ??
    Object.entries(pageTitleByPath).find(([path]) => currentPath.startsWith(path + '/'))?.[1] ??
    t('dashboard');

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
        <LanguageSwitcherButton className="rounded-lg hover:bg-muted" />
        <ThemeSwitcherButton />
      </div>
    </header>
  );
}
