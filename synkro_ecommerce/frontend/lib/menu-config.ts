export interface NavItem {
  text: string
  href?: string
  items?: {
    text: string
    description?: string
    href: string
  }[]
}

export const defaultMenuItems: NavItem[] = [
  {
    text: "Inicio",
    href: "/"
  },
  {
    text: "Productos",
    href: "/products"
  },
  {
    text: "Descuentos",
    href: "/discounts"
  },
  {
    text: "Contacto",
    href: "/contacto"
  }
] 