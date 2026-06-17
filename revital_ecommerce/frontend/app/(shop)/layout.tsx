import EcommerceHeader from '@/components/layout/shop/header/header'
import { defaultMenuItems, type NavItem } from '@/lib/menu-config'
import EcommerceFooter from '@/components/layout/shop/footer/footer'
import { TopInfoBar } from '@/components/layout/shop/top-info-bar'
import { ShopAuthRedirect } from './ShopAuthRedirect'
import { getPublishedTheme } from '@/lib/theme-public'
import { DEFAULT_THEME } from '@/lib/theme-css'

export default async function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Chrome global (marca + navegación) desde el Theme publicado; fallback al default.
  const site = (await getPublishedTheme()) ?? DEFAULT_THEME
  const menuItems: NavItem[] = site.header.nav?.length
    ? site.header.nav.map((item) => ({ text: item.text, href: item.href }))
    : defaultMenuItems

  const logo = site.theme.logo_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={site.theme.logo_url} alt={site.header.brand} className="h-9 w-auto sm:h-10" />
  ) : undefined

  return (
    <ShopAuthRedirect>
      <TopInfoBar />
      <EcommerceHeader brand={site.header.brand} menuItems={menuItems} logo={logo} />
      {children}
      <EcommerceFooter brand={site.header.brand} />
    </ShopAuthRedirect>
  )
}
