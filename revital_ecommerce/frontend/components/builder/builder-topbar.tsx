"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Search } from "lucide-react";

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import type { BuilderSeo } from "@/services/builder.service";

const EMPTY_SEO: BuilderSeo = { title: null, description: null, og_image: null };

export function BuilderTopbar({
  title = "Constructor de Contenido",
  status = "draft",
  seo,
  onSeoChange,
}: {
  title?: string;
  status?: "published" | "draft";
  seo?: BuilderSeo;
  onSeoChange?: (seo: BuilderSeo) => void;
}) {
  const [seoOpen, setSeoOpen] = useState(false);
  const current = seo ?? EMPTY_SEO;
  const descLen = (current.description ?? "").length;

  function update(field: keyof BuilderSeo, value: string) {
    onSeoChange?.({ ...current, [field]: value || null });
  }

  return (
    <header className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#0f172a]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Button
            asChild
            className="h-7 px-2 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-white/75 dark:hover:bg-white/5 dark:hover:text-white"
            size="sm"
            variant="ghost"
          >
            <Link href="/admin/builder">
              <ChevronLeft className="size-3.5" />
              Volver
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
              <Badge variant={status === "published" ? "default" : "secondary"}>
                {status === "published" ? "Publicado" : "Borrador"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-white/55">
              Organiza secciones, ajusta estilos y revisa el resultado en tiempo real.
            </p>
          </div>
        </div>

        {onSeoChange ? (
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => setSeoOpen(true)}>
            <Search className="size-4" />
            SEO
          </Button>
        ) : null}
      </div>

      <Dialog open={seoOpen} onOpenChange={setSeoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>SEO de la página</DialogTitle>
            <DialogDescription>
              Cómo se ve esta página en Google y al compartir en redes. Si lo dejas vacío,
              se usa el nombre del sitio por defecto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="seo-title">Título (meta title)</Label>
              <Input
                id="seo-title"
                value={current.title ?? ""}
                maxLength={70}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Ej: Tienda de tecnología y hogar"
              />
              <p className="text-muted-foreground text-xs">Recomendado: 50–60 caracteres.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seo-desc">Meta descripción</Label>
              <Textarea
                id="seo-desc"
                value={current.description ?? ""}
                maxLength={160}
                rows={3}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Resumen breve que aparece bajo el título en Google."
              />
              <p className="text-muted-foreground text-xs">{descLen}/160 · recomendado 150–160.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seo-og">Imagen para redes (Open Graph URL)</Label>
              <Input
                id="seo-og"
                value={current.og_image ?? ""}
                onChange={(e) => update("og_image", e.target.value)}
                placeholder="https://... (1200×630 px)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSeoOpen(false)}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
