"use client";

import { Check, Star, Zap, Building, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const pricingPlans = [
  {
    id: "emprendedor",
    name: "Emprendedor",
    description:
      "Ideal para quienes inician su aventura en el e-commerce y necesitan lo esencial para vender.",
    price: "$29",
    period: "/mes",
    icon: ShoppingBag,
    features: [
      "Hasta 100 productos",
      "Panel de estadísticas básico",
      "Integración con Wompi",
      "1 usuario administrador",
      "Soporte por email",
      "SSL incluido",
    ],
    limitations: ["Sin CMS headless", "Sin webhooks"],
    cta: "Comenzar Ahora",
    variant: "outline" as const,
    popular: false,
  },
  {
    id: "profesional",
    name: "Profesional",
    description:
      "Perfecto para negocios en crecimiento que buscan más herramientas y personalización.",
    price: "$79",
    period: "/mes",
    icon: Zap,
    features: [
      "Productos ilimitados",
      "Panel de estadísticas avanzado",
      "CMS headless incluido",
      "Todas las pasarelas + Webhooks",
      "Hasta 5 usuarios administradores",
      "Soporte prioritario",
      "API completa",
      "Backups automáticos",
    ],
    limitations: [],
    cta: "Elegir Plan",
    variant: "synkro" as const,
    popular: true,
  },
  {
    id: "corporativo",
    name: "Corporativo",
    description:
      "Soluciones a medida para grandes empresas con volumen alto de ventas y requerimientos específicos.",
    price: "Custom",
    period: "",
    icon: Building,
    features: [
      "Todo del plan Profesional",
      "Usuarios ilimitados",
      "Integraciones personalizadas",
      "SLA garantizado",
      "Soporte prioritario",
      "Consultoría especializada",
      "Infraestructura dedicada",
      "Migración asistida",
    ],
    limitations: [],
    cta: "Contactar Ventas",
    variant: "outline" as const,
    popular: false,
  },
];

export function PricingCards() {
  return (
    <section
      id="pricing"
      className="py-20 lg:py-32 bg-white dark:bg-synkro-black"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="synkro" className="mb-4">
            Precios Synkro
          </Badge>
          <h2 className="text-3xl md:text-5xl font-regular tracking-tighter mb-4 text-gray-900 dark:text-white">
            Planes Flexibles para Tu Crecimiento
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Elige el plan de Synkro que mejor se adapte al tamaño y las
            necesidades de tu negocio online.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {pricingPlans.map(plan => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative transition-all duration-300 hover:shadow-xl",
                  plan.popular
                    ? "border-2 border-synkro-green shadow-lg shadow-synkro-green/20 scale-105"
                    : "border border-gray-200 dark:border-synkro-green/20 hover:border-synkro-green/40",
                  "bg-white dark:bg-synkro-black"
                )}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-synkro-green text-synkro-black px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Más Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-synkro-green/10 dark:bg-synkro-green/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-synkro-green" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    {plan.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="pt-0">
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
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
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
                  <Button
                    variant={plan.variant}
                    className={cn(
                      "w-full",
                      plan.variant === "synkro" &&
                        "bg-synkro-green hover:bg-synkro-green/90 text-synkro-black",
                      plan.variant === "outline-solid" &&
                        "border-synkro-green text-synkro-green hover:bg-synkro-green hover:text-synkro-black"
                    )}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            ¿No estás seguro de qué plan elegir?
          </p>
          <Button
            variant="outline"
            className="border-synkro-green text-synkro-green hover:bg-synkro-green hover:text-synkro-black"
          >
            Comparar Planes Detalladamente
          </Button>
        </div>
      </div>
    </section>
  );
}
