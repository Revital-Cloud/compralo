"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { BuilderInsertPanel } from "./builder-insert-panel";
import { BuilderPreviewPanel } from "./builder-preview-panel";
import { BuilderPropertiesPanel } from "./builder-properties-panel";
import { BuilderStructurePanel } from "./builder-structure-panel";
import { BuilderTopbar } from "./builder-topbar";
import { useBuilderEditor } from "./use-builder-editor";
import type { BuilderSection } from "./builder-types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@/components/ui";
import { builderService } from "@/services/builder.service";

export function BuilderWorkspace({ slug = "home" }: { slug?: string }) {
  const builder = useBuilderEditor(slug);
  const [leftTab, setLeftTab] = useState<"insert" | "navigator">("insert");
  const queryClient = useQueryClient();

  const [blockSection, setBlockSection] = useState<BuilderSection | null>(null);
  const [blockName, setBlockName] = useState("");

  const saveBlock = useMutation({
    mutationFn: (vars: { name: string; section: BuilderSection }) =>
      builderService.createBlock(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["builder-blocks"] });
      toast.success("Bloque guardado en “Mis bloques”");
      setBlockSection(null);
      setBlockName("");
    },
    onError: () => toast.error("No se pudo guardar el bloque"),
  });

  function openSaveAsBlock(section: BuilderSection) {
    setBlockSection(section);
    setBlockName(builder.sections.find((s) => s.id === section.id)?.type ?? "Bloque");
  }

  return (
    <div className="space-y-3">
      <BuilderTopbar
        title={builder.title}
        status={builder.hasPublished ? "published" : "draft"}
        seo={builder.seo}
        onSeoChange={builder.updateSeo}
      />

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
                onInsertPreset={builder.insertPreset}
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
          isDirty={builder.isDirty}
          isPublishing={builder.isPublishing}
          isSaving={builder.isSaving}
          mode={builder.previewMode}
          onAddSection={() => setLeftTab("insert")}
          onModeChange={builder.setPreviewMode}
          onPublish={builder.publish}
          onSave={builder.save}
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
            onSaveAsBlock={openSaveAsBlock}
            section={builder.selectedSection}
          />
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-white/45">
        Secciones totales: {builder.sections.length} · visibles: {builder.visibleCount}
      </p>

      <Dialog open={blockSection !== null} onOpenChange={(open) => !open && setBlockSection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar como bloque reutilizable</DialogTitle>
            <DialogDescription>
              Quedará disponible en &ldquo;Mis bloques&rdquo; para insertarlo en cualquier página.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="block-name">Nombre del bloque</Label>
            <Input
              id="block-name"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              placeholder="Ej: Banner promo verano"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockSection(null)}>Cancelar</Button>
            <Button
              disabled={saveBlock.isPending || !blockName.trim() || !blockSection}
              onClick={() => blockSection && saveBlock.mutate({ name: blockName.trim(), section: blockSection })}
            >
              Guardar bloque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
