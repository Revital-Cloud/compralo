"use client"

import * as React from "react"
import Link from "next/link"
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
} from "lucide-react"

interface SocialLink {
  platform: string
  href: string
  icon: React.ReactNode
  hoverColor: string
}

interface SocialSectionProps {
  title?: string
  links?: Omit<SocialLink, 'hoverColor'>[]
}

const defaultSocialLinks: Omit<SocialLink, 'hoverColor'>[] = [
  {
    platform: "Facebook",
    href: "#",
    icon: <Facebook className="h-5 w-5" />,
  },
  {
    platform: "Instagram", 
    href: "#",
    icon: <Instagram className="h-5 w-5" />,
  },
  {
    platform: "Twitter",
    href: "#", 
    icon: <Twitter className="h-5 w-5" />,
  },
  {
    platform: "YouTube",
    href: "#",
    icon: <Youtube className="h-5 w-5" />,
  },
  {
    platform: "LinkedIn",
    href: "#",
    icon: <Linkedin className="h-5 w-5" />,
  }
]

const SocialSection: React.FC<SocialSectionProps> = ({ 
  title = "Síguenos", 
  links = defaultSocialLinks 
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-primary text-lg font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {links.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className="p-3 bg-secondary-foreground/10 rounded-full hover:bg-primary transition-colors touch-manipulation text-secondary-foreground/80 hover:text-primary-foreground"
            aria-label={link.platform}
          >
            {link.icon}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default SocialSection 