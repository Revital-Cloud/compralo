import type { LucideIcon } from "lucide-react";

export type BuilderSectionType =
  | "header"
  | "banner"
  | "hero"
  | "categories"
  | "product_grid"
  | "carousel"
  | "footer";

export type BuilderAlign = "left" | "center" | "right";

export type BuilderFieldType = "text" | "number" | "image";

export type BuilderFieldConfig = {
  key: string;
  label: string;
  type: BuilderFieldType;
};

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
  props: Record<string, string | number>;
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
