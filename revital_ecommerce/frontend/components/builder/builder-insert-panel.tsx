"use client";

import { Plus, Search, X } from "lucide-react";

import { BUILDER_SECTION_META } from "./builder-config";
import type { BuilderSectionType } from "./builder-types";
import { Button, Input } from "@/components/ui";

export function BuilderInsertPanel({
  search,
  categories,
  insertableTypes,
  onSearchChange,
  onInsert,
}: {
  search: string;
  categories: string[];
  insertableTypes: BuilderSectionType[];
  onSearchChange: (value: string) => void;
  onInsert: (sectionType: BuilderSectionType) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-3 py-3 dark:border-white/10">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Agregar estructura</p>
      </div>

      <div className="border-b border-slate-200 px-3 py-2 dark:border-white/10">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 dark:text-white/35" />
          <Input
            className="h-8 border-slate-200 bg-white pl-8 text-xs text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-[#121a2f] dark:text-white dark:placeholder:text-white/35"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar sección..."
            value={search}
          />
          {search ? (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:text-white/45 dark:hover:text-white"
              onClick={() => onSearchChange("")}
              type="button"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {categories.map((category) => {
          const categoryItems = insertableTypes.filter(
            (type) => BUILDER_SECTION_META[type].category === category,
          );

          if (!categoryItems.length) return null;

          return (
            <section key={category} className="mb-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-white/35">
                {category}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {categoryItems.map((sectionType) => {
                  const meta = BUILDER_SECTION_META[sectionType];
                  const Icon = meta.icon;

                  return (
                    <button
                      key={sectionType}
                      className="rounded-lg border border-slate-200 bg-white p-3 text-left transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-[#111a31] dark:hover:border-white/20 dark:hover:bg-[#17213a]"
                      onClick={() => onInsert(sectionType)}
                      type="button"
                    >
                      <div className="mb-1.5 flex items-center gap-2">
                        <Icon className={`size-4 ${meta.colorClass}`} />
                        <p className="text-xs font-medium text-slate-900 dark:text-white">{meta.label}</p>
                      </div>
                      <p className="line-clamp-2 text-[10px] text-slate-500 dark:text-white/45">{meta.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="border-t border-slate-200 p-3 dark:border-white/10">
        <Button
          className="h-8 w-full border-slate-200 bg-transparent text-xs text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-white/80 dark:hover:bg-[#17213a]"
          onClick={() => onSearchChange("")}
          type="button"
          variant="outline"
        >
          <Plus className="size-3.5" />
          Limpiar búsqueda
        </Button>
      </div>
    </div>
  );
}
