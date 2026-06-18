"use client";

import dynamic from "next/dynamic";

import EcommerceHeroCarousel from "@/components/layout/shop/hero/hero";
import FeaturedProducts from "@/components/layout/shop/featured-products/featured-products";
import type { BuilderSection } from "@/components/builder/builder-types";
import { GENERIC_BLOCK_TYPES } from "@/components/builder/blocks/block-defs";
import { renderGenericBlock } from "@/components/builder/blocks/blocks-render";

const FeaturedCategories = dynamic(
  () => import("@/components/layout/shop/featured-categories/featured-categories"),
  { ssr: false, loading: () => <div className="min-h-[480px]" aria-hidden="true" /> },
);

const TestimonialsSection = dynamic(
  () => import("@/components/layout/shop/testimonials/testimonials"),
  { ssr: false, loading: () => <div className="min-h-[360px]" aria-hidden="true" /> },
);

/**
 * Tipos de sección que se renderizan en el cuerpo de una página. El header,
 * footer y la barra superior son globales (los gestiona el layout del storefront),
 * por eso no se renderizan aquí aunque existan en el documento del builder.
 */
export const BODY_SECTION_TYPES = new Set<string>([
  "hero",
  "categories",
  "product_grid",
  "carousel",
  ...GENERIC_BLOCK_TYPES,
]);

/**
 * Selecciona las secciones que se renderizan en el cuerpo: visibles y de un tipo
 * soportado, preservando el orden del documento.
 */
export function selectBodySections(sections: BuilderSection[]): BuilderSection[] {
  return sections.filter(
    (section) => section.visible !== false && BODY_SECTION_TYPES.has(section.type),
  );
}

function str(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
}

function num(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function sectionWrapperStyle(section: BuilderSection): React.CSSProperties {
  const style = section.style;
  const hasBackground = style?.bgColor && style.bgColor !== "transparent";
  return {
    background: hasBackground ? style.bgColor : undefined,
    marginTop: style?.marginTop || undefined,
    marginBottom: style?.marginBottom || undefined,
    paddingTop: style?.paddingTop || undefined,
    paddingBottom: style?.paddingBottom || undefined,
    textAlign: style?.align,
  };
}

function renderSection(section: BuilderSection) {
  const props = section.props ?? {};

  // Bloques de la biblioteca genérica.
  const generic = renderGenericBlock(section);
  if (generic) return generic;

  switch (section.type) {
    case "hero":
      return (
        <EcommerceHeroCarousel
          content={{
            title: str(props.title),
            subtitle: str(props.subtitle),
            ctaText: str(props.cta_text),
            ctaLink: str(props.cta_link),
          }}
        />
      );
    case "categories":
      return <FeaturedCategories content={{ title: str(props.title), columns: num(props.columns) }} />;
    case "product_grid":
      return <FeaturedProducts content={{ title: str(props.title), columns: num(props.columns) }} />;
    case "carousel":
      return <TestimonialsSection content={{ title: str(props.title) }} />;
    default:
      return null;
  }
}

/**
 * Renderiza el cuerpo de una página del CMS Builder a partir de las secciones
 * publicadas, respetando orden, visibilidad, contenido (props) y estilos.
 */
export function BuilderStorefrontRenderer({ sections }: { sections: BuilderSection[] }) {
  const body = selectBodySections(sections);

  return (
    <>
      {body.map((section) => {
        const content = renderSection(section);
        if (!content) return null;
        return (
          <div key={section.id} style={sectionWrapperStyle(section)}>
            {content}
          </div>
        );
      })}
    </>
  );
}

export default BuilderStorefrontRenderer;
