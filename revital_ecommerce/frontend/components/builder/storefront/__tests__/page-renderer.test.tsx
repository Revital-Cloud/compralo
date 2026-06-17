import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import type { BuilderSection } from "@/components/builder/builder-types";
import {
  BuilderStorefrontRenderer,
  selectBodySections,
} from "@/components/builder/storefront/page-renderer";

// Stubs ligeros para evitar framer-motion / data fetching en los componentes reales.
vi.mock("@/components/layout/shop/hero/hero", () => ({
  default: ({ content }: { content?: { title?: string } }) => (
    <div data-testid="section-hero">{content?.title}</div>
  ),
}));
vi.mock("@/components/layout/shop/featured-products/featured-products", () => ({
  default: ({ content }: { content?: { title?: string } }) => (
    <div data-testid="section-products">{content?.title}</div>
  ),
}));
// Los dynamic() (categorías y testimonios) se reemplazan por un stub.
vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="section-dynamic" />,
}));

function section(partial: Partial<BuilderSection> & { id: string; type: string }): BuilderSection {
  return {
    visible: true,
    props: {},
    style: {
      bgColor: "transparent",
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 0,
      marginBottom: 0,
      align: "left",
    },
    ...partial,
  } as BuilderSection;
}

describe("selectBodySections", () => {
  it("incluye solo tipos de cuerpo visibles, en orden", () => {
    const sections = [
      section({ id: "1", type: "header" }),
      section({ id: "2", type: "hero" }),
      section({ id: "3", type: "product_grid", visible: false }),
      section({ id: "4", type: "carousel" }),
      section({ id: "5", type: "footer" }),
    ];
    const body = selectBodySections(sections);
    expect(body.map((s) => s.id)).toEqual(["2", "4"]);
  });
});

describe("BuilderStorefrontRenderer", () => {
  it("renderiza secciones de cuerpo con su contenido y omite header/footer", () => {
    const sections = [
      section({ id: "h", type: "header" }),
      section({ id: "hero", type: "hero", props: { title: "Mi hero" } }),
      section({ id: "prod", type: "product_grid", props: { title: "Mis productos" } }),
      section({ id: "cat", type: "categories" }),
      section({ id: "f", type: "footer" }),
    ];

    render(<BuilderStorefrontRenderer sections={sections} />);

    expect(screen.getByTestId("section-hero")).toHaveTextContent("Mi hero");
    expect(screen.getByTestId("section-products")).toHaveTextContent("Mis productos");
    // categorías -> stub dinámico
    expect(screen.getAllByTestId("section-dynamic")).toHaveLength(1);
  });

  it("no renderiza secciones ocultas", () => {
    const sections = [
      section({ id: "hero", type: "hero", visible: false, props: { title: "Oculto" } }),
    ];
    render(<BuilderStorefrontRenderer sections={sections} />);
    expect(screen.queryByTestId("section-hero")).toBeNull();
  });
});
