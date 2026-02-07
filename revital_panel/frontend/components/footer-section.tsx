"use client";

import React from "react";
import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { 
  LayoutDashboard, 
  LogIn, 
  UserPlus,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/hooks/use-auth";
import { isAuthenticated } from "@/utils/apiWrapper";

<<<<<<< HEAD:synkro_panel/frontend/components/footer-section.tsx
=======
const platformLinks = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, authRequired: true },
  { title: "Login", href: "/login", icon: LogIn, authRequired: false, hideWhenAuth: true },
  { title: "Sign Up", href: "/register", icon: UserPlus, authRequired: false, hideWhenAuth: true },
];

const productLinks = [
  { title: "Features", href: "#features" },
  { title: "Pricing", href: "#pricing" },
  { title: "Security", href: "#security" },
  { title: "FAQ", href: "#faq" },
];

const companyLinks = [
  { title: "About Us", href: "/about" },
  { title: "Privacy Policy", href: "/privacy" },
  { title: "Terms of Service", href: "/terms" },
  { title: "Contact", href: "#contact" },
];

const resourceLinks = [
  { title: "Documentation", href: "/docs" },
  { title: "Blog", href: "/blog" },
  { title: "Support", href: "/help" },
  { title: "Changelog", href: "/changelog" },
];

const socialLinks = [
  { title: "Facebook", href: "https://facebook.com/revital", icon: Facebook },
  { title: "Instagram", href: "https://instagram.com/revital", icon: Instagram },
  { title: "Twitter", href: "https://twitter.com/revital", icon: Twitter },
  { title: "LinkedIn", href: "https://linkedin.com/company/revital", icon: Linkedin },
];

>>>>>>> main:revital_panel/frontend/components/footer-section.tsx
export function Footer() {
  const t = useTranslations();
  const { user } = useAuth();
  const isLoggedIn = isAuthenticated() && !!user;

  const platformLinks = [
    { title: t('dashboard.title'), href: "/dashboard", icon: LayoutDashboard, authRequired: true },
    { title: t('auth.login.submitButton'), href: "/login", icon: LogIn, authRequired: false, hideWhenAuth: true },
    { title: t('auth.register.submitButton'), href: "/register", icon: UserPlus, authRequired: false, hideWhenAuth: true },
  ];

  const productLinks = [
    { title: t('footer.sections.product.links.features'), href: "#features" },
    { title: t('footer.sections.product.links.pricing'), href: "#pricing" },
    { title: t('navigation.menuItems.security'), href: "#security" },
    { title: t('navigation.menuItems.faq'), href: "#faq" },
  ];

  const companyLinks = [
    { title: t('footer.sections.company.links.about'), href: "/about" },
    { title: t('footer.sections.company.links.privacy'), href: "/privacy" },
    { title: t('footer.sections.company.links.terms'), href: "/terms" },
    { title: t('footer.sections.company.links.contact'), href: "#contact" },
  ];

  const resourceLinks = [
    { title: t('footer.sections.resources.links.docs'), href: "/docs" },
    { title: t('footer.sections.resources.links.blog'), href: "/blog" },
    { title: t('footer.sections.resources.links.support'), href: "/help" },
    { title: t('footer.sections.resources.links.changelog'), href: "/changelog" },
  ];

  const socialLinks = [
    { title: t('footer.sections.social.links.facebook'), href: "https://facebook.com/synkro", icon: Facebook },
    { title: t('footer.sections.social.links.instagram'), href: "https://instagram.com/synkro", icon: Instagram },
    { title: t('footer.sections.social.links.twitter'), href: "https://twitter.com/synkro", icon: Twitter },
    { title: t('footer.sections.social.links.linkedin'), href: "https://linkedin.com/company/synkro", icon: Linkedin },
  ];

  const handleScrollLink = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="w-full border-t border-revital-green/20 bg-white dark:bg-revital-black">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-6">
          {/* Brand Column */}
          <AnimatedContainer className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.webp"
                alt="Revital Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="text-2xl font-bold text-revital-green">Revital</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t('footer.company.description')}
            </p>
            {/* Social Links */}
            <div className="flex gap-4 pt-4">
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.title}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-revital-green transition-colors"
                    aria-label={link.title}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </AnimatedContainer>

          {/* Links Columns */}
          <AnimatedContainer delay={0.1} className="lg:col-span-4">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {/* Platform */}
              <div>
<<<<<<< HEAD:synkro_panel/frontend/components/footer-section.tsx
                <h3 className="text-sm font-semibold text-synkro-green mb-4">
                  {t('footer.sections.platform.label')}
=======
                <h3 className="text-sm font-semibold text-revital-green mb-4">
                  Platform
>>>>>>> main:revital_panel/frontend/components/footer-section.tsx
                </h3>
                <ul className="space-y-3">
                  {platformLinks.map((link) => {
                    // Hide dashboard link if not logged in
                    if (link.authRequired && !isLoggedIn) {
                      return null;
                    }
                    // Hide login/signup links if logged in
                    if (link.hideWhenAuth && isLoggedIn) {
                      return null;
                    }
                    const Icon = link.icon;
                    return (
                      <li key={link.title}>
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-revital-green transition-colors inline-flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {link.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Product */}
              <div>
<<<<<<< HEAD:synkro_panel/frontend/components/footer-section.tsx
                <h3 className="text-sm font-semibold text-synkro-green mb-4">
                  {t('footer.sections.product.label')}
=======
                <h3 className="text-sm font-semibold text-revital-green mb-4">
                  Product
>>>>>>> main:revital_panel/frontend/components/footer-section.tsx
                </h3>
                <ul className="space-y-3">
                  {productLinks.map((link) => (
                    <li key={link.title}>
                      <a
                        href={link.href}
                        onClick={(e) => handleScrollLink(e, link.href)}
                        className="text-sm text-muted-foreground hover:text-revital-green transition-colors"
                      >
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
<<<<<<< HEAD:synkro_panel/frontend/components/footer-section.tsx
                <h3 className="text-sm font-semibold text-synkro-green mb-4">
                  {t('footer.sections.company.label')}
=======
                <h3 className="text-sm font-semibold text-revital-green mb-4">
                  Company
>>>>>>> main:revital_panel/frontend/components/footer-section.tsx
                </h3>
                <ul className="space-y-3">
                  {companyLinks.map((link) => (
                    <li key={link.title}>
                      {link.href.startsWith("#") ? (
                        <a
                          href={link.href}
                          onClick={(e) => handleScrollLink(e, link.href)}
                          className="text-sm text-muted-foreground hover:text-revital-green transition-colors"
                        >
                          {link.title}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-revital-green transition-colors"
                        >
                          {link.title}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources */}
              <div>
<<<<<<< HEAD:synkro_panel/frontend/components/footer-section.tsx
                <h3 className="text-sm font-semibold text-synkro-green mb-4">
                  {t('footer.sections.resources.label')}
=======
                <h3 className="text-sm font-semibold text-revital-green mb-4">
                  Resources
>>>>>>> main:revital_panel/frontend/components/footer-section.tsx
                </h3>
                <ul className="space-y-3">
                  {resourceLinks.map((link) => (
                    <li key={link.title}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-revital-green transition-colors"
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </AnimatedContainer>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-revital-green/10">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
<<<<<<< HEAD:synkro_panel/frontend/components/footer-section.tsx
              {t('footer.copyright', { year: new Date().getFullYear() })}
=======
              © {new Date().getFullYear()} Revital. All rights reserved.
>>>>>>> main:revital_panel/frontend/components/footer-section.tsx
            </p>
            <div className="flex items-center gap-4">
              <a
                href="mailto:info@revital.com"
                className="text-sm text-muted-foreground hover:text-revital-green transition-colors inline-flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                info@revital.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>["className"];
  children: ReactNode;
};

function AnimatedContainer({
  className,
  delay = 0.1,
  children,
}: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
