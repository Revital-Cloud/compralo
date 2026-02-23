"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Star, Zap, Building, ShoppingBag, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { isAuthenticated } from "@/utils/apiWrapper";
import { useTranslations } from "next-intl";

const PLAN_IDS = ["starter", "professional", "enterprise"] as const;
const PLAN_ICONS = [ShoppingBag, Zap, Building] as const;
const PLAN_LINKS = ["/register", "/register", "#contact"] as const;

export function PricingCards() {
  const t = useTranslations("pricing");
  const { user, isLoading } = useAuth();
  const isLoggedIn = isAuthenticated() && !!user;
  const [billingPeriod, setBillingPeriod] = useState<"mensual" | "anual">("mensual");

  const pricingPlans = PLAN_IDS.map((id, index) => {
    const planKey = `plans.${id}`;
    const features = t.raw(`${planKey}.features`) as string[];
    const isAnnual = billingPeriod === "anual";
    const price = isAnnual ? t(`${planKey}.priceAnnual`) : t(`${planKey}.price`);
    const period = isAnnual ? t("perYear") : t("perMonth");
    return {
      id,
      name: t(`${planKey}.name`),
      description: t(`${planKey}.description`),
      price,
      period: id === "enterprise" ? "" : period,
      showSave20: isAnnual && id !== "enterprise",
      icon: PLAN_ICONS[index],
      features: features ?? [],
      cta: t(`${planKey}.cta`),
      ctaLink: PLAN_LINKS[index],
      variant: index === 1 ? "revital" : "outline",
      popular: index === 1,
    };
  });

  const handleCTAClick = (plan: (typeof pricingPlans)[0]) => {
    if (isLoggedIn) {
      window.location.href = "/subscription";
      return;
    }
    if (plan.ctaLink.startsWith("#")) {
      const element = document.querySelector(plan.ctaLink);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = plan.ctaLink;
    }
  };

  return (
    <section
      id="pricing"
      className="py-20 lg:py-32 bg-white dark:bg-revital-black"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-10">
          <Badge variant="revital" className="mb-4">
            {t("badge")}
          </Badge>
          <h2 className="text-3xl md:text-5xl font-regular tracking-tighter mb-4 text-gray-900 dark:text-white">
            {t("flexibleTitle")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
            {t("flexibleSubtitle")}
          </p>
          <Tabs
            value={billingPeriod}
            onValueChange={(v) => setBillingPeriod(v as "mensual" | "anual")}
            className="inline-flex"
          >
            <TabsList className="grid w-full grid-cols-2 sm:w-auto">
              <TabsTrigger value="mensual">{t("billingMonthly")}</TabsTrigger>
              <TabsTrigger value="anual">{t("billingAnnual")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {pricingPlans.map((plan) => {
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
                      {t("mostPopular")}
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
                    <div className="flex flex-wrap items-baseline justify-center gap-x-1">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-gray-600 dark:text-gray-400">
                          {plan.period}
                        </span>
                      )}
                    </div>
                    {plan.showSave20 && (
                      <p className="text-sm text-revital-green mt-1">
                        {t("save20")}
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
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleCTAClick(plan)}
                    variant={plan.variant as "revital" | "outline"}
                    className={cn(
                      "w-full group/btn",
                      plan.variant === "revital" &&
                        "bg-revital-green hover:bg-revital-green/90 text-revital-black",
                      plan.variant === "outline" &&
                        "border-revital-green/50 text-revital-green hover:bg-revital-green hover:text-revital-black"
                    )}
                  >
                    <span>{isLoggedIn ? t("managePlan") : plan.cta}</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("allPlansTrial")}
          </p>
          {isLoggedIn ? (
            <Button asChild variant="outline" className="border-revital-green text-revital-green hover:bg-revital-green hover:text-revital-black">
              <Link href="/subscription">
                {t("viewComparison")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="border-revital-green text-revital-green hover:bg-revital-green hover:text-revital-black">
              <Link href="/register">
                {t("signUpNow")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
