"use client";
import { Monitor, Plus, Save, Smartphone, Tablet, UploadCloud } from "lucide-react";

import { BUILDER_VIEWPORTS } from "./builder-config";
import { BuilderRealPreviewIframe } from "./builder-real-preview-iframe";
import { BuilderSectionPreview } from "./builder-section-preview";
import type {
  BuilderPreviewMode,
  BuilderSection,
  BuilderViewport,
} from "./builder-types";

export function BuilderPreviewPanel({
  sections,
  selectedId,
  viewport,
  zoom,
  mode,
  onSelectSection,
  onModeChange,
  onViewportChange,
  onZoomChange,
  onAddSection,
}: {
  sections: BuilderSection[];
  selectedId: string | null;
  viewport: BuilderViewport;
  zoom: number;
  mode: BuilderPreviewMode;
  onSelectSection: (sectionId: string) => void;
  onModeChange: (next: BuilderPreviewMode) => void;
  onViewportChange: (next: BuilderViewport) => void;
  onZoomChange: (next: number) => void;
  onAddSection: () => void;
}) {
  const scale = Math.max(0.4, zoom / 100);
  const viewportIcons = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone,
  } as const;

  return (
    <section className="h-[72vh] overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a]">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-[#0b1222]">
            <button
              className={`h-8 rounded-md px-3 text-xs font-medium transition-colors ${
                mode === "compose"
                  ? "bg-[#fec806] text-slate-900"
                  : "text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white"
              }`}
              onClick={() => onModeChange("compose")}
              type="button"
            >
              Vista de composición
            </button>
            <button
              className={`h-8 rounded-md px-3 text-xs font-medium transition-colors ${
                mode === "site"
                  ? "bg-[#fec806] text-slate-900"
                  : "text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white"
              }`}
              onClick={() => onModeChange("site")}
              type="button"
            >
              Vista del sitio
            </button>
          </div>

          <div className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-[#0b1222]">
            {(Object.keys(BUILDER_VIEWPORTS) as BuilderViewport[]).map((key) => {
              const Icon = viewportIcons[key];
              const active = viewport === key;
              return (
                <button
                  aria-label={BUILDER_VIEWPORTS[key].label}
                  className={`flex size-8 items-center justify-center rounded-md transition-colors ${
                    active
                      ? "bg-[#fec806] text-slate-900"
                      : "text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white"
                  }`}
                  key={key}
                  onClick={() => onViewportChange(key)}
                  type="button"
                >
                  <Icon className="size-4" />
                </button>
              );
            })}
          </div>

          <div className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-2 dark:border-white/10 dark:bg-[#0b1222]">
            <button
              className="flex size-7 items-center justify-center rounded text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => onZoomChange(Math.max(40, zoom - 10))}
              type="button"
            >
              -
            </button>
            <span className="min-w-12 text-center text-xs font-medium text-slate-700 dark:text-white/80">{zoom}%</span>
            <button
              className="flex size-7 items-center justify-center rounded text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => onZoomChange(Math.min(200, zoom + 10))}
              type="button"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:border-white/10 dark:bg-[#111a31] dark:text-white/90 dark:hover:bg-[#17213b]"
            type="button"
          >
            <Save className="size-4" />
            Guardar cambios
          </button>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#fec806] px-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-[#e4b305]"
            type="button"
          >
            <UploadCloud className="size-4" />
            Publicar
          </button>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:border-white/10 dark:bg-[#111a31] dark:text-white/90 dark:hover:bg-[#17213b]"
            onClick={onAddSection}
            type="button"
          >
            <Plus className="size-4" />
            Agregar sección
          </button>
        </div>
      </div>
      <div className="h-[calc(72vh-3.5rem)] px-3 py-3">
        {mode === "site" ? (
          <BuilderRealPreviewIframe viewport={viewport} zoom={zoom} />
        ) : (
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-white/10 dark:bg-[#0b1020]">
              <div className={`${BUILDER_VIEWPORTS[viewport].widthClass} mx-auto h-full`}>
                <div
                  className="flex h-full min-h-[480px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0f172a] dark:shadow-2xl dark:shadow-black/30"
                  style={{
                    width: `${100 / scale}%`,
                    height: `${100 / scale}%`,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-100 px-3 py-2 dark:border-white/10 dark:bg-[#111827]">
                    <div className="flex items-center gap-1.5">
                      <div className="size-2 rounded-full bg-red-400/80" />
                      <div className="size-2 rounded-full bg-amber-400/80" />
                      <div className="size-2 rounded-full bg-emerald-400/80" />
                    </div>
                    <div className="mx-auto flex h-7 w-full max-w-xs items-center rounded-md border border-slate-300 bg-white px-3 text-[11px] text-slate-500 dark:border-white/10 dark:bg-[#0b1222] dark:text-white/50">
                      compralo.revital.cloud
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-50 dark:via-white dark:to-slate-100">
                    <div className="space-y-3 p-3">
                      {sections
                        .filter((section) => section.visible)
                        .map((section) => (
                          <div
                            aria-label={`Seleccionar sección ${section.type}`}
                            className={`block w-full rounded-lg text-left transition ${
                              selectedId === section.id
                                ? "ring-2 ring-[#4f46e5]"
                                : "hover:ring-1 hover:ring-slate-400/60"
                            }`}
                            key={section.id}
                            onClick={() => onSelectSection(section.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onSelectSection(section.id);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <BuilderSectionPreview section={section} />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
