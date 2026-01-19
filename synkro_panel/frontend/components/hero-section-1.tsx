"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, LayoutDashboard, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { Header } from "./header";
import { heroContent } from "@/content";
import { useAuth } from "@/hooks/use-auth";
import { isAuthenticated } from "@/utils/apiWrapper";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export function HeroSection() {
  const { user, isLoading } = useAuth();
  const isLoggedIn = isAuthenticated() && !!user;

  const scrollToSection = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Header />
      <main className="overflow-hidden">
        <div
          aria-hidden
          className="z-2 absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block"
        >
          <div className="w-140 h-320 -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(142,64%,65%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-320 absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(142,64%,65%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-320 -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(142,64%,65%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>
        <section>
          <div className="relative pt-24 md:pt-36">
            {/* Clean background */}
            <div className="absolute inset-0 -z-20" />
            <div
              aria-hidden
              className="absolute inset-0 -z-10 size-full dark:bg-synkro-black/60 [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]"
            />
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  {/* Platform Badge */}
                  <a
                    href="#features"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("#features");
                    }}
                    className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950 border-synkro-green/20 hover:border-synkro-green/40"
                  >
                    <span className="text-foreground text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-synkro-green" />
                      Introducing Synkro: Your All-in-One E-commerce Platform
                    </span>
                    <span className="dark:border-background block h-4 w-0.5 border-l bg-synkro-green dark:bg-synkro-green"></span>

                    <div className="bg-synkro-green group-hover:bg-synkro-green/90 size-6 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3 text-synkro-black" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3 text-synkro-black" />
                        </span>
                      </div>
                    </div>
                  </a>

                  <h1 className="mt-8 max-w-4xl mx-auto text-balance text-5xl md:text-6xl lg:mt-16 xl:text-7xl animate-float">
                    {heroContent.title}
                  </h1>
                  <p className="mx-auto mt-8 max-w-2xl text-balance text-lg text-muted-foreground">
                    {heroContent.subtitle}
                  </p>
                </AnimatedGroup>

                {/* CTAs */}
                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-3 md:flex-row"
                >
                  {isLoading ? (
                    // Loading state
                    <div className="flex gap-3">
                      <div className="h-12 w-40 animate-pulse rounded-xl bg-muted" />
                      <div className="h-12 w-32 animate-pulse rounded-xl bg-muted" />
                    </div>
                  ) : isLoggedIn ? (
                    // Authenticated user - show dashboard CTA
                    <>
                      <div className="bg-synkro-green/10 rounded-[14px] border border-synkro-green/20 p-0.5">
                        <Button
                          asChild
                          size="lg"
                          className="rounded-xl px-6 text-base bg-synkro-green hover:bg-synkro-green/90 text-synkro-black font-medium"
                        >
                          <Link href="/dashboard">
                            <LayoutDashboard className="mr-2 h-5 w-5" />
                            <span>Go to Dashboard</span>
                          </Link>
                        </Button>
                      </div>
                      <Button
                        size="lg"
                        variant="ghost"
                        className="h-10.5 rounded-xl px-5 hover:bg-synkro-green/10 hover:text-synkro-green"
                        onClick={() => scrollToSection("#features")}
                      >
                        <span>Explore Features</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    // Not authenticated - show get started CTAs
                    <>
                      <div className="bg-synkro-green/10 rounded-[14px] border border-synkro-green/20 p-0.5">
                        <Button
                          asChild
                          size="lg"
                          className="rounded-xl px-6 text-base bg-synkro-green hover:bg-synkro-green/90 text-synkro-black font-medium"
                        >
                          <Link href="/register">
                            <span>Get Started Free</span>
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </Link>
                        </Button>
                      </div>
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-10.5 rounded-xl px-5 border-border hover:bg-synkro-green/10 hover:text-synkro-green hover:border-synkro-green/40"
                        onClick={() => scrollToSection("#pricing")}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        <span>View Pricing</span>
                      </Button>
                    </>
                  )}
                </AnimatedGroup>

                {/* Trust indicators */}
                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 1,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-synkro-green animate-pulse" />
                    <span>No credit card required</span>
                  </div>
                  <div className="hidden sm:block h-4 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-synkro-green animate-pulse" />
                    <span>Free forever plan</span>
                  </div>
                  <div className="hidden sm:block h-4 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-synkro-green animate-pulse" />
                    <span>Setup in minutes</span>
                  </div>
                </AnimatedGroup>
              </div>
            </div>

            {/* Screenshot */}
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                <div
                  aria-hidden
                  className="bg-linear-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
                />
                <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-synkro-green/20 p-4 shadow-lg shadow-zinc-950/15 ring-1">
                  <Image
                    className="bg-background aspect-15/8 relative hidden rounded-2xl dark:block"
                    src="/screenshot.webp"
                    alt="Synkro Dashboard"
                    width={2700}
                    height={1440}
                    priority
                  />
                  <Image
                    className="z-2 border-border/25 aspect-15/8 relative rounded-2xl border dark:hidden"
                    src="/screenshot.webp"
                    alt="Synkro Dashboard"
                    width={2700}
                    height={1440}
                    priority
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
      </main>
    </>
  );
}
