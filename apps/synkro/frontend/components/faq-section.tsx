"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { faqContent } from "@/content";
import { cn } from "@/lib/utils";

export function FAQSection() {
  const [openItems, setOpenItems] = React.useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <section id="faq" className="py-20 lg:py-32 bg-white dark:bg-synkro-black">
      <div className="container mx-auto max-w-4xl px-6">
        <div className="text-center mb-16">
          <Badge variant="synkro" className="mb-4">
            Preguntas Frecuentes
          </Badge>
          <h2 className="text-3xl md:text-5xl font-regular tracking-tighter mb-4 dark:text-white">
            {faqContent.title}
          </h2>
          <p className="text-lg text-muted-foreground dark:text-gray-400 max-w-2xl mx-auto">
            {faqContent.subtitle}
          </p>
        </div>

        <div className="space-y-4">
          {faqContent.questions.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-synkro-green/20 rounded-lg overflow-hidden bg-white dark:bg-synkro-black"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-synkro-black/80 transition-colors"
              >
                <span className="font-medium text-gray-900 dark:text-white pr-4">
                  {item.question}
                </span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-gray-500 dark:text-synkro-green transition-transform duration-200 flex-shrink-0",
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
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground dark:text-gray-400 mb-4">
            ¿No encuentras la respuesta que buscas?
          </p>
          <a
            href="#contact"
            className="inline-flex items-center text-synkro-green hover:underline font-medium"
          >
            Contáctanos directamente →
          </a>
        </div>
      </div>
    </section>
  );
}
