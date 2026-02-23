"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, LogIn, LayoutDashboard, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeSwitcherButton } from "@/components/ui/theme-switcher-button";
import { LanguageSwitcherButton } from "@/components/ui/language-switcher-button";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/hooks/use-auth";
import { isAuthenticated } from "@/utils/apiWrapper";

function Logo({ className }: { className?: string }) {
  const t = useTranslations("navigation");
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center space-x-3 transition-all duration-300 hover:scale-105",
        className
      )}
      aria-label="Revital - Go to home"
    >
      <div className="relative">
        <Image
          src="/logo.webp"
          alt="Revital Logo"
          width={100}
          height={100}
          className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110"
          priority
        />
        <div className="absolute inset-0 rounded-full bg-revital-green/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-revital-green transition-colors duration-300 group-hover:text-revital-green/80">
          Revital
        </span>
        <span className="text-xs text-muted-foreground font-medium tracking-wide">
          {t("platformSubtitle")}
        </span>
      </div>
    </Link>
  );
}

export const Header = () => {
  const t = useTranslations();
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const { user, isLoading } = useAuth();
  const isLoggedIn = isAuthenticated() && !!user;

  const menuItems = [
    { name: t('navigation.menuItems.features'), href: "#features" },
    { name: t('navigation.menuItems.security'), href: "#security" },
    { name: t('navigation.menuItems.pricing'), href: "#pricing" },
    { name: t('navigation.menuItems.faq'), href: "#faq" },
  ];

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="fixed z-20 w-full px-2 group"
      >
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-4 sm:px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "bg-background/95 rounded-2xl border border-border/80 shadow-sm backdrop-blur-md"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Logo />

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            {/* Desktop Navigation - Center */}
            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.href}
                      className="text-muted-foreground hover:text-revital-green block duration-150"
                      onClick={e => {
                        e.preventDefault();
                        document
                          .querySelector(item.href)
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <span>{item.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Desktop & Mobile Menu */}
            <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              {/* Mobile Menu */}
              <div className="lg:hidden w-full">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <a
                        href={item.href}
                        className="text-muted-foreground hover:text-revital-green block duration-150"
                        onClick={e => {
                          e.preventDefault();
                          document
                            .querySelector(item.href)
                            ?.scrollIntoView({ behavior: "smooth" });
                          setMenuState(false);
                        }}
                      >
                        <span>{item.name}</span>
                      </a>
                    </li>
                  ))}
                  <li className="flex items-center gap-2">
                    <span className="text-muted-foreground">Idioma</span>
                    <LanguageSwitcherButton onSwitch={() => setMenuState(false)} />
                  </li>
                  <li className="flex items-center">
                    <span className="text-muted-foreground mr-2">Theme</span>
                    <ThemeSwitcherButton />
                  </li>
                </ul>
              </div>

              {/* Desktop: login/registro primero, al final bandera + tema */}
              <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-end md:w-auto lg:flex-row lg:items-center lg:gap-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                  {!isMounted || isLoading ? (
                    <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
                  ) : isLoggedIn ? (
                    <Button
                      asChild
                      size="sm"
                      className="bg-revital-green hover:bg-revital-green/90 text-revital-black font-medium"
                    >
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>{t('dashboard.title')}</span>
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Link href="/login">
                          <LogIn className="mr-2 h-4 w-4" />
                          <span>{t('auth.login.submitButton')}</span>
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        className="bg-revital-green hover:bg-revital-green/90 text-revital-black font-medium"
                      >
                        <Link href="/register">
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>{t('auth.register.submitButton')}</span>
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
                <div className="h-px w-full bg-border/60 lg:hidden" aria-hidden />
                <div className="flex items-center lg:border-l lg:border-border/60 lg:pl-3">
                  <LanguageSwitcherButton className="hidden lg:inline-flex" />
                  <ThemeSwitcherButton className="hidden lg:inline-flex" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
