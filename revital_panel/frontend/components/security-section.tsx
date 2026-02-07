"use client";

import React from "react";
import { Shield, Lock, Database, Zap, CheckCircle, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';

interface SecurityFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: string;
}

<<<<<<< HEAD:synkro_panel/frontend/components/security-section.tsx
=======
const securityFeatures: SecurityFeature[] = [
  {
    icon: <Shield className="w-6 h-6 text-revital-green" />,
    title: "Certificación PCI DSS",
    description:
      "Cumplimiento total con estándares de seguridad para procesamiento de pagos.",
    status: "Certificado",
  },
  {
    icon: <Lock className="w-6 h-6 text-revital-green" />,
    title: "Encriptación SSL/TLS",
    description:
      "Todas las comunicaciones protegidas con encriptación de grado militar.",
    status: "Activo",
  },
  {
    icon: <Database className="w-6 h-6 text-revital-green" />,
    title: "Backups Automáticos",
    description:
      "Respaldos diarios automáticos con recuperación en menos de 4 horas.",
    status: "Diario",
  },
  {
    icon: <Zap className="w-6 h-6 text-revital-green" />,
    title: "Uptime 99.9%",
    description: "Infraestructura redundante con garantía de disponibilidad.",
    status: "SLA",
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-revital-green" />,
    title: "Auditorías de Seguridad",
    description: "Revisiones mensuales de seguridad y pruebas de penetración.",
    status: "Mensual",
  },
  {
    icon: <Globe className="w-6 h-6 text-revital-green" />,
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

>>>>>>> main:revital_panel/frontend/components/security-section.tsx
export function SecuritySection() {
  const t = useTranslations();

  const securityFeatures: SecurityFeature[] = [
    {
      icon: <Shield className="w-6 h-6 text-synkro-green" />,
      title: t('security.items.pci.title'),
      description: t('security.items.pci.description'),
      status: t('security.items.pci.status'),
    },
    {
      icon: <Lock className="w-6 h-6 text-synkro-green" />,
      title: t('security.items.ssl.title'),
      description: t('security.items.ssl.description'),
      status: t('security.items.ssl.status'),
    },
    {
      icon: <Database className="w-6 h-6 text-synkro-green" />,
      title: t('security.items.backups.title'),
      description: t('security.items.backups.description'),
      status: t('security.items.backups.status'),
    },
    {
      icon: <Zap className="w-6 h-6 text-synkro-green" />,
      title: t('security.items.uptime.title'),
      description: t('security.items.uptime.description'),
      status: t('security.items.uptime.status'),
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-synkro-green" />,
      title: t('security.items.audits.title'),
      description: t('security.items.audits.description'),
      status: t('security.items.audits.status'),
    },
    {
      icon: <Globe className="w-6 h-6 text-synkro-green" />,
      title: t('security.items.gdpr.title'),
      description: t('security.items.gdpr.description'),
      status: t('security.items.gdpr.status'),
    },
  ];

  const stats = [
    { value: "99.9%", label: t('security.stats.uptime') },
    { value: "<4h", label: t('security.stats.recovery') },
    { value: "256-bit", label: t('security.stats.encryption') },
    { value: "24h", label: t('security.stats.monitoring') },
  ];
  return (
    <section
      id="security"
      className="py-20 lg:py-32 bg-white dark:bg-revital-black"
    >
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
<<<<<<< HEAD:synkro_panel/frontend/components/security-section.tsx
          <Badge variant="synkro" className="mb-4">
            {t('security.badge')}
=======
          <Badge variant="revital" className="mb-4">
            Seguridad y Confiabilidad
>>>>>>> main:revital_panel/frontend/components/security-section.tsx
          </Badge>
          <h2 className="text-3xl md:text-5xl font-regular tracking-tighter mb-4 dark:text-white">
            {t('security.heading')}
          </h2>
          <p className="text-lg text-muted-foreground dark:text-gray-400 max-w-2xl mx-auto">
            {t('security.subheading')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-revital-green dark:text-revital-green mb-2">
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
              className="bg-white dark:bg-revital-black border border-gray-200 dark:border-revital-green/20 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0">{feature.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    {feature.description}
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-revital-green/20 dark:text-revital-green">
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
            {t('security.trustIndicators')}
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
