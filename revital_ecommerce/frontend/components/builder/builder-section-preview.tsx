"use client";

import dynamic from "next/dynamic";
import type { BuilderSection } from "./builder-types";
import { GENERIC_BLOCK_TYPE_SET } from "./blocks/block-defs";
import { renderGenericBlock } from "./blocks/blocks-render";

const HeaderLive = dynamic(() => import("@/components/layout/shop/header/header"), {
  ssr: false,
  loading: () => <div className="h-16 w-full rounded-xl bg-slate-100" aria-hidden="true" />,
});
const HeroLive = dynamic(() => import("@/components/layout/shop/hero/hero"), {
  ssr: false,
  loading: () => <div className="min-h-[420px] w-full rounded-xl bg-slate-100" aria-hidden="true" />,
});
const CategoriesLive = dynamic(
  () => import("@/components/layout/shop/featured-categories/featured-categories"),
  {
    ssr: false,
    loading: () => <div className="min-h-[420px] w-full rounded-xl bg-slate-100" aria-hidden="true" />,
  },
);
const ProductsLive = dynamic(
  () => import("@/components/layout/shop/featured-products/featured-products"),
  {
    ssr: false,
    loading: () => <div className="min-h-[420px] w-full rounded-xl bg-slate-100" aria-hidden="true" />,
  },
);
const TestimonialsLive = dynamic(
  () => import("@/components/layout/shop/testimonials/testimonials"),
  {
    ssr: false,
    loading: () => <div className="min-h-[360px] w-full rounded-xl bg-slate-100" aria-hidden="true" />,
  },
);
const FooterLive = dynamic(() => import("@/components/layout/shop/footer/footer"), {
  ssr: false,
  loading: () => <div className="min-h-[260px] w-full rounded-xl bg-slate-100" aria-hidden="true" />,
});

export function BuilderSectionPreview({ section }: { section: BuilderSection }) {
  if (!section.visible) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed p-3 text-center text-xs">
        Sección oculta
      </div>
    );
  }

  const style = section.style;
  const hasBackground = style.bgColor !== "transparent";

  const wrapperStyle = {
    background: hasBackground ? style.bgColor : undefined,
    marginBottom: style.marginBottom,
    marginTop: style.marginTop,
    paddingBottom: style.paddingBottom,
    paddingTop: style.paddingTop,
    textAlign: style.align,
  } as const;

  // Bloques de la biblioteca genérica: se renderizan tal cual en el lienzo.
  if (GENERIC_BLOCK_TYPE_SET.has(section.type)) {
    return (
      <div className="overflow-hidden rounded-xl bg-white py-2 dark:bg-[#0f172a]" style={wrapperStyle}>
        {renderGenericBlock(section)}
      </div>
    );
  }

  // En composición renderizamos los componentes reales del storefront
  // y desactivamos su interacción interna para que el click lo gestione el builder.
  if (section.type === "header") {
    return (
      <div className="overflow-hidden rounded-xl" style={wrapperStyle}>
        <div className="pointer-events-none">
          <HeaderLive />
        </div>
      </div>
    );
  }

  if (section.type === "hero") {
    return (
      <div className="overflow-hidden rounded-xl" style={wrapperStyle}>
        <div className="pointer-events-none">
          <HeroLive />
        </div>
      </div>
    );
  }

  if (section.type === "banner") {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200" style={wrapperStyle}>
        <div className="flex h-11 items-center justify-center bg-[#151b34] px-4 text-center text-sm font-semibold text-white">
          {String(section.props.text ?? "Envíos gratis en compras sobre $50.000")}
        </div>
      </div>
    );
  }

  if (section.type === "categories") {
    return (
      <div className="overflow-hidden rounded-xl" style={wrapperStyle}>
        <div className="pointer-events-none">
          <CategoriesLive />
        </div>
      </div>
    );
  }

  if (section.type === "product_grid") {
    return (
      <div className="overflow-hidden rounded-xl" style={wrapperStyle}>
        <div className="pointer-events-none">
          <ProductsLive />
        </div>
      </div>
    );
  }

  if (section.type === "carousel") {
    return (
      <div className="overflow-hidden rounded-xl" style={wrapperStyle}>
        <div className="pointer-events-none">
          <TestimonialsLive />
        </div>
      </div>
    );
  }

  if (section.type === "footer") {
    return (
      <div className="overflow-hidden rounded-xl" style={wrapperStyle}>
        <div className="pointer-events-none">
          <FooterLive />
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
      Sección no disponible
    </div>
  );
}
