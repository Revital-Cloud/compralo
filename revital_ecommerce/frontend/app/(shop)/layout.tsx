import EcommerceHeader from '@/components/layout/shop/header/header'
import { defaultMenuItems } from '@/lib/menu-config'
import EcommerceFooter from '@/components/layout/shop/footer/footer'
import { TopInfoBar } from '@/components/layout/shop/top-info-bar'
import { ShopAuthRedirect } from './ShopAuthRedirect'

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ShopAuthRedirect>
      <TopInfoBar />
      <EcommerceHeader
        menuItems={defaultMenuItems}
      />
      {children}
      <EcommerceFooter />
    </ShopAuthRedirect>
  )
}
