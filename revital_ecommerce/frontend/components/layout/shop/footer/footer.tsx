"use client"

import * as React from "react"
import { Separator } from "@/components/ui"
import {
  // NewsletterSection, // Comentado: Banner Club VIP deshabilitado
  AboutSection,
  CategoriesSection,
  SocialSection,
  FeaturesSection,
  PaymentMethods,
  LegalLinks,
  CopyrightSection
} from "./components"
import { companyLinks, customerServiceLinks } from "@/lib/footer-config"
import { useFooterCategories } from "@/hooks"

interface FooterProps {
  className?: string
  onNewsletterSubscribe?: (email: string) => void
}

const Footer: React.FC<FooterProps> = ({ className = "", onNewsletterSubscribe }) => {
  const { data: footerCategories, isLoading, error } = useFooterCategories()

  return (
    <footer className={`bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 transition-colors duration-300 ${className}`}>
      {/* Newsletter Section - Comentado: Banner Club VIP deshabilitado */}
      {/* <NewsletterSection onSubscribe={onNewsletterSubscribe} /> */}

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_0.85fr_1.2fr] gap-6 lg:gap-6 xl:gap-4">
          {/* About Us */}
          <AboutSection />

          {/* Categorías (raíz) - máximo 5 */}
          <CategoriesSection
            title="Categorías"
            categories={(footerCategories?.categories || []).slice(0, 5)}
            isLoading={isLoading}
            error={error}
          />

          {/* Líneas (hijas de categorías) - máximo 5 */}
          <CategoriesSection
            title="Líneas"
            categories={(footerCategories?.lineas || []).slice(0, 5)}
            isLoading={isLoading}
            error={error}
          />

          {/* Sublíneas (nietas) - máximo 5 */}
          <CategoriesSection
            title="Sublíneas"
            categories={(footerCategories?.sublineas || []).slice(0, 5)}
            isLoading={isLoading}
            error={error}
          />

          {/* Company */}
          <CategoriesSection title="Empresa" categories={companyLinks} />

          {/* Follow Us & Customer Service - columna con más espacio para iconos */}
          <div className="space-y-6 sm:col-span-2 lg:col-span-1 min-w-0">
            {/* Social Media */}
            <SocialSection />

            {/* Customer Service */}
            <div className="space-y-4">
              <h4 className="text-gray-900 dark:text-white font-semibold transition-colors duration-300">Atención al Cliente</h4>
              <ul className="space-y-2.5">
                {customerServiceLinks.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href} 
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#ec2538] dark:hover:text-red-400 transition-colors duration-300 block py-1"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-gray-200 dark:bg-gray-700" />

        {/* Features Section */}
        <FeaturesSection />

        <Separator className="my-6 sm:my-8 bg-gray-200 dark:bg-gray-700" />

        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 lg:gap-4">
          <LegalLinks />
          <PaymentMethods />
        </div>

        <Separator className="my-6 bg-gray-200 dark:bg-gray-700" />

        {/* Copyright */}
        <CopyrightSection />
      </div>
    </footer>
  )
}

export default Footer