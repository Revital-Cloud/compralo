"use client";

import Link from "next/link";
import { Check, Star, Zap, Building, ShoppingBag, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { isAuthenticated } from "@/utils/apiWrapper";

const pricingPlans = [
  {
    id: "emprendedor",
    name: "Emprendedor",
    description:
      "Perfecto para empezar tu viaje e-commerce con funciones esenciales.",
    price: "$29",
    period: "/month",
    annualPrice: "$290",
    annualSavings: "Ahorra $58",
    icon: ShoppingBag,
    features: [
      "Hasta 100 productos",
      "Panel de analíticas básico",
      "Integración con Wompi",
      "1 usuario administrador",
      "Soporte por email",
      "SSL incluido",
    ],
    limitations: ["Sin CMS headless", "Sin webhooks"],
    cta: "Comenzar",
    ctaLink: "/register",
    variant: "outline" as const,
    popular: false,
  },
  {
    id: "profesional",
    name: "Profesional",
    description:
      "Ideal para negocios en crecimiento que necesitan más herramientas y personalización.",
    price: "$79",
    period: "/month",
    annualPrice: "$790",
    annualSavings: "Ahorra $158",
    icon: Zap,
    features: [
      "Productos ilimitados",
      "Analíticas avanzadas + reportes",
      "CMS headless incluido",
      "Pasarelas de pago + Webhooks",
      "Hasta 5 admins",
      "Soporte prioritario",
      "Acceso completo a la API",
      "Backups automáticos",
    ],
    limitations: [],
    cta: "Iniciar prueba",
    ctaLink: "/register",
    variant: "synkro" as const,
    popular: true,
  },
  {
    id: "corporativo",
    name: "Empresarial",
    description:
      "Soluciones a medida para empresas con alto volumen y necesidades específicas.",
    price: "Custom",
    period: "",
    annualPrice: "",
    annualSavings: "",
    icon: Building,
    features: [
      "Todo lo de Profesional",
      "Usuarios ilimitados",
      "Integraciones personalizadas",
      "SLA garantizado",
      "Soporte dedicado",
      "Consultoría especializada",
      "Infraestructura dedicada",
      "Migración asistida",
    ],
    limitations: [],
    cta: "Contactar ventas",
    ctaLink: "#contact",
    variant: "outline" as const,
    popular: false,
  },
];

export function PricingCards() {
  const { user, isLoading } = useAuth();
  const isLoggedIn = isAuthenticated() && !!user;

  const handleCTAClick = (plan: typeof pricingPlans[0]) => {
    // If logged in, go to subscription page
    if (isLoggedIn) {
      window.location.href = "/subscription";
      return;
    }
    
    // For hash links, scroll to section
    if (plan.ctaLink.startsWith("#")) {
      const element = document.querySelector(plan.ctaLink);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // For regular routes, navigate
      window.location.href = plan.ctaLink;
    }
  };

  return (
    <section
      id="pricing"
      className="py-20 lg:py-32 bg-white dark:bg-synkro-black"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="synkro" className="mb-4">
            Planes y precios
          </Badge>
          <h2 className="text-3xl md:text-5xl font-regular tracking-tighter mb-4 text-gray-900 dark:text-white">
            Planes flexibles para tu crecimiento
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Elige el plan Synkro que mejor se adapte a tu negocio. Empieza y escala cuando lo necesites.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {pricingPlans.map(plan => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative h-full transition-all duration-300 hover:shadow-xl group",
                  plan.popular
                    ? "border-2 border-synkro-green shadow-lg shadow-synkro-green/20 ring-2 ring-synkro-green/15"
                    : "border border-gray-200 dark:border-synkro-green/20 hover:border-synkro-green/40",
                  "bg-white dark:bg-synkro-black"
                )}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-synkro-green text-synkro-black px-4 py-1 font-medium">
                      <Star className="w-3 h-3 mr-1" />
                      Más popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-synkro-green/10 dark:bg-synkro-green/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-synkro-green" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    {plan.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 min-h-10">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="pt-0 flex flex-1 flex-col">
                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-gray-600 dark:text-gray-400 ml-1">
                          {plan.period}
                        </span>
                      )}
                    </div>
                    {plan.annualSavings && (
                      <p className="text-sm text-synkro-green mt-1 font-medium">
                        {plan.annualSavings} con pago anual
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-start gap-3"
                      >
                        <Check className="w-5 h-5 text-synkro-green shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, limitIndex) => (
                      <div key={limitIndex} className="flex items-start gap-3">
                        <div className="w-5 h-5 shrink-0 mt-0.5 flex items-center justify-center">
                          <div className="w-2 h-0.5 bg-gray-400" />
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-500">
                          {limitation}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div className="mt-auto">
                    <Button
                      onClick={() => handleCTAClick(plan)}
                      variant={plan.variant}
                      className={cn(
                        "w-full group/btn",
                        plan.variant === "synkro" &&
                          "bg-synkro-green hover:bg-synkro-green/90 text-synkro-black",
                        plan.variant === "outline" &&
                          "border-synkro-green/50 text-synkro-green hover:bg-synkro-green hover:text-synkro-black"
                      )}
                    >
                      <span>{isLoggedIn ? "Gestionar plan" : plan.cta}</span>
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Todos los planes incluyen 14 días de prueba. No se requiere tarjeta.
          </p>
          {isLoggedIn ? (
            <Button asChild variant="outline" className="border-synkro-green text-synkro-green hover:bg-synkro-green hover:text-synkro-black">
              <Link href="/subscription">
                Ver comparación completa
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="border-synkro-green text-synkro-green hover:bg-synkro-green hover:text-synkro-black">
              <Link href="/register">
                Crear cuenta ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
