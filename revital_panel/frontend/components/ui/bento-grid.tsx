"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';
import { TrendingUp, ShoppingCart, Settings, LayoutGrid } from "lucide-react";

export interface BentoItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  hasPersistentHover?: boolean;
}

interface BentoGridProps {
  items?: BentoItem[];
}

function BentoGrid({ items }: BentoGridProps) {
  const t = useTranslations();
  
  const itemsSample: BentoItem[] = [
    {
      title: t('features.items.statistics.title'),
      meta: t('features.items.statistics.meta'),
      description: t('features.items.statistics.description'),
      icon: <TrendingUp className="w-4 h-4 text-revital-green" />,
      status: t('features.items.statistics.status'),
      tags: t.raw('features.items.statistics.tags') as string[],
      colSpan: 2,
      hasPersistentHover: true,
    },
    {
      title: t('features.items.products.title'),
      meta: t('features.items.products.meta'),
      description: t('features.items.products.description'),
      icon: <ShoppingCart className="w-4 h-4 text-revital-green" />,
      status: t('features.items.products.status'),
      tags: t.raw('features.items.products.tags') as string[],
    },
    {
      title: t('features.items.cms.title'),
      meta: t('features.items.cms.meta'),
      description: t('features.items.cms.description'),
      icon: <LayoutGrid className="w-4 h-4 text-revital-green" />,
      tags: t.raw('features.items.cms.tags') as string[],
      colSpan: 2,
    },
    {
      title: t('features.items.wompi.title'),
      meta: t('features.items.wompi.meta'),
      description: t('features.items.wompi.description'),
      icon: <Settings className="w-4 h-4 text-revital-green" />,
      status: t('features.items.wompi.status'),
      tags: t.raw('features.items.wompi.tags') as string[],
    },
  ];

  const displayItems = items || itemsSample;
  return (
    <div
      id="features"
      className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 max-w-7xl mx-auto py-20 lg:py-32 bg-white dark:bg-revital-black overflow-hidden"
    >
      {displayItems.map((item, index) => (
        <div
          key={index}
          className={cn(
            "group relative p-4 rounded-xl overflow-hidden transition-all duration-300",
            "border border-gray-100/80 dark:border-revital-green/20 bg-white dark:bg-revital-black",
            "hover:shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_2px_12px_rgba(99,229,129,0.1)]",
            "hover:-translate-y-0.5 will-change-transform",
            item.colSpan || "col-span-1",
            item.colSpan === 2 ? "md:col-span-2" : "",
            {
              "shadow-[0_2px_12px_rgba(0,0,0,0.03)] -translate-y-0.5":
                item.hasPersistentHover,
              "dark:shadow-[0_2px_12px_rgba(99,229,129,0.1)]":
                item.hasPersistentHover,
            }
          )}
        >
          <div
            className={`absolute inset-0 ${
              item.hasPersistentHover
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            } transition-opacity duration-300`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_center,rgba(99,229,129,0.05)_1px,transparent_1px)] bg-size-[4px_4px]" />
          </div>

          <div className="relative flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/5 dark:bg-revital-green/10 group-hover:bg-linear-to-br transition-all duration-300">
                {item.icon}
              </div>
              {item.status && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-revital-green/20 text-gray-700 dark:text-revital-green">
                  {item.status}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-revital-green transition-colors">
                  {item.title}
                </h3>
                {item.meta && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.meta}
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {item.description}
              </p>
            </div>

            {item.tags && (
              <div className="flex flex-wrap gap-1 pt-2">
                {item.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-revital-black border border-gray-200 dark:border-revital-green/20 text-gray-600 dark:text-gray-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {item.cta && (
              <div className="pt-2">
                <button className="text-sm text-revital-green hover:text-revital-green/80 font-medium transition-colors">
                  {item.cta} →
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export { BentoGrid };
