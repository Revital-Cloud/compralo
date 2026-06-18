import {
  AlignJustify,
  Grid2X2,
  Layout,
  Megaphone,
  Package,
  PlayCircle,
  Sparkles,
} from "lucide-react";

import type {
  BuilderFieldConfig,
  BuilderPropValue,
  BuilderSectionMeta,
  BuilderSectionStyle,
  BuilderSectionType,
  BuilderViewport,
} from "./builder-types";
import {
  GENERIC_DEFAULT_PROPS,
  GENERIC_FIELDS,
  GENERIC_META,
} from "./blocks/block-defs";

export const BUILDER_VIEWPORTS: Record<
  BuilderViewport,
  { label: string; widthClass: string }
> = {
  desktop: { label: "Escritorio", widthClass: "w-full max-w-[1320px]" },
  tablet: { label: "Tablet", widthClass: "w-full max-w-[840px]" },
  mobile: { label: "Móvil", widthClass: "w-full max-w-[390px]" },
};

const DATA_SECTION_META: Partial<Record<BuilderSectionType, BuilderSectionMeta>> = {
  header: {
    label: "Header",
    description: "Navegación principal de la tienda",
    category: "Estructura",
    icon: Layout,
    colorClass: "text-rose-500",
  },
  banner: {
    label: "Top Info Bar",
    description: "Barra superior informativa del sitio",
    category: "Estructura",
    icon: Megaphone,
    colorClass: "text-amber-500",
  },
  hero: {
    label: "Hero",
    description: "Imagen principal con mensaje y llamada a la acción",
    category: "Estructura",
    icon: Sparkles,
    colorClass: "text-violet-500",
  },
  categories: {
    label: "Categorías",
    description: "Bloque de categorías destacadas",
    category: "Catálogo",
    icon: Grid2X2,
    colorClass: "text-sky-500",
  },
  product_grid: {
    label: "Productos",
    description: "Listado visual de productos",
    category: "Catálogo",
    icon: Package,
    colorClass: "text-emerald-500",
  },
  carousel: {
    label: "Testimonios",
    description: "Opiniones de clientes destacadas",
    category: "Media",
    icon: PlayCircle,
    colorClass: "text-indigo-500",
  },
  footer: {
    label: "Footer",
    description: "Enlaces y cierre de página",
    category: "Estructura",
    icon: AlignJustify,
    colorClass: "text-slate-500",
  },
};

const DATA_DEFAULT_PROPS: Partial<
  Record<BuilderSectionType, Record<string, BuilderPropValue>>
> = {
  header: {
    brand: "Compralo",
    nav_1: "Inicio",
    nav_2: "Productos",
    nav_3: "Descuentos",
    nav_4: "Contacto",
    search_placeholder: "Buscar productos...",
  },
  banner: {
    text: "Envíos gratis en compras sobre $50.000",
  },
  hero: {
    title: "Descubre las ofertas especiales",
    subtitle: "Descubre productos increíbles a precios imbatibles. Calidad garantizada en cada compra.",
    cta_text: "Ver productos",
    cta_link: "/coleccion",
    image: "",
  },
  categories: {
    title: "Categorías",
    columns: 3,
  },
  product_grid: {
    title: "Productos destacados",
    columns: 4,
  },
  carousel: {
    title: "Lo que dicen nuestros clientes",
    quote_1: "Excelente experiencia, entrega muy rápida y todo tal como esperaba.",
    author_1: "María P.",
    quote_2: "La calidad es buenísima y la atención fue impecable en todo momento.",
    author_2: "Carlos G.",
    quote_3: "Precios justos y una tienda fácil de usar. Definitivamente volveré a comprar.",
    author_3: "Andrea R.",
  },
  footer: {
    copyright: "© Compralo. Todos los derechos reservados.",
  },
};

const DATA_FIELDS: Partial<Record<BuilderSectionType, BuilderFieldConfig[]>> = {
  header: [
    { key: "brand", label: "Marca", type: "text" },
    { key: "nav_1", label: "Navegación 1", type: "text" },
    { key: "nav_2", label: "Navegación 2", type: "text" },
    { key: "nav_3", label: "Navegación 3", type: "text" },
    { key: "nav_4", label: "Navegación 4", type: "text" },
    { key: "search_placeholder", label: "Placeholder búsqueda", type: "text" },
  ],
  banner: [{ key: "text", label: "Texto", type: "text" }],
  hero: [
    { key: "title", label: "Título", type: "text" },
    { key: "subtitle", label: "Subtítulo", type: "text" },
    { key: "cta_text", label: "Texto del botón", type: "text" },
    { key: "cta_link", label: "Ruta del botón", type: "text" },
    { key: "image", label: "Imagen principal", type: "image" },
  ],
  categories: [
    { key: "title", label: "Título", type: "text" },
    { key: "columns", label: "Columnas", type: "number" },
  ],
  product_grid: [
    { key: "title", label: "Título", type: "text" },
    { key: "columns", label: "Columnas", type: "number" },
  ],
  carousel: [
    { key: "title", label: "Título", type: "text" },
    { key: "quote_1", label: "Testimonio 1", type: "text" },
    { key: "author_1", label: "Autor 1", type: "text" },
    { key: "quote_2", label: "Testimonio 2", type: "text" },
    { key: "author_2", label: "Autor 2", type: "text" },
    { key: "quote_3", label: "Testimonio 3", type: "text" },
    { key: "author_3", label: "Autor 3", type: "text" },
  ],
  footer: [{ key: "copyright", label: "Copyright", type: "text" }],
};

// Maps finales = secciones data-driven + biblioteca de bloques genéricos.
export const BUILDER_SECTION_META = {
  ...DATA_SECTION_META,
  ...GENERIC_META,
} as Record<BuilderSectionType, BuilderSectionMeta>;

export const BUILDER_DEFAULT_PROPS = {
  ...DATA_DEFAULT_PROPS,
  ...GENERIC_DEFAULT_PROPS,
} as Record<BuilderSectionType, Record<string, BuilderPropValue>>;

export const BUILDER_FIELDS = {
  ...DATA_FIELDS,
  ...GENERIC_FIELDS,
} as Record<BuilderSectionType, BuilderFieldConfig[]>;

export function createDefaultStyle(): BuilderSectionStyle {
  return {
    bgColor: "transparent",
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0,
    marginBottom: 0,
    align: "left",
  };
}
