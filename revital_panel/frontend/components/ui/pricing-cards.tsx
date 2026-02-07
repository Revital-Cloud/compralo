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
    name: "Starter",
    description:
      "Perfect for those starting their e-commerce journey with essential selling features.",
    price: "$29",
    period: "/month",
    annualPrice: "$290",
    annualSavings: "Save $58",
    icon: ShoppingBag,
    features: [
      "Up to 100 products",
      "Basic analytics dashboard",
      "Wompi integration",
      "1 admin user",
      "Email support",
      "SSL included",
    ],
    limitations: ["No headless CMS", "No webhooks"],
    cta: "Get Started",
    ctaLink: "/register",
    variant: "outline" as const,
    popular: false,
  },
  {
    id: "profesional",
    name: "Professional",
    description:
      "Ideal for growing businesses that need more tools and customization options.",
    price: "$79",
    period: "/month",
    annualPrice: "$790",
    annualSavings: "Save $158",
    icon: Zap,
    features: [
      "Unlimited products",
      "Advanced analytics + reports",
      "Headless CMS included",
      "All payment gateways + Webhooks",
      "Up to 5 admin users",
      "Priority support",
      "Full API access",
      "Automatic backups",
    ],
    limitations: [],
    cta: "Start Free Trial",
    ctaLink: "/register",
    variant: "revital" as const,
    popular: true,
  },
  {
    id: "corporativo",
    name: "Enterprise",
    description:
      "Custom solutions for large businesses with high volume and specific requirements.",
    price: "Custom",
    period: "",
    annualPrice: "",
    annualSavings: "",
    icon: Building,
    features: [
      "Everything in Professional",
      "Unlimited users",
      "Custom integrations",
      "Guaranteed SLA",
      "Dedicated support",
      "Specialized consulting",
      "Dedicated infrastructure",
      "Assisted migration",
    ],
    limitations: [],
    cta: "Contact Sales",
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
      className="py-20 lg:py-32 bg-white dark:bg-revital-black"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="revital" className="mb-4">
            Pricing Plans
          </Badge>
          <h2 className="text-3xl md:text-5xl font-regular tracking-tighter mb-4 text-gray-900 dark:text-white">
            Flexible Plans for Your Growth
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the Revital plan that best fits your business size and needs.
            Start free, upgrade as you grow.
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
                  "relative transition-all duration-300 hover:shadow-xl group",
                  plan.popular
                    ? "border-2 border-revital-green shadow-lg shadow-revital-green/20 lg:scale-105"
                    : "border border-gray-200 dark:border-revital-green/20 hover:border-revital-green/40",
                  "bg-white dark:bg-revital-black"
                )}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-revital-green text-revital-black px-4 py-1 font-medium">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-revital-green/10 dark:bg-revital-green/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-revital-green" />
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
                    {plan.annualSavings && (
                      <p className="text-sm text-revital-green mt-1 font-medium">
                        {plan.annualSavings} with annual billing
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-start gap-3"
                      >
                        <Check className="w-5 h-5 text-revital-green shrink-0 mt-0.5" />
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
                    onClick={() => handleCTAClick(plan)}
                    variant={plan.variant}
                    className={cn(
                      "w-full group/btn",
                      plan.variant === "revital" &&
                        "bg-revital-green hover:bg-revital-green/90 text-revital-black",
                      plan.variant === "outline" &&
                        "border-revital-green/50 text-revital-green hover:bg-revital-green hover:text-revital-black"
                    )}
                  >
                    <span>{isLoggedIn ? "Manage Plan" : plan.cta}</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All plans include a 14-day free trial. No credit card required.
          </p>
          {isLoggedIn ? (
            <Button asChild variant="outline" className="border-revital-green text-revital-green hover:bg-revital-green hover:text-revital-black">
              <Link href="/subscription">
                View Full Plan Comparison
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="border-revital-green text-revital-green hover:bg-revital-green hover:text-revital-black">
              <Link href="/register">
                Sign Up Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
