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
    text: "Ofertas",
    href: "/ofertas"
  },
  {
    text: "Contacto",
    href: "/contacto"
  }
] 