"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui";

export function BuilderTopbar({
}: {
  // Topbar ahora es solo contextual; controles viven en "Vista previa".
}) {
  return (
    <header className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#0f172a]">
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
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Constructor de Contenido</h1>
            <p className="text-xs text-slate-500 dark:text-white/55">
              Organiza secciones, ajusta estilos y revisa el resultado en tiempo real.
            </p>
          </div>
      </div>
    </header>
  );
}
