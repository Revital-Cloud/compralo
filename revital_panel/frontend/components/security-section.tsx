"use client";

import React from "react";
import { Shield, Lock, Database, Zap, CheckCircle, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

const ICONS = [Shield, Lock, Database, Zap, CheckCircle, Globe] as const;
const ITEM_KEYS = ["pci", "ssl", "backups", "uptime", "audits", "gdpr"] as const;
const STAT_KEYS = ["uptime", "recovery", "encryption", "monitoring"] as const;
const STAT_VALUES = ["99.9%", "<4h", "256-bit", "24h"] as const;

export function SecuritySection() {
  const t = useTranslations("security");

  const securityFeatures = ITEM_KEYS.map((key, index) => {
    const Icon = ICONS[index];
    return {
      icon: <Icon className="w-6 h-6 text-revital-green" />,
      title: t(`items.${key}.title`),
      description: t(`items.${key}.description`),
      status: t(`items.${key}.status`),
    };
  });

  const stats = STAT_KEYS.map((key, index) => ({
    value: STAT_VALUES[index],
    label: t(`stats.${key}`),
  }));

  return (
    <section
      id="security"
      className="py-20 lg:py-32 bg-white dark:bg-revital-black"
    >
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <Badge variant="revital" className="mb-4">
            {t("badge")}
          </Badge>
          <h2 className="text-3xl md:text-5xl font-regular tracking-tighter mb-4 dark:text-white">
            {t("heading")}
          </h2>
          <p className="text-lg text-muted-foreground dark:text-gray-400 max-w-2xl mx-auto">
            {t("subheading")}
          </p>
        </div>

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

        <div className="mt-16 text-center">
          <p className="text-muted-foreground dark:text-gray-400 mb-6">
            {t("trustIndicators")}
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
