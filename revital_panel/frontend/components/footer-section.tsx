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
import { useAuth } from "@/hooks/use-auth";
import { isAuthenticated } from "@/utils/apiWrapper";
import { useTranslations } from "next-intl";

const PRODUCT_LINK_KEYS = ["features", "pricing", "security", "faq"] as const;
const PRODUCT_HREFS: Record<(typeof PRODUCT_LINK_KEYS)[number], string> = {
  features: "#features",
  pricing: "#pricing",
  security: "#security",
  faq: "#faq",
};
const COMPANY_LINK_KEYS = ["about", "privacy", "terms", "contact"] as const;
const COMPANY_HREFS: Record<(typeof COMPANY_LINK_KEYS)[number], string> = {
  about: "/about",
  privacy: "/privacy",
  terms: "/terms",
  contact: "#contact",
};
const RESOURCE_LINK_KEYS = ["docs", "blog", "support", "changelog"] as const;
const RESOURCE_HREFS: Record<(typeof RESOURCE_LINK_KEYS)[number], string> = {
  docs: "/docs",
  blog: "/blog",
  support: "/help",
  changelog: "/changelog",
};
const SOCIAL_KEYS = ["facebook", "instagram", "twitter", "linkedin"] as const;
const SOCIAL_ICONS = [Facebook, Instagram, Twitter, Linkedin] as const;

export function Footer() {
  const t = useTranslations("footer");
  const { user } = useAuth();
  const isLoggedIn = isAuthenticated() && !!user;

  const platformLinks = [
    { title: t("sections.platform.links.dashboard"), href: "/dashboard", icon: LayoutDashboard, authRequired: true as const },
    { title: t("sections.platform.links.login"), href: "/login", icon: LogIn, authRequired: false as const, hideWhenAuth: true as const },
    { title: t("sections.platform.links.signUp"), href: "/register", icon: UserPlus, authRequired: false as const, hideWhenAuth: true as const },
  ];
  const productLinks = PRODUCT_LINK_KEYS.map((key) => ({
    title: t(`sections.product.links.${key}`),
    href: PRODUCT_HREFS[key],
  }));
  const companyLinks = COMPANY_LINK_KEYS.map((key) => ({
    title: t(`sections.company.links.${key}`),
    href: COMPANY_HREFS[key],
  }));
  const resourceLinks = RESOURCE_LINK_KEYS.map((key) => ({
    title: t(`sections.resources.links.${key}`),
    href: RESOURCE_HREFS[key],
  }));
  const socialHrefs: Record<(typeof SOCIAL_KEYS)[number], string> = {
    facebook: "https://facebook.com/revital",
    instagram: "https://instagram.com/revital",
    twitter: "https://twitter.com/revital",
    linkedin: "https://linkedin.com/company/revital",
  };
  const socialLinks = SOCIAL_KEYS.map((key, i) => ({
    title: t(`sections.social.links.${key}`),
    href: socialHrefs[key],
    icon: SOCIAL_ICONS[i],
  }));

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
              {t("company.description")}
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
                <h3 className="text-sm font-semibold text-revital-green mb-4">
                  {t("sections.platform.label")}
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

              <div>
                <h3 className="text-sm font-semibold text-revital-green mb-4">
                  {t("sections.product.label")}
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

              <div>
                <h3 className="text-sm font-semibold text-revital-green mb-4">
                  {t("sections.company.label")}
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

              <div>
                <h3 className="text-sm font-semibold text-revital-green mb-4">
                  {t("sections.resources.label")}
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
              {t("copyright", { year: new Date().getFullYear() })}
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
