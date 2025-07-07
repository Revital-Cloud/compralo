'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { Metadata } from "next";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/dashboard/sidebar";
import AdminHeader from "@/components/layout/dashboard/admin-header";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { user, isAuthenticated, isLoadingUser } = useAuth();

  useEffect(() => {
    // No hacer nada mientras carga
    if (isLoadingUser) return;

    // Si no está autenticado o no es admin, redirigir
    if (!isAuthenticated || user?.id_rol !== 1) {
      toast.error("Acceso denegado. Debes ser administrador.");
      router.replace("/login");
    }
  }, [isLoadingUser, isAuthenticated, user, router]);

  // Mostrar un loader a pantalla completa mientras se verifica
  if (isLoadingUser || !isAuthenticated || user?.id_rol !== 1) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Si es admin, mostrar el layout
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
        <div className="flex flex-1 flex-col">
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
