"use client"

import * as React from "react"
import Link from "next/link"
import {
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
} from "lucide-react"

/** Icono X (antes Twitter) - logo actual de la red */
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

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
    href: "https://www.facebook.com/",
    icon: <Facebook className="h-5 w-5" />,
  },
  {
    platform: "Instagram",
    href: "https://www.instagram.com/",
    icon: <Instagram className="h-5 w-5" />,
  },
  {
    platform: "X",
    href: "https://x.com/",
    icon: <XIcon className="h-5 w-5" />,
  },
  {
    platform: "YouTube",
    href: "https://www.youtube.com/",
    icon: <Youtube className="h-5 w-5" />,
  },
  {
    platform: "LinkedIn",
    href: "https://www.linkedin.com/",
    icon: <Linkedin className="h-5 w-5" />,
  },
]

const SocialSection: React.FC<SocialSectionProps> = ({ 
  title = "Síguenos", 
  links = defaultSocialLinks 
}) => {
  return (
    <div className="space-y-4 min-w-0">
      <h3 className="text-[#ec2538] dark:text-red-400 text-lg font-semibold transition-colors duration-300">{title}</h3>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {links.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-[#ec2538] dark:hover:bg-red-500 transition-colors duration-300 touch-manipulation text-gray-600 dark:text-gray-300 hover:text-white"
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