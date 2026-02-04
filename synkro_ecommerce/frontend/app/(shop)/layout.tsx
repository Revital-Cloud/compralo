'use client';

import EcommerceHeader from "@/components/layout/shop/header/header";
import { defaultMenuItems } from "@/lib/menu-config";
import EcommerceFooter from "@/components/layout/shop/footer/footer";
import { InformativeChatbotWidget } from "@/components/chatbot-widget/informative-chatbot-widget";
import { RouteGuard } from "@/components/auth/route-guard";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, isAuthenticated, isLoadingUser, isHydrated } = useAuth();
  const router = useRouter();

  // Solo redirigir admins, no proteger la ruta
  useEffect(() => {
    if (isHydrated && !isLoadingUser && isAuthenticated) {
      const userRole = Number(user?.id_rol);
      if (userRole === 1) {
        router.replace('/admin');
      }
    }
  }, [isHydrated, isLoadingUser, isAuthenticated, user, router]);

  // Mostrar loader mientras se carga
  if (!isHydrated || isLoadingUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin border-4 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Renderizar el layout normal
  return (
    <>
      <EcommerceHeader 
        menuItems={defaultMenuItems}
        // cartCount se obtiene automáticamente del hook useCartInfo
      />
      {children}
      <EcommerceFooter />
      <InformativeChatbotWidget />
    </>
  );
}
