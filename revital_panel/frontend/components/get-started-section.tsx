"use client";

import React from "react";
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
import { useTranslations } from "next-intl";

const BENEFITS = [
  { icon: Rocket, titleKey: "benefit1Title", descKey: "benefit1Description" },
  { icon: Shield, titleKey: "benefit2Title", descKey: "benefit2Description" },
  { icon: Zap, titleKey: "benefit3Title", descKey: "benefit3Description" },
] as const;
const FEATURE_KEYS = ["feature1", "feature2", "feature3", "feature4"] as const;

export function GetStartedSection() {
  const t = useTranslations("getStarted");
  const { user, isLoading } = useAuth();
  const isLoggedIn = isAuthenticated() && !!user;

  return (
    <section id="get-started" className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-revital-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-revital-green/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-revital-green/10 px-4 py-1.5 text-sm text-revital-green mb-4">
              <Sparkles className="h-4 w-4" />
              <span>{t("badge")}</span>
            </div>
            <h2 className="text-4xl font-bold md:text-5xl">
              {t("title").split(" Revital").map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i < arr.length - 1 ? (
                    <>
                      {" "}
                      <span className="text-revital-green">Revital</span>
                    </>
                  ) : null}
                </React.Fragment>
              ))}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">{t("whyChoose")}</h3>
              <div className="space-y-4">
                {BENEFITS.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-4 rounded-xl bg-background border border-border/50 hover:border-revital-green/30 transition-colors"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-revital-green/10">
                      <benefit.icon className="h-6 w-6 text-revital-green" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{t(benefit.titleKey)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t(benefit.descKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  {t("trustBy")}
                </p>
                <div className="flex flex-wrap gap-3">
                  {FEATURE_KEYS.map((key) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-revital-green" />
                      <span>{t(key)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-background p-8 md:p-10 shadow-lg text-center">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-16 w-16 mx-auto animate-pulse rounded-full bg-muted" />
                  <div className="h-8 w-48 mx-auto animate-pulse rounded bg-muted" />
                  <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
                </div>
              ) : isLoggedIn ? (
                <>
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-revital-green/10">
                    <Check className="h-8 w-8 text-revital-green" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    {t("welcomeBack", { name: user?.nombre?.split(" ")[0] ?? "" })}
                  </h3>
                  <p className="text-muted-foreground mb-8">
                    {t("continueManaging")}
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-revital-green hover:bg-revital-green/90 text-revital-black font-medium h-12"
                  >
                    <Link href="/dashboard">
                      {t("goToDashboard")}
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
                    {t("createAccount")}
                  </h3>
                  <p className="text-muted-foreground mb-8">
                    {t("joinThousands")}
                  </p>
                  <div className="space-y-4">
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-revital-green hover:bg-revital-green/90 text-revital-black font-medium h-12"
                    >
                      <Link href="/register">
                        <UserPlus className="mr-2 h-5 w-5" />
                        {t("signUpFree")}
                      </Link>
                    </Button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          {t("or")}
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
                        {t("signInExisting")}
                      </Link>
                    </Button>
                  </div>
                  <p className="mt-6 text-xs text-muted-foreground">
                    {t("termsAgree")}{" "}
                    <Link href="/terms" className="text-revital-green hover:underline">
                      {t("termsOfService")}
                    </Link>{" "}
                    {t("and")}{" "}
                    <Link href="/privacy" className="text-revital-green hover:underline">
                      {t("privacyPolicy")}
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
