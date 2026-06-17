import { BUILDER_DEFAULT_PROPS, createDefaultStyle } from "./builder-config";
import type { BuilderSection, BuilderSectionType } from "./builder-types";

/** Convierte un texto a slug seguro (minúsculas, sin acentos, con guiones). */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Construye secciones con props/estilos por defecto a partir de una lista de tipos. */
export function buildSectionsFromTypes(types: BuilderSectionType[]): BuilderSection[] {
  return types.map((type) => ({
    id: createBuilderId(type),
    type,
    props: { ...BUILDER_DEFAULT_PROPS[type] },
    visible: true,
    style: createDefaultStyle(),
  }));
}

export function reorderSections(
  sections: BuilderSection[],
  fromId: string,
  toId: string,
): BuilderSection[] {
  if (fromId === toId) return sections;

  const fromIndex = sections.findIndex((item) => item.id === fromId);
  const toIndex = sections.findIndex((item) => item.id === toId);

  if (fromIndex < 0 || toIndex < 0) return sections;

  const next = [...sections];
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next;
}

export function createBuilderId(prefix = "section"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
