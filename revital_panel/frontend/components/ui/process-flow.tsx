"use client";

import type React from "react";
import { useState } from "react";
import {
  Clock,
  Rocket,
  Code,
  Palette,
  ClipboardList,
  SearchCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ProcessStep {
  id: number;
  title: string;
  phase: string;
  description: string;
  icon: React.ElementType;
  status: "completed" | "in-progress" | "pending";
  duration: string;
  features: string[];
  color: string;
  gradient: string;
}

const ICONS = [ClipboardList, Palette, Code, SearchCheck, Rocket] as const;
const COLORS = ["blue", "purple", "green", "orange", "pink"] as const;
const GRADIENTS = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-green-500 to-green-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
] as const;

interface ProcessFlowProps {
  steps?: ProcessStep[];
}

export default function ProcessFlow({ steps: stepsProp }: ProcessFlowProps) {
  const t = useTranslations("processFlow");
  const stepsData = t.raw("steps") as Array<{
    phase: string;
    title: string;
    description: string;
    duration: string;
    features: string[];
  }>;
  const defaultSteps: ProcessStep[] = (stepsData ?? []).map((step, i) => ({
    id: i + 1,
    title: step.title,
    phase: step.phase,
    description: step.description,
    icon: ICONS[i] ?? Rocket,
    status: "pending" as const,
    duration: step.duration,
    features: step.features ?? [],
    color: COLORS[i] ?? "blue",
    gradient: GRADIENTS[i] ?? "from-blue-500 to-blue-600",
  }));
  const steps = stepsProp ?? defaultSteps;
  const [currentStep, setCurrentStep] = useState(0);

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex === currentStep) return "in-progress";
    return "pending";
  };

  const getStepColor = (step: ProcessStep, status: string) => {
    if (status === "in-progress")
      return `text-${step.color}-600 dark:text-${step.color}-400`;
    return "text-gray-500 dark:text-gray-400";
  };

  const getStepBgColor = (step: ProcessStep, status: string) => {
    if (status === "in-progress")
      return `bg-${step.color}-100 dark:bg-${step.color}-900/20`;
    return "bg-gray-100 dark:bg-gray-800";
  };

  return (
    <section className="py-16 lg:py-24 bg-white dark:bg-revital-black">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <Badge variant="revital" className="mb-4">
            {t("badge")}
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-regular tracking-tighter mb-4 text-gray-900 dark:text-white">
            {t("title")}
          </h2>
          <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Timeline principal: área solo de las 5 cards, sin solapamiento */}
        <div className="relative min-h-[380px] lg:min-h-[320px] pb-8">
          {/* Línea de progreso - Posicionada arriba de las cards */}
          <div className="absolute -top-8 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full hidden lg:block">
            <div
              className="h-full bg-linear-to-r from-revital-green to-revital-green/80 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>

          {/* Pasos del proceso */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-4">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const isActive = index === currentStep;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className="relative group cursor-pointer"
                  onClick={() => handleStepClick(index)}
                >
                  {/* Conector móvil */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 transform translate-x-1/2 lg:hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-1000",
                          index < currentStep
                            ? "bg-linear-to-r from-revital-green to-revital-green/80"
                            : "bg-transparent"
                        )}
                        style={{
                          width: index < currentStep ? "100%" : "0%",
                        }}
                      />
                    </div>
                  )}

                  {/* Card del paso */}
                  <Card
                    className={cn(
                      "relative h-full flex flex-col transition-all duration-500 transform hover:scale-105",
                      isActive
                        ? "scale-105 shadow-xl shadow-revital-green/20"
                        : "hover:shadow-lg",
                      getStepBgColor(step, status)
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          className={cn(
                            "text-xs px-2 py-1",
                            status === "in-progress"
                              ? `bg-${step.color}-100 text-${step.color}-800 dark:bg-${step.color}-900/30 dark:text-${step.color}-400`
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          )}
                        >
                          {step.phase}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock size={12} />
                          {step.duration}
                        </div>
                      </div>

                      {/* Icono con animación */}
                      <div className="flex items-center justify-center mb-4">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500",
                            status === "in-progress"
                              ? `bg-${step.color}-100 dark:bg-${step.color}-900/30 text-${step.color}-600 dark:text-${step.color}-400 animate-pulse`
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          )}
                        >
                          <Icon size={20} />
                        </div>
                      </div>

                      <CardTitle
                        className={cn(
                          "text-sm font-semibold text-center",
                          getStepColor(step, status)
                        )}
                      >
                        {step.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="pt-0 flex-1 flex flex-col">
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-4 leading-relaxed">
                        {step.description}
                      </p>

                      {/* Features del paso */}
                      <div className="space-y-1 mt-auto">
                        {step.features.map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                          >
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                status === "in-progress"
                                  ? `bg-${step.color}-500`
                                  : "bg-gray-400"
                              )}
                            />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </CardContent>

                    {/* Indicador de progreso */}
                    {isActive && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        <div className="w-3 h-3 bg-revital-green rounded-full animate-pulse shadow-lg shadow-revital-green/50" />
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Información del paso actual: separado para no tapar las cards de fases */}
        <div className="mt-24 lg:mt-32">
          <Card className="bg-linear-to-r from-revital-green/5 to-revital-green/10 dark:from-revital-green/10 dark:to-revital-green/5 border-revital-green/20">
            <CardContent className="p-6 lg:p-8">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-full bg-linear-to-r ${steps[currentStep].gradient} flex items-center justify-center text-white`}
                >
                  {(() => {
                    const CurrentIcon = steps[currentStep].icon;
                    return <CurrentIcon size={24} />;
                  })()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {steps[currentStep].title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {steps[currentStep].phase} • {steps[currentStep].duration}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                {steps[currentStep].description}
              </p>

              <div className="flex flex-wrap gap-2">
                {steps[currentStep].features.map((feature, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs border-revital-green/30 text-revital-green dark:text-revital-green"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
