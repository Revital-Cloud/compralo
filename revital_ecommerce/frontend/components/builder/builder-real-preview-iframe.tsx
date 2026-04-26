"use client";

import { useMemo, useState } from "react";
import { Loader2, RotateCw, TriangleAlert } from "lucide-react";

import { BUILDER_VIEWPORTS } from "./builder-config";
import type { BuilderViewport } from "./builder-types";
import { Button } from "@/components/ui";

export function BuilderRealPreviewIframe({
  viewport,
  zoom,
}: {
  viewport: BuilderViewport;
  zoom: number;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0);
  const scale = Math.max(0.4, zoom / 100);

  const src = useMemo(() => "/?builderPreview=1", []);

  function retryLoad() {
    setHasError(false);
    setIsLoading(true);
    setKey((value) => value + 1);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="text-muted-foreground text-xs">
        Resolución: {BUILDER_VIEWPORTS[viewport].label} · Escala: {zoom}%
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-white/10 dark:bg-[#0b1020]">
        <div className={`${BUILDER_VIEWPORTS[viewport].widthClass} mx-auto h-full`}>
          <div className="flex h-full min-h-[480px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0f172a] dark:shadow-2xl dark:shadow-black/30">
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
            <div className="relative min-h-0 flex-1 overflow-hidden bg-background">
              {isLoading ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Cargando sitio...
                  </div>
                </div>
              ) : null}

              {hasError ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background p-4 text-center">
                  <TriangleAlert className="size-5 text-amber-500" />
                  <p className="text-sm font-medium">No se pudo cargar la vista del sitio</p>
                  <p className="text-muted-foreground text-xs">
                    Reintenta la carga o vuelve a la vista de composición.
                  </p>
                  <Button onClick={retryLoad} size="sm" type="button" variant="outline">
                    <RotateCw className="size-4" />
                    Reintentar
                  </Button>
                </div>
              ) : null}

              <iframe
                className="block border-0"
                key={key}
                onError={() => {
                  setHasError(true);
                  setIsLoading(false);
                }}
                onLoad={() => {
                  setHasError(false);
                  setIsLoading(false);
                }}
                src={src}
                style={{
                  width: `${100 / scale}%`,
                  height: `${100 / scale}%`,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
                title="Vista del sitio"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
