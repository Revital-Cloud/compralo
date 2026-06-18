"use client";

import { useRef, useState } from "react";
import { Bookmark, Eye, EyeOff, Loader2, Palette, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { BUILDER_FIELDS, BUILDER_SECTION_META } from "./builder-config";
import type {
  BuilderFieldConfig,
  BuilderPropValue,
  BuilderSection,
  BuilderSectionStyle,
} from "./builder-types";
import { Button, Input, Switch, Textarea } from "@/components/ui";
import { uploadProductImage } from "@/services/product.service";

const alignOptions: BuilderSectionStyle["align"][] = ["left", "center", "right"];

export function BuilderPropertiesPanel({
  section,
  onDelete,
  onToggleVisibility,
  onUpdateProp,
  onUpdateStyle,
  onSaveAsBlock,
}: {
  section: BuilderSection | null;
  onDelete: (sectionId: string) => void;
  onToggleVisibility: (sectionId: string) => void;
  onUpdateProp: (key: string, value: BuilderPropValue) => void;
  onUpdateStyle: (key: keyof BuilderSectionStyle, value: string | number) => void;
  onSaveAsBlock?: (section: BuilderSection) => void;
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
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {BUILDER_SECTION_META[section.type]?.label ?? section.type}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => onToggleVisibility(section.id)} size="sm" type="button" variant="outline">
                  {section.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  {section.visible ? "Visible" : "Oculta"}
                </Button>
                <Button onClick={() => onDelete(section.id)} size="sm" type="button" variant="destructive">
                  <Trash2 className="size-4" />
                  Eliminar
                </Button>
              </div>
              {onSaveAsBlock ? (
                <Button
                  className="w-full"
                  onClick={() => onSaveAsBlock(section)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Bookmark className="size-4" />
                  Guardar como bloque
                </Button>
              ) : null}
            </div>

            {rightTab === "element" ? (
              <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-white/45">
                  Contenido
                </p>
                {(BUILDER_FIELDS[section.type] ?? []).length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-white/40">Este bloque no tiene campos editables.</p>
                ) : null}
                {(BUILDER_FIELDS[section.type] ?? []).map((field) => (
                  <FieldInput
                    key={field.key}
                    field={field}
                    value={section.props[field.key]}
                    onChange={(value) => onUpdateProp(field.key, value)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Palette className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-white/45">Estilo</p>
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
                    value={section.style.bgColor === "transparent" ? "#000000" : section.style.bgColor}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <NumberStyleInput label="Padding top" onValueChange={(v) => onUpdateStyle("paddingTop", v)} value={section.style.paddingTop} />
                  <NumberStyleInput label="Padding bottom" onValueChange={(v) => onUpdateStyle("paddingBottom", v)} value={section.style.paddingBottom} />
                  <NumberStyleInput label="Margin top" onValueChange={(v) => onUpdateStyle("marginTop", v)} value={section.style.marginTop} />
                  <NumberStyleInput label="Margin bottom" onValueChange={(v) => onUpdateStyle("marginBottom", v)} value={section.style.marginBottom} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const fieldInputCls =
  "h-8 border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-[#121a2f] dark:text-white dark:placeholder:text-white/35";

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: BuilderFieldConfig;
  value: BuilderPropValue | undefined;
  onChange: (value: BuilderPropValue) => void;
}) {
  return (
    <div className="space-y-1.5">
      {field.type !== "boolean" ? <label className="text-xs font-medium">{field.label}</label> : null}

      {field.type === "number" ? (
        <Input
          className={fieldInputCls}
          type="number"
          value={String(value ?? 0)}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value || 0)))}
        />
      ) : field.type === "textarea" || field.type === "richtext" ? (
        <Textarea
          className="min-h-20 border-slate-200 bg-white text-xs text-slate-900 dark:border-white/10 dark:bg-[#121a2f] dark:text-white"
          rows={field.type === "richtext" ? 6 : 3}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      ) : field.type === "color" ? (
        <div className="flex items-center gap-2">
          <input
            type="color"
            className="h-8 w-12 cursor-pointer rounded border bg-transparent"
            value={String(value || "#000000")}
            onChange={(e) => onChange(e.target.value)}
          />
          <Input className={fieldInputCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        </div>
      ) : field.type === "select" ? (
        <select
          className="border-input h-8 w-full rounded-md border bg-transparent px-2 text-xs"
          value={String(value ?? field.options?.[0]?.value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : field.type === "boolean" ? (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">{field.label}</label>
          <Switch checked={value === true || value === "true"} onCheckedChange={(c) => onChange(c)} />
        </div>
      ) : field.type === "image" ? (
        <ImageField value={String(value ?? "")} onChange={onChange} />
      ) : (
        <Input
          className={fieldInputCls}
          type={field.type === "link" ? "text" : "text"}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? (field.type === "link" ? "/ruta o https://..." : undefined)}
        />
      )}

      {field.help ? <p className="text-[11px] text-slate-400 dark:text-white/40">{field.help}</p> : null}
    </div>
  );
}

function ImageField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadProductImage(file);
      onChange(url);
      toast.success("Imagen subida");
    } catch {
      toast.error("No se pudo subir la imagen");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          className={fieldInputCls}
          type="url"
          placeholder="https://..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-16 w-full rounded border border-slate-200 object-cover dark:border-white/10" />
      ) : null}
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
