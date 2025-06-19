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
  links?: SocialLink[]
}

const defaultSocialLinks: SocialLink[] = [
  {
    platform: "Facebook",
    href: "#",
    icon: <Facebook className="h-5 w-5" />,
    hoverColor: "hover:bg-blue-600"
  },
  {
    platform: "Instagram", 
    href: "#",
    icon: <Instagram className="h-5 w-5" />,
    hoverColor: "hover:bg-pink-600"
  },
  {
    platform: "Twitter",
    href: "#", 
    icon: <Twitter className="h-5 w-5" />,
    hoverColor: "hover:bg-blue-400"
  },
  {
    platform: "YouTube",
    href: "#",
    icon: <Youtube className="h-5 w-5" />,
    hoverColor: "hover:bg-red-600"
  },
  {
    platform: "LinkedIn",
    href: "#",
    icon: <Linkedin className="h-5 w-5" />,
    hoverColor: "hover:bg-blue-700"
  }
]

const SocialSection: React.FC<SocialSectionProps> = ({ 
  title = "Síguenos", 
  links = defaultSocialLinks 
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-blue-400 dark:text-blue-300 text-lg font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {links.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className={`p-3 bg-gray-800 dark:bg-gray-700 rounded-full ${link.hoverColor} transition-colors touch-manipulation text-gray-300 dark:text-gray-400`}
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