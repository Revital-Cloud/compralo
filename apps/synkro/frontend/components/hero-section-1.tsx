"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { Header } from "./header";
import { heroContent } from "@/content";
import { appConfig } from "@/content/config";

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
            {/* Fondo limpio sin interferencias */}
            <div className="absolute inset-0 -z-20" />
            <div
              aria-hidden
              className="absolute inset-0 -z-10 size-full dark:bg-synkro-black/60 [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]"
            />
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  <Link
                    href="#link"
                    className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950 border-synkro-green/20 hover:border-synkro-green/40"
                  >
                    <span className="text-foreground text-sm">
                      Presentamos Synkro: Tu Plataforma E-commerce Integral
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
                  </Link>

                  <h1 className="mt-8 max-w-4xl mx-auto text-balance text-5xl md:text-6xl lg:mt-16 xl:text-7xl animate-float">
                    {heroContent.title}
                  </h1>
                  <p className="mx-auto mt-8 max-w-2xl text-balance text-lg text-muted-foreground">
                    {heroContent.subtitle}
                  </p>
                </AnimatedGroup>

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
                  className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                >
                  <div
                    key={1}
                    className="bg-synkro-green/10 rounded-[14px] border border-synkro-green/20 p-0.5"
                  >
                    <Button
                      size="lg"
                      className="rounded-xl px-5 text-base bg-synkro-green hover:bg-synkro-green/90 text-synkro-black"
                      onClick={() => {
                        // Redirigir a la plataforma de registro
                        window.open(appConfig.registerUrl, "_blank");
                      }}
                    >
                      <span className="text-nowrap">
                        {heroContent.primaryButton}
                      </span>
                    </Button>
                  </div>
                  <Button
                    key={2}
                    size="lg"
                    variant="ghost"
                    className="h-10.5 rounded-xl px-5 hover:bg-synkro-green/10 hover:text-synkro-green"
                    onClick={() => {
                      // Scroll al formulario de contacto
                      document
                        .querySelector("#contact")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <span className="text-nowrap">
                      {heroContent.secondaryButton}
                    </span>
                  </Button>
                </AnimatedGroup>
              </div>
            </div>

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
                    alt="app screen"
                    width={2700}
                    height={1440}
                    priority
                  />
                  <Image
                    className="z-2 border-border/25 aspect-15/8 relative rounded-2xl border dark:hidden"
                    src="/screenshot.webp"
                    alt="app screen"
                    width={2700}
                    height={1440}
                    priority
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
        {/* Sección de logos de empresas comentada */}
        {/*
        <section className="bg-background pb-16 pt-16 md:pb-32">
          <div className="group relative m-auto max-w-5xl px-6">
            <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
              <Link
                href="/"
                className="block text-sm duration-150 hover:opacity-75 text-synkro-green"
              >
                <span> Meet Our Customers</span>

                <ChevronRight className="ml-1 inline-block size-3" />
              </Link>
            </div>
            <div className="group-hover:blur-xs mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-x-12 gap-y-8 transition-all duration-500 group-hover:opacity-50 sm:gap-x-16 sm:gap-y-14">
              <div className="flex">
                <Image
                  className="mx-auto h-5 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/nvidia.svg"
                  alt="Nvidia Logo"
                  height={20}
                  width={100}
                />
              </div>

              <div className="flex">
                <Image
                  className="mx-auto h-4 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/column.svg"
                  alt="Column Logo"
                  height={16}
                  width={80}
                />
              </div>
              <div className="flex">
                <Image
                  className="mx-auto h-4 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/github.svg"
                  alt="GitHub Logo"
                  height={16}
                  width={80}
                />
              </div>
              <div className="flex">
                <Image
                  className="mx-auto h-5 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/nike.svg"
                  alt="Nike Logo"
                  height={20}
                  width={100}
                />
              </div>
              <div className="flex">
                <Image
                  className="mx-auto h-5 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
                  alt="Lemon Squeezy Logo"
                  height={20}
                  width={100}
                />
              </div>
              <div className="flex">
                <Image
                  className="mx-auto h-4 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/laravel.svg"
                  alt="Laravel Logo"
                  height={16}
                  width={80}
                />
              </div>
              <div className="flex">
                <Image
                  className="mx-auto h-7 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/lilly.svg"
                  alt="Lilly Logo"
                  height={28}
                  width={140}
                />
              </div>

              <div className="flex">
                <Image
                  className="mx-auto h-6 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/openai.svg"
                  alt="OpenAI Logo"
                  height={24}
                  width={120}
                />
              </div>
            </div>
          </div>
        </section>
        */}
      </main>
    </>
  );
}
