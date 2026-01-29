"use client";
import { useState, type ElementType } from "react";
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

type StepColor = "blue" | "purple" | "green" | "orange" | "pink";

const STEP_THEME: Record<
  StepColor,
  {
    activeText: string;
    activeBg: string;
    activeBadge: string;
    activeIconWrap: string;
    activeDot: string;
  }
> = {
  blue: {
    activeText: "text-blue-700 dark:text-blue-300",
    activeBg: "bg-blue-50 dark:bg-blue-950/30",
    activeBadge:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    activeIconWrap:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    activeDot: "bg-blue-500",
  },
  purple: {
    activeText: "text-purple-700 dark:text-purple-300",
    activeBg: "bg-purple-50 dark:bg-purple-950/30",
    activeBadge:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    activeIconWrap:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
    activeDot: "bg-purple-500",
  },
  green: {
    activeText: "text-green-700 dark:text-green-300",
    activeBg: "bg-green-50 dark:bg-green-950/30",
    activeBadge:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    activeIconWrap:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    activeDot: "bg-green-500",
  },
  orange: {
    activeText: "text-orange-700 dark:text-orange-300",
    activeBg: "bg-orange-50 dark:bg-orange-950/30",
    activeBadge:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    activeIconWrap:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    activeDot: "bg-orange-500",
  },
  pink: {
    activeText: "text-pink-700 dark:text-pink-300",
    activeBg: "bg-pink-50 dark:bg-pink-950/30",
    activeBadge:
      "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    activeIconWrap:
      "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300",
    activeDot: "bg-pink-500",
  },
};

interface ProcessStep {
  id: number;
  title: string;
  phase: string;
  description: string;
  icon: ElementType;
  status: "completed" | "in-progress" | "pending";
  duration: string;
  features: string[];
  color: StepColor;
  gradient: string;
}

const processSteps: ProcessStep[] = [
  {
    id: 1,
    title: "Planifica Tu Visión",
    phase: "Fase 1",
    description:
      "Define tus objetivos, público objetivo y estrategia de e-commerce. Te ayudamos a trazar el camino hacia el éxito.",
    icon: ClipboardList,
    status: "pending",
    duration: "1-2 días",
    features: [
      "Análisis de mercado",
      "Definición de objetivos",
      "Estrategia de marca",
    ],
    color: "blue",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    id: 2,
    title: "Diseña Tu Tienda",
    phase: "Fase 2",
    description:
      "Crea una experiencia de compra atractiva y personalizada. Elige plantillas, personaliza el diseño y refleja tu marca.",
    icon: Palette,
    status: "pending",
    duration: "2-3 días",
    features: ["Diseño personalizado", "Branding único", "UX optimizada"],
    color: "purple",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    id: 3,
    title: "Desarrolla Funcionalidades",
    phase: "Fase 3",
    description:
      "Integra pasarelas de pago, configura envíos, y añade las herramientas que necesitas para operar tu tienda eficientemente.",
    icon: Code,
    status: "pending",
    duration: "3-5 días",
    features: [
      "Integración de pagos",
      "Sistema de envíos",
      "APIs personalizadas",
    ],
    color: "green",
    gradient: "from-green-500 to-green-600",
  },
  {
    id: 4,
    title: "Optimiza y Prueba",
    phase: "Fase 4",
    description:
      "Aseguramos que todo funcione a la perfección. Pruebas de rendimiento, seguridad y usabilidad antes del gran lanzamiento.",
    icon: SearchCheck,
    status: "pending",
    duration: "1-2 días",
    features: ["Testing completo", "Optimización SEO", "Seguridad garantizada"],
    color: "orange",
    gradient: "from-orange-500 to-orange-600",
  },
  {
    id: 5,
    title: "Lanza y Crece",
    phase: "Fase 5",
    description:
      "¡Tu tienda está lista! Lanza al mercado y utiliza nuestras herramientas de marketing y análisis para crecer continuamente.",
    icon: Rocket,
    status: "pending",
    duration: "Continuo",
    features: ["Lanzamiento oficial", "Herramientas de marketing", "Analíticas avanzadas"],
    color: "pink",
    gradient: "from-pink-500 to-pink-600",
  },
];

interface ProcessFlowProps {
  steps?: ProcessStep[];
}

export default function ProcessFlow({
  steps = processSteps,
}: ProcessFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const getStepStatus = (stepIndex: number) =>
    stepIndex === currentStep ? "in-progress" : "pending";

  const getTheme = (step: ProcessStep, status: "in-progress" | "pending") => {
    const theme = STEP_THEME[step.color];
    if (status === "in-progress") return theme;
    return {
      activeText: "text-gray-600 dark:text-gray-300",
      activeBg: "bg-gray-100 dark:bg-gray-900/40",
      activeBadge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
      activeIconWrap: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300",
      activeDot: "bg-gray-400",
    };
  };

  return (
    <section className="py-16 lg:py-24 bg-white dark:bg-synkro-black">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <Badge variant="synkro" className="mb-4">
            Proceso de Implementación
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-regular tracking-tighter mb-4 text-gray-900 dark:text-white">
            Tu Camino al Éxito Digital
          </h2>
          <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Un proceso paso a paso diseñado para llevar tu negocio del concepto
            a la realidad digital.
          </p>
        </div>

        {/* Timeline principal */}
        <div className="relative">
          {/* Línea de progreso - Posicionada arriba de las cards */}
          <div className="absolute -top-8 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full hidden lg:block">
            <div
              className="h-full bg-linear-to-r from-synkro-green to-synkro-green/80 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>

          {/* Pasos del proceso */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-4 items-stretch">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const isActive = index === currentStep;
              const Icon = step.icon;
              const theme = getTheme(step, status);

              return (
                <button
                  key={step.id}
                  type="button"
                  className={cn(
                    "relative group text-left h-full",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-synkro-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
                  )}
                  onClick={() => handleStepClick(index)}
                  aria-current={isActive ? "step" : undefined}
                >
                  {/* Conector móvil (vertical, entre cards apiladas) */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-1/2 -bottom-6 h-6 w-0.5 -translate-x-1/2 bg-gray-200 dark:bg-gray-700 lg:hidden">
                      <div
                        className={cn(
                          "w-full transition-all duration-700",
                          index < currentStep
                            ? "bg-linear-to-b from-synkro-green to-synkro-green/80"
                            : "bg-transparent"
                        )}
                        style={{ height: index < currentStep ? "100%" : "0%" }}
                      />
                    </div>
                  )}

                  {/* Card del paso */}
                  <Card
                    className={cn(
                      "relative h-full",
                      "transition-all duration-300 will-change-transform",
                      "hover:-translate-y-1",
                      isActive
                        ? "ring-2 ring-synkro-green/35 shadow-xl shadow-synkro-green/15"
                        : "hover:shadow-lg",
                      theme.activeBg
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          className={cn(
                            "text-xs px-2 py-1",
                            theme.activeBadge
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
                            theme.activeIconWrap,
                            status === "in-progress" && "animate-pulse"
                          )}
                        >
                          <Icon size={20} />
                        </div>
                      </div>

                      <CardTitle
                        className={cn(
                          "text-sm font-semibold text-center text-balance line-clamp-2 min-h-10",
                          theme.activeText
                        )}
                      >
                        {step.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="pt-0 flex flex-1 flex-col">
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-4 leading-relaxed line-clamp-4">
                        {step.description}
                      </p>

                      {/* Features del paso */}
                      <div className="mt-auto space-y-1">
                        {step.features.map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                          >
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                status === "in-progress" ? theme.activeDot : "bg-gray-400"
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
                        <div className="w-3 h-3 bg-synkro-green rounded-full animate-pulse shadow-lg shadow-synkro-green/50" />
                      </div>
                    )}
                  </Card>
                </button>
              );
            })}
          </div>
        </div>

        {/* Información del paso actual */}
        <div className="mt-12 lg:mt-16">
          <Card className="bg-linear-to-r from-synkro-green/5 to-synkro-green/10 dark:from-synkro-green/10 dark:to-synkro-green/5 border-synkro-green/20">
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
                    className="text-xs border-synkro-green/30 text-synkro-green dark:text-synkro-green"
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
