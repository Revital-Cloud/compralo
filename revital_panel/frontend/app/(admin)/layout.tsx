'use client';

import type React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AdminGuard } from '@/components/auth';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getQueryClient } from '@/lib/query-client';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
    <AdminGuard>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AdminSidebar variant="inset" />
        <SidebarInset className="md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none">
          <AdminHeader />
          <div className="flex min-h-screen flex-1 flex-col bg-background transition-colors duration-200">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">{children}</div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminGuard>
    </QueryClientProvider>
  );
}

