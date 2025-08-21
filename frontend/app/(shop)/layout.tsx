'use client';

import { useRoleRedirect } from "@/hooks/use-role-redirect";
import EcommerceHeader from "@/components/layout/shop/header/header";
import { defaultMenuItems } from "@/lib/menu-config";
import EcommerceFooter from "@/components/layout/shop/footer/footer";
import { Loader2 } from "lucide-react";

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Hook para redirigir administradores que accedan a la tienda
  const { isLoading, userRole } = useRoleRedirect({
    // No requerir rol específico, permitir acceso a todos
    // Pero redirigir admins a su panel
    requiredRole: undefined,
    showMessages: false, // No mostrar mensajes para la tienda pública
  });

  // Si el usuario es admin, redirigir automáticamente
  if (userRole === 1) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <EcommerceHeader 
        menuItems={defaultMenuItems}
        cartCount={0} // Aquí puedes conectar el estado real del carrito
      />
      {children}
      <EcommerceFooter />
    </>
  );
}
