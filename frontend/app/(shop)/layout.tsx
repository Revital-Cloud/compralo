import type { Metadata } from "next";
import EcommerceHeader from "@/components/layout/shop/header/header";
import { defaultMenuItems } from "@/lib/menu-config";
import EcommerceFooter from "@/components/layout/shop/footer/footer";

export const metadata: Metadata = {
  title: "Tienda Virtual",
  description: "Tienda Virtual",
};

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
