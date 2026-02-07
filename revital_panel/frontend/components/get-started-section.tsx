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

const benefits = [
  {
    icon: Rocket,
    title: "Launch in Minutes",
    description: "Get your store up and running with our guided setup",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "PCI DSS compliant with SSL encryption",
  },
  {
    icon: Zap,
    title: "Instant Payments",
    description: "Native integration with Wompi and more",
  },
];

const features = [
  "Free setup assistance",
  "No credit card required",
  "14-day free trial",
  "Cancel anytime",
];

export function GetStartedSection() {
  const { user, isLoading } = useAuth();
  const isLoggedIn = isAuthenticated() && !!user;

  return (
    <section id="get-started" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-revital-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-revital-green/5 rounded-full blur-3xl" />
      </div>

      <div className="container">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-revital-green/10 px-4 py-1.5 text-sm text-revital-green mb-4">
              <Sparkles className="h-4 w-4" />
              <span>Start Your E-commerce Journey</span>
            </div>
            <h2 className="text-4xl font-bold md:text-5xl">
              Get Started with <span className="text-revital-green">Revital</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Create your free account and start building your online store today.
              No credit card required.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Benefits - Left Side */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Why Choose Revital?</h3>
              
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
                  Trusted by businesses across Colombia
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
                    Welcome back, {user?.nombre?.split(' ')[0]}!
                  </h3>
                  <p className="text-muted-foreground mb-8">
                    Continue managing your e-commerce from your dashboard.
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-revital-green hover:bg-revital-green/90 text-revital-black font-medium h-12"
                  >
                    <Link href="/dashboard">
                      Go to Dashboard
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
                    Create Your Free Account
                  </h3>
                  <p className="text-muted-foreground mb-8">
                    Join thousands of businesses using Revital to power their online stores.
                  </p>
                  
                  <div className="space-y-4">
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-revital-green hover:bg-revital-green/90 text-revital-black font-medium h-12"
                    >
                      <Link href="/register">
                        <UserPlus className="mr-2 h-5 w-5" />
                        Sign Up Free
                      </Link>
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          or
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
                        Sign In to Existing Account
                      </Link>
                    </Button>
                  </div>

                  <p className="mt-6 text-xs text-muted-foreground">
                    By signing up, you agree to our{" "}
                    <Link href="/terms" className="text-revital-green hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-revital-green hover:underline">
                      Privacy Policy
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
