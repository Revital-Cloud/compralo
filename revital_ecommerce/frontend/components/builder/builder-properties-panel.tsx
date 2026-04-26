"use client";

import { useState } from "react";
import { Eye, EyeOff, Palette, Trash2 } from "lucide-react";

import { BUILDER_FIELDS, BUILDER_SECTION_META } from "./builder-config";
import type { BuilderSection, BuilderSectionStyle } from "./builder-types";
import { Button, Input } from "@/components/ui";

const alignOptions: BuilderSectionStyle["align"][] = ["left", "center", "right"];

export function BuilderPropertiesPanel({
  section,
  onDelete,
  onToggleVisibility,
  onUpdateProp,
  onUpdateStyle,
}: {
  section: BuilderSection | null;
  onDelete: (sectionId: string) => void;
  onToggleVisibility: (sectionId: string) => void;
  onUpdateProp: (key: string, value: string | number) => void;
  onUpdateStyle: (key: keyof BuilderSectionStyle, value: string | number) => void;
}) {
  const [rightTab, setRightTab] = useState<"element" | "style">("element");

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-3 py-2 dark:border-white/10">
        <div className="flex border-b border-slate-200 dark:border-white/10">
          {([
            ["element", "Elemento"] as const,
            ["style", "Estilo"] as const,
          ]).map(([key, label]) => (
            <button
              key={key}
              className={`h-9 flex-1 text-xs font-medium transition-colors ${
                rightTab === key
                  ? "border-b-2 border-[#4f46e5] text-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-white/45 dark:hover:text-white/80"
              }`}
              onClick={() => setRightTab(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {!section ? (
          <p className="text-sm text-slate-500 dark:text-white/60">
            Selecciona una sección para editar su contenido y estilo.
          </p>
        ) : (
          <>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{BUILDER_SECTION_META[section.type].label}</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => onToggleVisibility(section.id)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {section.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  {section.visible ? "Visible" : "Oculta"}
                </Button>
                <Button onClick={() => onDelete(section.id)} size="sm" type="button" variant="destructive">
                  <Trash2 className="size-4" />
                  Eliminar
                </Button>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-white/45">
                Contenido
              </p>
              {rightTab === "element"
                ? BUILDER_FIELDS[section.type].map((field) => {
                    const current = section.props[field.key];
                    if (field.type === "number") {
                      return (
                        <div className="space-y-1.5" key={field.key}>
                          <label className="text-xs font-medium">{field.label}</label>
                          <Input
                            className="h-8 border-slate-200 bg-white text-xs text-slate-900 dark:border-white/10 dark:bg-[#121a2f] dark:text-white"
                            onChange={(event) =>
                              onUpdateProp(field.key, Math.max(1, Number(event.target.value || 1)))
                            }
                            type="number"
                            value={String(current ?? 1)}
                          />
                        </div>
                      );
                    }

                    if (field.type === "image") {
                      return (
                        <div className="space-y-1.5" key={field.key}>
                          <label className="text-xs font-medium">{field.label}</label>
                          <Input
                            className="h-8 border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-[#121a2f] dark:text-white dark:placeholder:text-white/35"
                            onChange={(event) => onUpdateProp(field.key, event.target.value)}
                            placeholder="https://..."
                            type="url"
                            value={String(current ?? "")}
                          />
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-1.5" key={field.key}>
                        <label className="text-xs font-medium">{field.label}</label>
                        <Input
                          className="h-8 border-slate-200 bg-white text-xs text-slate-900 dark:border-white/10 dark:bg-[#121a2f] dark:text-white"
                          onChange={(event) => onUpdateProp(field.key, event.target.value)}
                          type="text"
                          value={String(current ?? "")}
                        />
                      </div>
                    );
                  })
                : null}
            </div>

            {rightTab === "style" ? (
              <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Palette className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-white/45">
                    Estilo
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Alineación</label>
                  <div className="grid grid-cols-3 gap-2">
                    {alignOptions.map((option) => (
                      <Button
                        key={option}
                        onClick={() => onUpdateStyle("align", option)}
                        size="sm"
                        type="button"
                        variant={section.style.align === option ? "default" : "outline"}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Color de fondo</label>
                  <Input
                    className="h-8 border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-[#121a2f]"
                    onChange={(event) => onUpdateStyle("bgColor", event.target.value)}
                    type="color"
                    value={
                      section.style.bgColor === "transparent"
                        ? "#000000"
                        : section.style.bgColor
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <NumberStyleInput
                    label="Padding top"
                    onValueChange={(value) => onUpdateStyle("paddingTop", value)}
                    value={section.style.paddingTop}
                  />
                  <NumberStyleInput
                    label="Padding bottom"
                    onValueChange={(value) => onUpdateStyle("paddingBottom", value)}
                    value={section.style.paddingBottom}
                  />
                  <NumberStyleInput
                    label="Margin top"
                    onValueChange={(value) => onUpdateStyle("marginTop", value)}
                    value={section.style.marginTop}
                  />
                  <NumberStyleInput
                    label="Margin bottom"
                    onValueChange={(value) => onUpdateStyle("marginBottom", value)}
                    value={section.style.marginBottom}
                  />
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function NumberStyleInput({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}</label>
      <Input
        className="h-8 border-slate-200 bg-white text-xs text-slate-900 dark:border-white/10 dark:bg-[#121a2f] dark:text-white"
        onChange={(event) => onValueChange(Math.max(0, Number(event.target.value || 0)))}
        type="number"
        value={String(value)}
      />
    </div>
  );
}
