"use client"

import * as React from "react"
import Link from "next/link"

interface LegalLink {
  label: string
  href: string
}

interface LegalLinksProps {
  links?: LegalLink[]
}

const defaultLegalLinks: LegalLink[] = [
  { label: "Términos y Condiciones", href: "/terminos" },
  { label: "Política de Privacidad", href: "/privacidad" },
  { label: "Política de Cookies", href: "/cookies" },
  { label: "Accesibilidad", href: "/accesibilidad" }
]

const LegalLinks: React.FC<LegalLinksProps> = ({ links = defaultLegalLinks }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm order-2 lg:order-1">
      {links.map((link, index) => (
        <Link 
          key={index}
          href={link.href} 
          className="text-gray-300 dark:text-gray-400 hover:text-blue-400 dark:hover:text-white transition-colors py-1"
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
}

export default LegalLinks 