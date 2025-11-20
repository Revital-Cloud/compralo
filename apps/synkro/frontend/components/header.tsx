"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeSwitcherButton } from "@/components/ui/theme-switcher-button";

const menuItems = [
  { name: "Features", href: "#features" },
  { name: "Seguridad", href: "#security" },
  { name: "Pricing", href: "#pricing" },
  { name: "FAQ", href: "#faq" },
];

const Logo = ({ className }: { className?: string }) => {
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center space-x-3 transition-all duration-300 hover:scale-105",
        className
      )}
      aria-label="Synkro - Ir al inicio"
    >
      {/* Logo Image */}
      <div className="relative">
        <Image
          src="/logo.webp"
          alt="Synkro Logo"
          width={100}
          height={100}
          className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110"
          priority
        />
        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-full bg-synkro-green/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <span className="text-xl font-bold text-synkro-green transition-colors duration-300 group-hover:text-synkro-green/80">
          Synkro
        </span>
        <span className="text-xs text-muted-foreground font-medium tracking-wide">
          E-commerce Platform
        </span>
      </div>
    </Link>
  );
};

export const Header = () => {
  // Renamed HeroHeader to Header
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

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
              "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Logo />

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.href}
                      className="text-muted-foreground hover:text-synkro-green block duration-150"
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

            <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <a
                        href={item.href}
                        className="text-muted-foreground hover:text-synkro-green block duration-150"
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
                  <li className="flex items-center">
                    <span className="text-muted-foreground mr-2">Tema</span>
                    <ThemeSwitcherButton />
                  </li>
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <ThemeSwitcherButton className="hidden lg:flex" />
                <Button
                  asChild
                  size="sm"
                  className={cn(
                    isScrolled ? "lg:inline-flex" : "hidden",
                    "hidden lg:inline-flex bg-synkro-green hover:bg-synkro-green/90 text-synkro-black"
                  )}
                >
                  <Link href="#contact">
                    <span>Contáctanos</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className={cn(
                    "lg:hidden bg-synkro-green hover:bg-synkro-green/90 text-synkro-black"
                  )}
                >
                  <Link href="#contact">
                    <span>Contáctanos</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
