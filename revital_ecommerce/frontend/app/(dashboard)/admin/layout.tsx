'use client';

import { SidebarProvider, SidebarInset } from "@/components/ui"
import { AppSidebar } from "@/components/layout/dashboard/sidebar";
import AdminHeader from "@/components/layout/dashboard/admin-header";
import { AdminGuard } from "@/components/auth/route-guard";
import { AdminTourProvider } from "./_tour/useAdminDriverTour";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminGuard>
      <AdminTourProvider>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />
          <SidebarInset className="md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none">
            <AdminHeader />
            <div className="flex flex-1 flex-col bg-background transition-colors duration-300">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  <div className="px-4 lg:px-6">
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AdminTourProvider>
    </AdminGuard>
  );
}
