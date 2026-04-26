"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Construction,
  FileText,
  Globe,
  Sparkles,
} from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";

type BuilderStatus = "published" | "draft";

type BuilderPageItem = {
  id: string;
  name: string;
  slug: string;
  status: BuilderStatus;
  date: string;
  sections: number;
};

type TemplateItem = {
  id: string;
  name: string;
  desc: string;
  sections: string[];
  tag: string | null;
};

const pages: BuilderPageItem[] = [
  { id: "1", name: "Página Principal", slug: "/home", status: "published", date: "hace 2 días", sections: 5 },
  { id: "2", name: "Colección Verano", slug: "/verano", status: "published", date: "hace 5 días", sections: 4 },
  { id: "3", name: "Electrónica", slug: "/electronica", status: "draft", date: "hace 1 hora", sections: 3 },
  { id: "4", name: "Ofertas Flash", slug: "/ofertas", status: "draft", date: "hace 3 horas", sections: 2 },
];

const templates: TemplateItem[] = [
  {
    id: "ropa",
    name: "Moda & Estilo",
    desc: "Ropa, accesorios y lifestyle",
    sections: ["Hero", "Categorías", "Grid Productos", "Footer"],
    tag: "Popular",
  },
  {
    id: "electronica",
    name: "Electrónica",
    desc: "Gadgets, tech y componentes",
    sections: ["Hero", "Banner", "Grid Productos", "Carrusel", "Footer"],
    tag: null,
  },
  {
    id: "minimalista",
    name: "Minimalista",
    desc: "Layout limpio y elegante",
    sections: ["Hero", "Grid Productos", "Footer"],
    tag: null,
  },
];

const statusBadgeVariant: Record<BuilderStatus, "default" | "secondary"> = {
  published: "default",
  draft: "secondary",
};

const statusLabel: Record<BuilderStatus, string> = {
  published: "Publicado",
  draft: "Borrador",
};

export default function BuilderPage() {
  const enabledPages = pages.filter((page) => page.id === "1").length;
  const blockedPages = pages.length - enabledPages;

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
            Gestiona páginas y abre el constructor de contenido desde un solo lugar.
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                className="bg-[#fec806] text-slate-900 hover:bg-[#e4b305]"
                disabled
              >
                <Construction className="size-4" />
                Nueva página
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">En construcción</TooltipContent>
        </Tooltip>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Total configuradas" value={pages.length} />
        <MetricCard label="Habilitadas en builder" value={enabledPages} />
        <MetricCard label="Bloqueadas (próximamente)" value={blockedPages} />
      </section>

      <Card className="py-0">
        <CardHeader className="border-b px-4 py-4 md:px-6">
          <CardTitle className="text-base">Páginas</CardTitle>
          <CardDescription>Estado actual del catálogo de páginas del storefront.</CardDescription>
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
                  <th className="px-4 py-3 text-right md:px-6">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-muted/40 border-b transition-colors last:border-b-0">
                    <td className="px-4 py-4 md:px-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted flex size-8 items-center justify-center rounded-md border">
                          <FileText className="text-muted-foreground size-4" />
                        </div>
                        <div>
                          <p className="font-medium">{page.name}</p>
                          <p className="text-muted-foreground text-xs">{page.sections} secciones</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs">{page.slug}</td>
                    <td className="px-4 py-4">
                      <Badge variant={statusBadgeVariant[page.status]}>{statusLabel[page.status]}</Badge>
                    </td>
                    <td className="text-muted-foreground px-4 py-4 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3.5" />
                        {page.date}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right md:px-6">
                      {page.id === "1" ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href="/admin/builder/create">Abrir constructor</Link>
                        </Button>
                      ) : (
                        <Button disabled size="sm" variant="outline">
                          Próximamente
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
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
          Base visual inspirada en Compralo para iniciar páginas rápidamente.
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="relative overflow-hidden p-0">
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
                  {template.sections.map((section) => (
                    <Badge key={section} variant="outline">
                      {section}
                    </Badge>
                  ))}
                </div>
                <Button className="w-full" disabled>
                  En construcción
                </Button>
              </CardContent>

              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/45 backdrop-blur-[1px]">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-300/20 px-3 py-1 text-xs font-semibold text-amber-50">
                  <Construction className="size-3.5" />
                  Próximamente
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <p className="text-muted-foreground inline-flex items-center gap-2 text-xs">
        <CheckCircle2 className="size-3.5" />
        Constructor disponible para composición, edición de propiedades y revisión visual.
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <Card className="gap-2 py-4">
      <CardContent className="px-4">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
