'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  section?: string;
}

interface NavMainProps {
  items: NavItem[];
}

export function ClientNavMain({ items }: NavMainProps) {
  const pathname = usePathname();

  // Group items by section
  const groupedItems = items.reduce((acc, item) => {
    const section = item.section || 'other';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const sections = [
    { key: 'overview', label: 'Overview' },
    { key: 'store', label: 'My Store' },
    { key: 'subscription', label: 'Subscription' },
    { key: 'settings', label: 'Settings' },
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
                {section.label}
              </h3>
            </div>
            <SidebarGroupContent className="flex flex-col gap-1">
              <SidebarMenu>
                {sectionItems.map((item) => {
                  const isActive = item.url.endsWith('/dashboard')
                    ? pathname === item.url
                    : pathname === item.url || pathname.startsWith(item.url + '/');
                  
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
                        <Link href={item.url}>
                          {item.icon && <item.icon className={isActive ? 'text-synkro-green' : ''} />}
                          <span className={isActive ? 'font-semibold' : ''}>{item.title}</span>
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
