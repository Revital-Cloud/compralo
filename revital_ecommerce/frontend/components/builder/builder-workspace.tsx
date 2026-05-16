"use client";

import { useState } from "react";

import { BuilderInsertPanel } from "./builder-insert-panel";
import { BuilderPreviewPanel } from "./builder-preview-panel";
import { BuilderPropertiesPanel } from "./builder-properties-panel";
import { BuilderStructurePanel } from "./builder-structure-panel";
import { BuilderTopbar } from "./builder-topbar";
import { useBuilderEditor } from "./use-builder-editor";

export function BuilderWorkspace() {
  const builder = useBuilderEditor();
  const [leftTab, setLeftTab] = useState<"insert" | "navigator">("insert");

  return (
    <div className="space-y-3">
      <BuilderTopbar />

      <div className="grid gap-3 xl:grid-cols-[280px_1fr_280px]">
        <div className="flex h-[72vh] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a]">
          <div className="flex border-b border-slate-200 dark:border-white/10">
            {([
              ["insert", "Insertar"] as const,
              ["navigator", "Navegador"] as const,
            ]).map(([key, label]) => (
              <button
                key={key}
                className={`h-9 flex-1 text-xs font-medium transition-colors ${
                  leftTab === key
                    ? "border-b-2 border-[#4f46e5] text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-white/45 dark:hover:text-white/80"
                }`}
                onClick={() => setLeftTab(key)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {leftTab === "insert" ? (
              <BuilderInsertPanel
                categories={builder.insertCategories}
                insertableTypes={builder.insertableTypes}
                onInsert={builder.addSection}
                onSearchChange={builder.setInsertSearch}
                search={builder.insertSearch}
              />
            ) : (
              <BuilderStructurePanel
                draggingId={builder.draggingId}
                onDelete={builder.deleteSection}
                onDropSection={builder.dropOnSection}
                onEndDrag={builder.endDrag}
                onSelect={builder.setSelectedSectionId}
                onStartDrag={builder.startDrag}
                onToggleVisibility={builder.toggleSectionVisibility}
                sections={builder.sections}
                selectedId={builder.selectedSectionId}
              />
            )}
          </div>
        </div>

        <BuilderPreviewPanel
          mode={builder.previewMode}
          onAddSection={() => setLeftTab("insert")}
          onModeChange={builder.setPreviewMode}
          onSelectSection={builder.setSelectedSectionId}
          onViewportChange={builder.setViewport}
          onZoomChange={builder.setZoom}
          sections={builder.sections}
          selectedId={builder.selectedSectionId}
          viewport={builder.viewport}
          zoom={builder.zoom}
        />

        <div className="h-[72vh] overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a]">
          <BuilderPropertiesPanel
            onDelete={builder.deleteSection}
            onToggleVisibility={builder.toggleSectionVisibility}
            onUpdateProp={builder.updateSelectedProp}
            onUpdateStyle={builder.updateSelectedStyle}
            section={builder.selectedSection}
          />
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-white/45">
        Secciones totales: {builder.sections.length} · visibles: {builder.visibleCount}
      </p>
    </div>
  );
}
