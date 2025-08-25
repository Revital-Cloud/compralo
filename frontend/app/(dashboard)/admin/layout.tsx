'use client';

import { useAdminRedirect } from "@/hooks/use-role-redirect";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/dashboard/sidebar";
import AdminHeader from "@/components/layout/dashboard/admin-header";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isLoading, hasRequiredRole } = useAdminRedirect();

  // Mostrar un loader a pantalla completa mientras se verifica la autenticación y permisos
  // Esto evita que se muestre contenido del admin a usuarios no autorizados
  if (isLoading || !hasRequiredRole) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background dark:bg-gray-950 transition-colors duration-300">
        <Loader2 className="h-8 w-8 animate-spin text-foreground dark:text-gray-300" />
      </div>
    );
  }

  // Si el usuario es admin y está autenticado, mostrar el layout del dashboard
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col bg-background dark:bg-gray-950 transition-colors duration-300">
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
  );
}
