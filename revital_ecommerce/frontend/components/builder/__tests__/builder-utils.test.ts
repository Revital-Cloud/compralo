import { describe, expect, it } from "vitest";

import {
  buildSectionsFromTypes,
  reorderSections,
  slugify,
} from "@/components/builder/builder-utils";
import type { BuilderSection } from "@/components/builder/builder-types";

describe("slugify", () => {
  it("normaliza acentos, espacios y mayúsculas", () => {
    expect(slugify("Sobre Nosotros")).toBe("sobre-nosotros");
    expect(slugify("Acentós y Ñ")).toBe("acentos-y-n");
    expect(slugify("  Múltiples   espacios  ")).toBe("multiples-espacios");
  });

  it("quita guiones colgantes y caracteres no válidos", () => {
    expect(slugify("--hola--")).toBe("hola");
    expect(slugify("a/b#c")).toBe("a-b-c");
    expect(slugify("")).toBe("");
  });
});

describe("buildSectionsFromTypes", () => {
  it("crea secciones con props y estilos por defecto", () => {
    const sections = buildSectionsFromTypes(["hero", "product_grid"]);
    expect(sections).toHaveLength(2);
    expect(sections[0].type).toBe("hero");
    expect(sections[0].visible).toBe(true);
    expect(sections[0].props).toHaveProperty("title");
    expect(sections[0].style).toHaveProperty("bgColor", "transparent");
    // ids únicos
    expect(sections[0].id).not.toBe(sections[1].id);
  });
});

describe("reorderSections", () => {
  const base: BuilderSection[] = ["a", "b", "c"].map((id) => ({
    id,
    type: "hero",
    props: {},
    visible: true,
    style: {
      bgColor: "transparent",
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 0,
      marginBottom: 0,
      align: "left",
    },
  }));

  it("mueve la sección arrastrada a la posición destino", () => {
    const result = reorderSections(base, "a", "c");
    expect(result.map((s) => s.id)).toEqual(["b", "c", "a"]);
  });

  it("no cambia nada si origen y destino son iguales", () => {
    expect(reorderSections(base, "b", "b")).toBe(base);
  });
});
