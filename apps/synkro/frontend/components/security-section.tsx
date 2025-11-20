"use client";

import React from "react";
import { Shield, Lock, Database, Zap, CheckCircle, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SecurityFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: string;
}

const securityFeatures: SecurityFeature[] = [
  {
    icon: <Shield className="w-6 h-6 text-synkro-green" />,
    title: "Certificación PCI DSS",
    description:
      "Cumplimiento total con estándares de seguridad para procesamiento de pagos.",
    status: "Certificado",
  },
  {
    icon: <Lock className="w-6 h-6 text-synkro-green" />,
    title: "Encriptación SSL/TLS",
    description:
      "Todas las comunicaciones protegidas con encriptación de grado militar.",
    status: "Activo",
  },
  {
    icon: <Database className="w-6 h-6 text-synkro-green" />,
    title: "Backups Automáticos",
    description:
      "Respaldos diarios automáticos con recuperación en menos de 4 horas.",
    status: "Diario",
  },
  {
    icon: <Zap className="w-6 h-6 text-synkro-green" />,
    title: "Uptime 99.9%",
    description: "Infraestructura redundante con garantía de disponibilidad.",
    status: "SLA",
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-synkro-green" />,
    title: "Auditorías de Seguridad",
    description: "Revisiones mensuales de seguridad y pruebas de penetración.",
    status: "Mensual",
  },
  {
    icon: <Globe className="w-6 h-6 text-synkro-green" />,
    title: "GDPR Compliance",
    description:
      "Cumplimiento con regulaciones de protección de datos internacionales.",
    status: "Compliant",
  },
];

const stats = [
  { value: "99.9%", label: "Uptime Garantizado" },
  { value: "<4h", label: "Tiempo de Recuperación" },
  { value: "256-bit", label: "Encriptación SSL" },
  { value: "24h", label: "Monitoreo de Seguridad" },
];

export function SecuritySection() {
  return (
    <section
      id="security"
      className="py-20 lg:py-32 bg-white dark:bg-synkro-black"
    >
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <Badge variant="synkro" className="mb-4">
            Seguridad y Confiabilidad
          </Badge>
          <h2 className="text-3xl md:text-5xl font-regular tracking-tighter mb-4 dark:text-white">
            Tu Negocio, Protegido
          </h2>
          <p className="text-lg text-muted-foreground dark:text-gray-400 max-w-2xl mx-auto">
            Infraestructura de nivel empresarial con las más altas
            certificaciones de seguridad para que te enfoques en vender.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-synkro-green dark:text-synkro-green mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Security Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-synkro-black border border-gray-200 dark:border-synkro-green/20 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{feature.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    {feature.description}
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-synkro-green/20 dark:text-synkro-green">
                    {feature.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground dark:text-gray-400 mb-6">
            Confían en nuestra seguridad empresas como:
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
              PCI DSS
            </div>
            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
              SOC 2
            </div>
            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
              ISO 27001
            </div>
            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
              GDPR
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
