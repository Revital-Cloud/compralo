"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const FAQ_KEYS = ["wompi", "api", "support", "customization", "security"] as const;

export function FAQSection() {
  const t = useTranslations("faq");
  const [openItems, setOpenItems] = React.useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <section id="faq" className="py-20 lg:py-32 bg-white dark:bg-revital-black">
      <div className="container mx-auto max-w-4xl px-6">
        <div className="text-center mb-16">
          <Badge variant="revital" className="mb-4">
            {t("title")}
          </Badge>
          <h2 className="text-3xl md:text-5xl font-regular tracking-tighter mb-4 dark:text-white">
            {t("title")}
          </h2>
          <p className="text-lg text-muted-foreground dark:text-gray-400 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_KEYS.map((key, index) => (
            <div
              key={key}
              className="border border-gray-200 dark:border-revital-green/20 rounded-lg overflow-hidden bg-white dark:bg-revital-black"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-revital-black/80 transition-colors"
              >
                <span className="font-medium text-gray-900 dark:text-white pr-4">
                  {t(`questions.${key}.question`)}
                </span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-gray-500 dark:text-revital-green transition-transform duration-200 shrink-0",
                    openItems.includes(index) && "rotate-180"
                  )}
                />
              </button>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-200 ease-in-out",
                  openItems.includes(index)
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                )}
              >
                <div className="px-6 pb-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t(`questions.${key}.answer`)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground dark:text-gray-400 mb-4">
            {t("notFound")}
          </p>
          <a
            href="#contact"
            className="inline-flex items-center text-revital-green hover:underline font-medium"
          >
            {t("contactUs")} →
          </a>
        </div>
      </div>
    </section>
  );
}
