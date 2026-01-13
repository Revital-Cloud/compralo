"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Check, 
  Building2, 
  Mail, 
  User, 
  Phone,
  Sparkles,
  Rocket,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

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

export function GetStartedSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    interest: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.firstName || !formData.email || !formData.company) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call - in the future, this will connect to the backend
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("Request submitted successfully! We'll be in touch soon.");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <section id="get-started" className="py-24 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-synkro-green/10">
              <Check className="h-10 w-10 text-synkro-green" />
            </div>
            <h2 className="text-3xl font-bold md:text-4xl">
              Thank You for Your Interest!
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We've received your request and will get back to you within 24 hours.
              In the meantime, feel free to explore our features.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                onClick={() => {
                  document
                    .querySelector("#features")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                variant="outline"
              >
                Explore Features
              </Button>
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    company: "",
                    phone: "",
                    interest: "",
                    message: "",
                  });
                }}
                className="bg-synkro-green hover:bg-synkro-green/90 text-synkro-black"
              >
                Submit Another Request
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="get-started" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-synkro-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-synkro-green/5 rounded-full blur-3xl" />
      </div>

      <div className="container">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-synkro-green/10 px-4 py-1.5 text-sm text-synkro-green mb-4">
              <Sparkles className="h-4 w-4" />
              <span>Start Your E-commerce Journey</span>
            </div>
            <h2 className="text-4xl font-bold md:text-5xl">
              Get Started with <span className="text-synkro-green">Synkro</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Request access to our platform and we'll help you set up your online store.
              Already have an account?{" "}
              <Link href="/login" className="text-synkro-green hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-5">
            {/* Benefits - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-semibold">Why Choose Synkro?</h3>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-4 rounded-xl bg-background border border-border/50 hover:border-synkro-green/30 transition-colors"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-synkro-green/10">
                      <benefit.icon className="h-6 w-6 text-synkro-green" />
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
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-synkro-green" />
                    <span>Free setup</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-synkro-green" />
                    <span>No hidden fees</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-synkro-green" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form - Right Side */}
            <div className="lg:col-span-3">
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-border/50 bg-background p-6 md:p-8 shadow-lg"
              >
                <h3 className="text-xl font-semibold mb-6">Request Access</h3>

                <div className="space-y-5">
                  {/* Name row */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          placeholder="John"
                          className="pl-10"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Work Email <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@company.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Company and Phone row */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-sm font-medium">
                        Company <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="company"
                          placeholder="Your Company"
                          className="pl-10"
                          value={formData.company}
                          onChange={(e) => handleInputChange("company", e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+57 300 123 4567"
                          className="pl-10"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Interest */}
                  <div className="space-y-2">
                    <Label htmlFor="interest" className="text-sm font-medium">
                      What are you interested in?
                    </Label>
                    <Select
                      value={formData.interest}
                      onValueChange={(value) => handleInputChange("interest", value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new-store">Create a new online store</SelectItem>
                        <SelectItem value="migrate">Migrate my existing store</SelectItem>
                        <SelectItem value="enterprise">Enterprise solution</SelectItem>
                        <SelectItem value="demo">Request a demo</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">
                      Tell us about your project
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="What products do you sell? How many SKUs? Any specific requirements?"
                      className="min-h-[100px] resize-none"
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full bg-synkro-green hover:bg-synkro-green/90 text-synkro-black font-medium h-12"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Request Access
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By submitting, you agree to our{" "}
                    <Link href="/terms" className="text-synkro-green hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-synkro-green hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
