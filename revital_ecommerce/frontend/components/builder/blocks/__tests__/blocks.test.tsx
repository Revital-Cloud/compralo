import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  GENERIC_BLOCK_TYPES,
  GENERIC_DEFAULT_PROPS,
  GENERIC_FIELDS,
  GENERIC_META,
} from "@/components/builder/blocks/block-defs";
import { renderGenericBlock } from "@/components/builder/blocks/blocks-render";
import {
  BUILDER_DEFAULT_PROPS,
  BUILDER_FIELDS,
  BUILDER_SECTION_META,
} from "@/components/builder/builder-config";
import type { BuilderSection } from "@/components/builder/builder-types";

function section(type: string, props: Record<string, string | number | boolean> = {}): BuilderSection {
  return {
    id: `${type}-1`,
    type: type as BuilderSection["type"],
    visible: true,
    props,
    style: { bgColor: "transparent", paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0, align: "left" },
  };
}

describe("block library catalog", () => {
  it("cada bloque genérico tiene meta, campos y props por defecto", () => {
    for (const type of GENERIC_BLOCK_TYPES) {
      expect(GENERIC_META[type], `meta ${type}`).toBeDefined();
      expect(GENERIC_FIELDS[type], `fields ${type}`).toBeDefined();
      expect(GENERIC_DEFAULT_PROPS[type], `defaults ${type}`).toBeDefined();
    }
  });

  it("el config del builder fusiona data-driven + genéricos", () => {
    for (const type of GENERIC_BLOCK_TYPES) {
      expect(BUILDER_SECTION_META[type]).toBeDefined();
      expect(BUILDER_FIELDS[type]).toBeDefined();
      expect(BUILDER_DEFAULT_PROPS[type]).toBeDefined();
    }
    // sigue teniendo los data-driven
    expect(BUILDER_SECTION_META.hero).toBeDefined();
    expect(BUILDER_SECTION_META.product_grid).toBeDefined();
  });
});

describe("renderGenericBlock", () => {
  it("renderiza un encabezado con su texto", () => {
    render(<>{renderGenericBlock(section("heading", { text: "Mi título", level: "h2" }))}</>);
    expect(screen.getByText("Mi título")).toBeInTheDocument();
  });

  it("renderiza un CTA con título y botón", () => {
    render(<>{renderGenericBlock(section("cta", { title: "Compra ya", button_text: "Ir", button_link: "/x" }))}</>);
    expect(screen.getByText("Compra ya")).toBeInTheDocument();
    expect(screen.getByText("Ir")).toBeInTheDocument();
  });

  it("devuelve null para tipos data-driven (no genéricos)", () => {
    expect(renderGenericBlock(section("hero"))).toBeNull();
    expect(renderGenericBlock(section("product_grid"))).toBeNull();
  });
});
