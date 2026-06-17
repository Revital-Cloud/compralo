"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Palette,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@/components/ui";
import type {
  BuilderSection,
  BuilderSectionType,
} from "@/components/builder/builder-types";
import { buildSectionsFromTypes, slugify } from "@/components/builder/builder-utils";
import {
  builderService,
  type BuilderPageStatus,
  type BuilderPageSummary,
} from "@/services/builder.service";
import { toUserSafeApiDetail } from "@/utils/api-error-message";

type TemplateItem = {
  id: string;
  name: string;
  desc: string;
  sections: BuilderSectionType[];
  tag: string | null;
};

const templates: TemplateItem[] = [
  {
    id: "moda",
    name: "Moda & Estilo",
    desc: "Ropa, accesorios y lifestyle",
    sections: ["hero", "categories", "product_grid", "carousel", "footer"],
    tag: "Popular",
  },
  {
    id: "electronica",
    name: "Electrónica",
    desc: "Gadgets, tech y componentes",
    sections: ["hero", "banner", "product_grid", "carousel", "footer"],
    tag: null,
  },
  {
    id: "minimalista",
    name: "Minimalista",
    desc: "Layout limpio y elegante",
    sections: ["hero", "product_grid", "footer"],
    tag: null,
  },
];

const statusBadgeVariant: Record<BuilderPageStatus, "default" | "secondary"> = {
  published: "default",
  draft: "secondary",
};

const statusLabel: Record<BuilderPageStatus, string> = {
  published: "Publicado",
  draft: "Borrador",
};

function editHref(page: BuilderPageSummary): string {
  return page.is_home ? "/admin/builder/create" : `/admin/builder/edit/${page.slug}`;
}

function publicHref(page: BuilderPageSummary): string {
  return page.is_home ? "/" : `/p/${page.slug}`;
}

function apiError(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return toUserSafeApiDetail(detail, fallback);
}

export default function BuilderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["builder-pages"],
    queryFn: () => builderService.listPages(),
    staleTime: 1000 * 30,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [pendingSections, setPendingSections] = useState<BuilderSection[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<BuilderPageSummary | null>(null);

  const createMutation = useMutation({
    mutationFn: (vars: { slug: string; title: string; sections: BuilderSection[] }) =>
      builderService.createPage({ slug: vars.slug, title: vars.title, sections: vars.sections }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["builder-pages"] });
      toast.success("Página creada correctamente");
      setDialogOpen(false);
      router.push(`/admin/builder/edit/${vars.slug}`);
    },
    onError: (err) => toast.error(apiError(err, "No se pudo crear la página")),
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => builderService.deletePage(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["builder-pages"] });
      toast.success("Página eliminada");
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(apiError(err, "No se pudo eliminar la página")),
  });

  const metrics = useMemo(() => {
    const total = pages.length;
    const published = pages.filter((page) => page.status === "published").length;
    return { total, published, drafts: total - published };
  }, [pages]);

  function openBlankDialog() {
    setFormTitle("");
    setFormSlug("");
    setSlugTouched(false);
    setPendingSections([]);
    setDialogOpen(true);
  }

  function openTemplateDialog(template: TemplateItem) {
    setFormTitle(template.name);
    setFormSlug(slugify(template.name));
    setSlugTouched(false);
    setPendingSections(buildSectionsFromTypes(template.sections));
    setDialogOpen(true);
  }

  function handleTitleChange(value: string) {
    setFormTitle(value);
    if (!slugTouched) setFormSlug(slugify(value));
  }

  function submitCreate() {
    const slug = slugify(formSlug);
    if (!formTitle.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    if (!slug) {
      toast.error("El slug es obligatorio");
      return;
    }
    createMutation.mutate({ slug, title: formTitle.trim(), sections: pendingSections });
  }

  return (
    <div className="space-y-6 px-3 py-4 md:px-4 md:py-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <Globe className="size-3.5" />
            Admin / Builder
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">CMS Builder</h1>
          <p className="text-muted-foreground text-sm">
            Gestiona las páginas del storefront y edítalas con el constructor visual.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/builder/theme">
              <Palette className="size-4" />
              Theme global
            </Link>
          </Button>
          <Button
            className="bg-brand-secondary text-slate-900 hover:bg-brand-secondary/90"
            onClick={openBlankDialog}
          >
            <Plus className="size-4" />
            Nueva página
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Total páginas" value={metrics.total} />
        <MetricCard label="Publicadas" value={metrics.published} />
        <MetricCard label="Borradores" value={metrics.drafts} />
      </section>

      <Card className="py-0">
        <CardHeader className="border-b px-4 py-4 md:px-6">
          <CardTitle className="text-base">Páginas</CardTitle>
          <CardDescription>Catálogo de páginas del storefront gestionadas desde la base de datos.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 md:px-6">Nombre</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Modificado</th>
                  <th className="px-4 py-3 text-right md:px-6">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="text-muted-foreground px-4 py-8 text-center md:px-6" colSpan={5}>
                      <Loader2 className="mx-auto size-5 animate-spin" />
                    </td>
                  </tr>
                ) : pages.length === 0 ? (
                  <tr>
                    <td className="text-muted-foreground px-4 py-8 text-center md:px-6" colSpan={5}>
                      Aún no hay páginas. Crea la primera con &ldquo;Nueva página&rdquo;.
                    </td>
                  </tr>
                ) : (
                  pages.map((page) => (
                    <tr key={page.slug} className="hover:bg-muted/40 border-b transition-colors last:border-b-0">
                      <td className="px-4 py-4 md:px-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-muted flex size-8 items-center justify-center rounded-md border">
                            <FileText className="text-muted-foreground size-4" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {page.title}
                              {page.is_home ? (
                                <span className="text-muted-foreground ml-2 text-xs font-normal">(Principal)</span>
                              ) : null}
                            </p>
                            <p className="text-muted-foreground text-xs">{page.section_count} secciones</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs">{publicHref(page)}</td>
                      <td className="px-4 py-4">
                        <Badge variant={statusBadgeVariant[page.status]}>{statusLabel[page.status]}</Badge>
                      </td>
                      <td className="text-muted-foreground px-4 py-4 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="size-3.5" />
                          {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 md:px-6">
                        <div className="flex items-center justify-end gap-2">
                          {page.status === "published" ? (
                            <Button asChild size="sm" variant="ghost" title="Ver publicada">
                              <Link href={publicHref(page)} target="_blank">
                                <ExternalLink className="size-4" />
                              </Link>
                            </Button>
                          ) : null}
                          <Button asChild size="sm" variant="outline">
                            <Link href={editHref(page)}>Abrir constructor</Link>
                          </Button>
                          {!page.is_home ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(page)}
                              title="Eliminar"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary size-4" />
          <h2 className="text-base font-semibold">Templates</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Crea una página nueva a partir de una base de secciones lista para editar.
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden p-0">
              <div className="from-primary/25 via-primary/5 to-background h-28 bg-gradient-to-br p-4">
                <div className="bg-card/70 h-4 w-2/3 rounded-sm border" />
                <div className="bg-card/50 mt-2 h-3 w-1/2 rounded-sm border" />
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="bg-card/70 h-8 rounded-sm border" />
                  <div className="bg-card/70 h-8 rounded-sm border" />
                  <div className="bg-card/70 h-8 rounded-sm border" />
                </div>
              </div>
              <CardContent className="space-y-4 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{template.desc}</p>
                  </div>
                  {template.tag ? <Badge variant="secondary">{template.tag}</Badge> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {template.sections.map((section, idx) => (
                    <Badge key={`${section}-${idx}`} variant="outline">
                      {section}
                    </Badge>
                  ))}
                </div>
                <Button className="w-full" variant="outline" onClick={() => openTemplateDialog(template)}>
                  Usar template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <p className="text-muted-foreground inline-flex items-center gap-2 text-xs">
        <CheckCircle2 className="size-3.5" />
        Cada página se guarda como borrador y se publica al storefront desde el constructor.
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva página</DialogTitle>
            <DialogDescription>
              Define el nombre y la ruta. Podrás editar las secciones en el constructor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="builder-page-title">Título</Label>
              <Input
                id="builder-page-title"
                value={formTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ej: Sobre Nosotros"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="builder-page-slug">Slug (URL)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">/p/</span>
                <Input
                  id="builder-page-slug"
                  value={formSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setFormSlug(e.target.value);
                  }}
                  placeholder="sobre-nosotros"
                />
              </div>
              <p className="text-muted-foreground text-xs">Solo minúsculas, números y guiones.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-brand-secondary text-slate-900 hover:bg-[#e4b305]"
              onClick={submitCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Crear y editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar página</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que deseas eliminar &ldquo;{deleteTarget?.title}&rdquo;? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.slug)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="gap-2 py-4">
      <CardContent className="px-4">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
