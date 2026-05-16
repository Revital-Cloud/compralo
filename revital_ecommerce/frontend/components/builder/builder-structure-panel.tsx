"use client";

import { Eye, EyeOff, GripVertical, LayoutTemplate, Trash2 } from "lucide-react";

import { BUILDER_SECTION_META } from "./builder-config";
import type { BuilderSection } from "./builder-types";
import { Badge } from "@/components/ui";

export function BuilderStructurePanel({
  sections,
  selectedId,
  draggingId,
  onSelect,
  onDelete,
  onToggleVisibility,
  onStartDrag,
  onEndDrag,
  onDropSection,
}: {
  sections: BuilderSection[];
  selectedId: string | null;
  draggingId: string | null;
  onSelect: (sectionId: string) => void;
  onDelete: (sectionId: string) => void;
  onToggleVisibility: (sectionId: string) => void;
  onStartDrag: (sectionId: string) => void;
  onEndDrag: () => void;
  onDropSection: (sectionId: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-3 py-2.5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="size-3.5 text-slate-400 dark:text-white/40" />
          <span className="text-[11px] text-slate-700 dark:text-white/75">Página Principal</span>
          <span className="ml-auto text-[10px] text-slate-400 dark:text-white/35">{sections.length}</span>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {sections.map((section, index) => {
          const meta = BUILDER_SECTION_META[section.type];
          const Icon = meta.icon;
          const isSelected = section.id === selectedId;
          const isDragging = draggingId === section.id;

          return (
            <div
              key={section.id}
              className={`rounded-lg border p-3 transition-colors ${
                isSelected
                  ? "border-[#ff0000]/70 bg-[#ff0000]/8"
                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-[#101a30] dark:hover:bg-[#16223d]"
              } ${isDragging ? "opacity-50" : ""}`}
              draggable
              onDragEnd={onEndDrag}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDragStart={() => onStartDrag(section.id)}
              onDrop={() => onDropSection(section.id)}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <button
                  className="flex min-w-0 items-center gap-2 text-left"
                  onClick={() => onSelect(section.id)}
                  type="button"
                >
                  <GripVertical className="size-3.5 shrink-0 text-slate-400 dark:text-white/35" />
                  <Icon className={`size-3.5 shrink-0 ${meta.colorClass}`} />
                  <span className="truncate text-xs font-medium text-slate-900 dark:text-white">
                    {index + 1}. {meta.label}
                  </span>
                </button>
                <Badge className="h-5 bg-[#ff0000] px-2 text-[10px] text-white hover:bg-[#ff0000]" variant="default">
                  {section.visible ? "Visible" : "Oculta"}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="line-clamp-1 text-[10px] text-slate-500 dark:text-white/45">{meta.description}</p>
                <div className="flex items-center gap-1">
                  <button
                    className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-white/45 dark:hover:bg-white/10 dark:hover:text-white"
                    onClick={() => onToggleVisibility(section.id)}
                    type="button"
                  >
                    {section.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                  </button>
                  <button
                    className="rounded p-1 text-red-500/80 hover:bg-slate-200 hover:text-red-600 dark:text-red-400/70 dark:hover:bg-white/10 dark:hover:text-red-400"
                    onClick={() => onDelete(section.id)}
                    type="button"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
