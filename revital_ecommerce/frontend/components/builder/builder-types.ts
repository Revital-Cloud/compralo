import type { LucideIcon } from "lucide-react";

/**
 * Tipos de sección. Se dividen en:
 * - "data-driven" (header/banner/hero/categories/product_grid/carousel/footer):
 *   conectados al catálogo/tema; se renderizan con componentes vivos del storefront.
 * - "genéricos" (biblioteca reutilizable): contenido libre y responsive que el admin
 *   compone desde el CMS (texto rico, imagen, CTA, features, FAQ, galería, etc.).
 */
export type BuilderSectionType =
  | "header"
  | "banner"
  | "hero"
  | "categories"
  | "product_grid"
  | "carousel"
  | "footer"
  // Biblioteca de bloques genéricos
  | "richtext"
  | "heading"
  | "text"
  | "image"
  | "image_text"
  | "cta"
  | "button"
  | "features"
  | "gallery"
  | "faq"
  | "spacer"
  | "divider";

export type BuilderAlign = "left" | "center" | "right";

export type BuilderFieldType =
  | "text"
  | "number"
  | "image"
  | "textarea"
  | "richtext"
  | "color"
  | "select"
  | "boolean"
  | "link";

export type BuilderFieldOption = { value: string; label: string };

export type BuilderFieldConfig = {
  key: string;
  label: string;
  type: BuilderFieldType;
  options?: BuilderFieldOption[];
  placeholder?: string;
  help?: string;
};

export type BuilderPropValue = string | number | boolean;

export type BuilderSectionStyle = {
  bgColor: string;
  paddingTop: number;
  paddingBottom: number;
  marginTop: number;
  marginBottom: number;
  align: BuilderAlign;
};

export type BuilderSection = {
  id: string;
  type: BuilderSectionType;
  props: Record<string, BuilderPropValue>;
  visible: boolean;
  style: BuilderSectionStyle;
};

export type BuilderSectionMeta = {
  label: string;
  description: string;
  category: string;
  icon: LucideIcon;
  colorClass: string;
};

export type BuilderViewport = "desktop" | "tablet" | "mobile";

export type BuilderPreviewMode = "compose" | "site";
