"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Check, 
  Sparkles,
  Rocket,
  Shield,
  Zap,
  UserPlus,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { isAuthenticated } from "@/utils/apiWrapper";

const benefits = [
  {
    icon: Rocket,
    title: "Lanza en minutos",
    description: "Pon tu tienda en marcha con nuestro setup guiado",
  },
  {
    icon: Shield,
    title: "Seguridad empresarial",
    description: "Cumplimiento PCI DSS con encriptación SSL",
  },
  {
    icon: Zap,
    title: "Pagos instantáneos",
    description: "Integración nativa con Wompi y más",
  },
];

const features = [
  "Asistencia gratis en la configuración",
  "No se requiere tarjeta",
  "Prueba gratis de 14 días",
  "Cancela cuando quieras",
];

/** Skeleton for CTA card to avoid hydration mismatch (server has no auth, client may show different state). */
function CTACardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-16 w-16 mx-auto animate-pulse rounded-full bg-muted" />
      <div className="h-8 w-48 mx-auto animate-pulse rounded bg-muted" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

export function GetStartedSection() {
  const { user, isLoading } = useAuth();
  const isLoggedIn = isAuthenticated() && !!user;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Same output on server and first client render to avoid hydration mismatch
  const showAuthContent = mounted && !isLoading;

  return (
    <section id="get-started" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-revital-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-revital-green/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-revital-green/10 px-4 py-1.5 text-sm text-revital-green mb-4">
              <Sparkles className="h-4 w-4" />
              <span>Empieza tu viaje e‑commerce</span>
            </div>
            <h2 className="text-4xl font-bold md:text-5xl">
<<<<<<< HEAD:synkro_panel/frontend/components/get-started-section.tsx
              Comienza con <span className="text-synkro-green">Synkro</span>
=======
              Get Started with <span className="text-revital-green">Revital</span>
>>>>>>> main:revital_panel/frontend/components/get-started-section.tsx
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Crea tu cuenta gratis y empieza a construir tu tienda hoy.
              No se requiere tarjeta.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Benefits - Left Side */}
            <div className="space-y-6">
<<<<<<< HEAD:synkro_panel/frontend/components/get-started-section.tsx
              <h3 className="text-xl font-semibold">¿Por qué elegir Synkro?</h3>
=======
              <h3 className="text-xl font-semibold">Why Choose Revital?</h3>
>>>>>>> main:revital_panel/frontend/components/get-started-section.tsx
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-4 rounded-xl bg-background border border-border/50 hover:border-revital-green/30 transition-colors"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-revital-green/10">
                      <benefit.icon className="h-6 w-6 text-revital-green" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{benefit.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust indicators */}
              <div className="pt-6 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  Con la confianza de negocios en Colombia
                </p>
                <div className="flex flex-wrap gap-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-revital-green" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA Card - Right Side */}
            <div className="rounded-2xl border border-border/50 bg-background p-8 md:p-10 shadow-lg text-center">
              {!showAuthContent ? (
                <CTACardSkeleton />
              ) : isLoggedIn ? (
                <>
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-revital-green/10">
                    <Check className="h-8 w-8 text-revital-green" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    ¡Bienvenido de nuevo, {user?.nombre?.split(' ')[0]}!
                  </h3>
                  <p className="text-muted-foreground mb-8">
                    Sigue gestionando tu e‑commerce desde tu dashboard.
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-revital-green hover:bg-revital-green/90 text-revital-black font-medium h-12"
                  >
                    <Link href="/dashboard">
                      Ir al Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-revital-green/10">
                    <UserPlus className="h-8 w-8 text-revital-green" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    Crea tu cuenta gratis
                  </h3>
                  <p className="text-muted-foreground mb-8">
<<<<<<< HEAD:synkro_panel/frontend/components/get-started-section.tsx
                    Únete a miles de negocios usando Synkro para impulsar sus tiendas online.
=======
                    Join thousands of businesses using Revital to power their online stores.
>>>>>>> main:revital_panel/frontend/components/get-started-section.tsx
                  </p>
                  
                  <div className="space-y-4">
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-revital-green hover:bg-revital-green/90 text-revital-black font-medium h-12"
                    >
                      <Link href="/register">
                        <UserPlus className="mr-2 h-5 w-5" />
                        Crear cuenta
                      </Link>
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          o
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="w-full h-12"
                    >
                      <Link href="/login">
                        <LogIn className="mr-2 h-5 w-5" />
                        Iniciar sesión
                      </Link>
                    </Button>
                  </div>

                  <p className="mt-6 text-xs text-muted-foreground">
<<<<<<< HEAD:synkro_panel/frontend/components/get-started-section.tsx
                    Al registrarte, aceptas nuestros{" "}
                    <Link href="/terms" className="text-synkro-green hover:underline">
                      Términos de Servicio
                    </Link>{" "}
                    y{" "}
                    <Link href="/privacy" className="text-synkro-green hover:underline">
                      Política de Privacidad
=======
                    By signing up, you agree to our{" "}
                    <Link href="/terms" className="text-revital-green hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-revital-green hover:underline">
                      Privacy Policy
>>>>>>> main:revital_panel/frontend/components/get-started-section.tsx
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
