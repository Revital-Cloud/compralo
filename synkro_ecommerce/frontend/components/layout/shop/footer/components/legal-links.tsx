"use client"

import * as React from "react"
import Link from "next/link"
import { CookieSettings } from "@/components/ui"
import { NoSSR } from "@/components/ui"

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
          className="text-gray-600 dark:text-gray-400 hover:text-[#ec2538] dark:hover:text-red-400 transition-colors duration-300 py-1"
        >
          {link.label}
        </Link>
      ))}
      
      <NoSSR>
        <CookieSettings />
      </NoSSR>
    </div>
  )
}

export default LegalLinks 