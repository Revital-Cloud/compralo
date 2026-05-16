import type { BuilderSection } from "./builder-types";

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
