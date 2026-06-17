"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Plus, Save, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/components/ui";
import { themeService } from "@/services/theme.service";
import { DEFAULT_THEME } from "@/lib/theme-css";
import type { SiteTheme } from "@/lib/theme-types";
import { toUserSafeApiDetail } from "@/utils/api-error-message";

const FONT_OPTIONS = [
  "Geist",
  "Inter",
  "Poppins",
  "Roboto",
  "Montserrat",
  "Lato",
  "Open Sans",
  "Nunito",
  "Raleway",
  "Work Sans",
];

const COLOR_FIELDS: { key: keyof SiteTheme["theme"]["colors"]; label: string }[] = [
  { key: "primary", label: "Primario (marca)" },
  { key: "secondary", label: "Secundario" },
  { key: "accent", label: "Acento" },
  { key: "background", label: "Fondo (claro)" },
  { key: "foreground", label: "Texto (claro)" },
  { key: "dark_background", label: "Fondo (oscuro)" },
  { key: "dark_foreground", label: "Texto (oscuro)" },
];

function apiError(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return toUserSafeApiDetail(detail, fallback);
}

export default function ThemeEditorPage() {
  const [site, setSite] = useState<SiteTheme>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasPublished, setHasPublished] = useState(false);

  useEffect(() => {
    let active = true;
    themeService
      .getTheme()
      .then((theme) => {
        if (!active || !theme) return;
        setSite({ theme: theme.theme, header: theme.header, footer: theme.footer });
        setHasPublished(Boolean(theme.has_published));
      })
      .catch(() => {})
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  function setColor(key: keyof SiteTheme["theme"]["colors"], value: string) {
    setSite((s) => ({ ...s, theme: { ...s.theme, colors: { ...s.theme.colors, [key]: value } } }));
  }
  function setFont(which: "heading" | "body", value: string) {
    setSite((s) => ({ ...s, theme: { ...s.theme, fonts: { ...s.theme.fonts, [which]: value } } }));
  }
  function setRadius(value: string) {
    setSite((s) => ({ ...s, theme: { ...s.theme, radius: value } }));
  }
  function setLogo(value: string) {
    setSite((s) => ({ ...s, theme: { ...s.theme, logo_url: value || null } }));
  }
  function setBrand(value: string) {
    setSite((s) => ({ ...s, header: { ...s.header, brand: value } }));
  }
  function setCopyright(value: string) {
    setSite((s) => ({ ...s, footer: { ...s.footer, copyright: value } }));
  }
  function updateNav(index: number, field: "text" | "href", value: string) {
    setSite((s) => {
      const nav = s.header.nav.map((item, i) => (i === index ? { ...item, [field]: value } : item));
      return { ...s, header: { ...s.header, nav } };
    });
  }
  function addNav() {
    setSite((s) => ({ ...s, header: { ...s.header, nav: [...s.header.nav, { text: "Nuevo", href: "/" }] } }));
  }
  function removeNav(index: number) {
    setSite((s) => ({ ...s, header: { ...s.header, nav: s.header.nav.filter((_, i) => i !== index) } }));
  }

  async function save(): Promise<boolean> {
    setIsSaving(true);
    try {
      await themeService.saveTheme(site);
      toast.success("Theme guardado");
      return true;
    } catch (err) {
      toast.error(apiError(err, "No se pudo guardar el theme"));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function publish() {
    setIsPublishing(true);
    try {
      await themeService.saveTheme(site);
      await themeService.publishTheme();
      setHasPublished(true);
      toast.success("Theme publicado. Los cambios ya están en vivo.");
    } catch (err) {
      toast.error(apiError(err, "No se pudo publicar el theme"));
    } finally {
      setIsPublishing(false);
    }
  }

  const busy = isSaving || isPublishing;
  const c = site.theme.colors;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 px-3 py-4 md:px-4 md:py-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
            <Link href="/admin/builder">
              <ChevronLeft className="size-3.5" />
              Volver
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Theme global</h1>
            <Badge variant={hasPublished ? "default" : "secondary"}>
              {hasPublished ? "Publicado" : "Borrador"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Colores, tipografías, logo y navegación de todo el sitio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={save} disabled={busy}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Guardar
          </Button>
          <Button
            className="bg-brand-secondary text-slate-900 hover:bg-brand-secondary/90"
            onClick={publish}
            disabled={busy}
          >
            {isPublishing ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
            Publicar
          </Button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Colores</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {COLOR_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs">{field.label}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={c[field.key]}
                      onChange={(e) => setColor(field.key, e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border bg-transparent"
                      aria-label={field.label}
                    />
                    <Input
                      value={c[field.key]}
                      onChange={(e) => setColor(field.key, e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tipografía, radius y logo</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Fuente títulos</Label>
                <select
                  value={site.theme.fonts.heading}
                  onChange={(e) => setFont("heading", e.target.value)}
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fuente cuerpo</Label>
                <select
                  value={site.theme.fonts.body}
                  onChange={(e) => setFont("body", e.target.value)}
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Radius (border-radius base)</Label>
                <Input value={site.theme.radius} onChange={(e) => setRadius(e.target.value)} placeholder="0.625rem" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Logo (URL)</Label>
                <Input
                  value={site.theme.logo_url ?? ""}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Header (marca y navegación)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre de la marca</Label>
                <Input value={site.header.brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Enlaces de navegación</Label>
                {site.header.nav.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={item.text}
                      onChange={(e) => updateNav(i, "text", e.target.value)}
                      placeholder="Texto"
                      className="flex-1"
                    />
                    <Input
                      value={item.href}
                      onChange={(e) => updateNav(i, "href", e.target.value)}
                      placeholder="/ruta"
                      className="flex-1 font-mono text-xs"
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeNav(i)} aria-label="Eliminar enlace">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addNav}>
                  <Plus className="size-4" />
                  Agregar enlace
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Footer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label className="text-xs">Copyright</Label>
                <Input value={site.footer.copyright} onChange={(e) => setCopyright(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview en vivo */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vista previa</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="space-y-4 rounded-lg border p-4"
                style={
                  {
                    "--brand-primary": c.primary,
                    "--brand-secondary": c.secondary,
                    "--brand-accent": c.accent,
                    background: c.background,
                    color: c.foreground,
                    borderRadius: site.theme.radius,
                  } as React.CSSProperties
                }
              >
                <div className="text-xl font-bold" style={{ color: c.primary }}>
                  {site.header.brand}
                </div>
                <div
                  className="rounded-md p-4 text-white"
                  style={{ background: `linear-gradient(to right, ${c.accent}, ${c.secondary})` }}
                >
                  <p className="text-sm font-semibold">Hero de ejemplo</p>
                  <p className="text-xs opacity-90">Así se ven los acentos de marca.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className="rounded-md px-3 py-1.5 text-sm font-semibold text-white"
                    style={{ background: c.primary, borderRadius: site.theme.radius }}
                  >
                    Botón primario
                  </span>
                  <span
                    className="rounded-md px-3 py-1.5 text-sm font-semibold"
                    style={{ background: c.accent, color: "#000", borderRadius: site.theme.radius }}
                  >
                    Acento
                  </span>
                </div>
                <div className="flex gap-3 text-sm">
                  {site.header.nav.slice(0, 4).map((item, i) => (
                    <span key={i} style={{ color: c.primary }}>{item.text}</span>
                  ))}
                </div>
                <p className="text-xs opacity-70">{site.footer.copyright}</p>
              </div>
              <p className="text-muted-foreground mt-3 text-xs">
                Los cambios aplican a todo el sitio al publicar.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
