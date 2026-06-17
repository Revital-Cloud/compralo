"use client"

import * as React from "react"
import Link from "next/link"

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.89 3.78-3.89 1.1 0 2.25.2 2.25.2v2.46H15.2c-1.25 0-1.64.77-1.64 1.56V12h2.8l-.45 2.9h-2.35v6.98A10 10 0 0 0 22 12z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5zm8.95 1.35a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z" />
    </svg>
  )
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M21.58 7.19a2.87 2.87 0 0 0-2.02-2.03C17.77 4.7 12 4.7 12 4.7s-5.77 0-7.56.46A2.87 2.87 0 0 0 2.42 7.2C1.96 9 1.96 12 1.96 12s0 3 .46 4.81a2.87 2.87 0 0 0 2.02 2.03c1.79.46 7.56.46 7.56.46s5.77 0 7.56-.46a2.87 2.87 0 0 0 2.02-2.03c.46-1.8.46-4.81.46-4.81s0-3-.46-4.81zM10.1 15.1V8.9L15.5 12l-5.4 3.1z" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.83v1.64h.05c.53-1.01 1.84-2.07 3.79-2.07C20.22 8.57 21 10.9 21 13.94V21h-4v-6.25c0-1.49-.03-3.4-2.07-3.4-2.07 0-2.39 1.62-2.39 3.29V21H9z" />
    </svg>
  )
}

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
    icon: <FacebookIcon className="h-5 w-5" />,
  },
  {
    platform: "Instagram",
    href: "https://www.instagram.com/",
    icon: <InstagramIcon className="h-5 w-5" />,
  },
  {
    platform: "X",
    href: "https://x.com/",
    icon: <XIcon className="h-5 w-5" />,
  },
  {
    platform: "YouTube",
    href: "https://www.youtube.com/",
    icon: <YouTubeIcon className="h-5 w-5" />,
  },
  {
    platform: "LinkedIn",
    href: "https://www.linkedin.com/",
    icon: <LinkedInIcon className="h-5 w-5" />,
  },
]

const SocialSection: React.FC<SocialSectionProps> = ({ 
  title = "Síguenos", 
  links = defaultSocialLinks 
}) => {
  return (
    <div className="space-y-4 min-w-0">
      <h3 className="text-brand dark:text-brand text-lg font-semibold transition-colors duration-300">{title}</h3>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {links.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-brand dark:hover:bg-brand transition-colors duration-300 touch-manipulation text-gray-600 dark:text-gray-300 hover:text-white"
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