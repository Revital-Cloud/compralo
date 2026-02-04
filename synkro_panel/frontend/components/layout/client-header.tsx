'use client';

import { usePathname } from 'next/navigation';
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeSwitcherButton } from '@/components/ui/theme-switcher-button';
import { Bell } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/instance': 'My Instance',
  '/instance/settings': 'Instance Settings',
  '/subscription': 'Subscription',
  '/billing': 'Billing',
  '/resources': 'Resource Usage',
  '/settings': 'Settings',
  '/settings/profile': 'Profile',
};

function getPageTitle(pathname: string): string {
  // Check for exact match first
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }
  
  // Check for partial matches (for dynamic routes)
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path + '/')) {
      return title;
    }
  }
  
  return 'Dashboard';
}

export function ClientHeader() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

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
        {/* Notifications button (placeholder for future functionality) */}
        <button 
          className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {/* Notification badge - uncomment when notifications are implemented */}
          {/* <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" /> */}
        </button>
        <ThemeSwitcherButton />
      </div>
    </header>
  );
}
