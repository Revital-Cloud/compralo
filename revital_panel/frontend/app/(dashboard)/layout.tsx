'use client';

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ClientSidebar } from '@/components/layout/client-sidebar';
import { ClientHeader } from '@/components/layout/client-header';
import { ClientGuard } from '@/components/auth/client-guard';
import { PrefetchOnMount } from '@/components/layout/prefetch-on-mount';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClientGuard>
      <PrefetchOnMount />
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <ClientSidebar variant="inset" />
        <SidebarInset className="md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none">
          <ClientHeader />
          <div className="flex flex-1 flex-col bg-background transition-colors duration-200">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">{children}</div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ClientGuard>
  );
}

