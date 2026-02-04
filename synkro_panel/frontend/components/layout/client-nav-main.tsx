'use client';

import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { LucideIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { prefetchForPath } from '@/lib/prefetch-routes';

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  section?: string;
}

interface NavMainProps {
  items: NavItem[];
}

/** Normalize path for comparison (next-intl with localePrefix: 'never' may still expose path with locale in some setups). */
function pathWithoutLocale(path: string): string {
  return path.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
}

export function ClientNavMain({ items }: NavMainProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const t = useTranslations('sidebar');
  const currentPath = pathWithoutLocale(pathname);

  const handlePrefetch = useCallback(
    (url: string) => {
      prefetchForPath(queryClient, url);
    },
    [queryClient]
  );

  // Best match: only the most specific item is active (longest matching path)
  const getMatchLength = (url: string): number => {
    const p = pathWithoutLocale(url);
    if (currentPath === p) return p.length;
    if (p !== '/' && currentPath.startsWith(p + '/')) return p.length;
    return 0;
  };
  const bestMatchLength = Math.max(0, ...items.map((item) => getMatchLength(item.url)));

  const groupedItems = items.reduce((acc, item) => {
    const section = item.section || 'other';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const sections = [
    { key: 'overview', labelKey: 'overview' as const },
    { key: 'store', labelKey: 'myStore' as const },
    { key: 'subscription', labelKey: 'subscription' as const },
    { key: 'settings', labelKey: 'settings' as const },
  ];

  return (
    <>
      {sections.map((section, sectionIndex) => {
        const sectionItems = groupedItems[section.key] || [];
        if (sectionItems.length === 0) return null;

        return (
          <SidebarGroup key={section.key}>
            {sectionIndex > 0 && (
              <div className="px-2 py-2">
                <div className="h-px bg-border" />
              </div>
            )}
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t(section.labelKey)}
              </h3>
            </div>
            <SidebarGroupContent className="flex flex-col gap-1">
              <SidebarMenu>
                {sectionItems.map((item) => {
                  const matchLen = getMatchLength(item.url);
                  const isActive = matchLen > 0 && matchLen === bestMatchLength;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        asChild
                        className={`transition-colors duration-200 ${
                          isActive
                            ? 'bg-synkro-green/10 text-synkro-green hover:bg-synkro-green/20 border-l-4 border-synkro-green'
                            : 'text-muted-foreground hover:text-synkro-green hover:bg-muted'
                        }`}
                      >
                        <Link
                          href={item.url}
                          className="flex flex-1 items-center gap-2 overflow-hidden text-left outline-none [&>svg]:shrink-0"
                          onMouseEnter={() => handlePrefetch(item.url)}
                          onFocus={() => handlePrefetch(item.url)}
                        >
                          {item.icon && <item.icon className={isActive ? 'text-synkro-green' : ''} />}
                          <span className={isActive ? 'font-semibold truncate' : 'truncate'}>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
}
