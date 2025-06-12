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
    items: [
      {
        text: "Electrónicos",
        description: "Smartphones, laptops y más",
        href: "/productos/electronicos"
      },
      {
        text: "Ropa",
        description: "Moda para hombre y mujer",
        href: "/productos/ropa"
      },
      {
        text: "Hogar",
        description: "Decoración y muebles",
        href: "/productos/hogar"
      }
    ]
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