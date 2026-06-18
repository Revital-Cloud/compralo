import {
  AlignLeft,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Images,
  LayoutGrid,
  Link2,
  Minus,
  MousePointerClick,
  MoveVertical,
  Type,
} from "lucide-react";

import type {
  BuilderFieldConfig,
  BuilderPropValue,
  BuilderSectionMeta,
  BuilderSectionType,
} from "../builder-types";

/** Tipos de la biblioteca de bloques genéricos (contenido libre y reutilizable). */
export const GENERIC_BLOCK_TYPES: BuilderSectionType[] = [
  "heading",
  "text",
  "richtext",
  "image",
  "image_text",
  "button",
  "cta",
  "features",
  "gallery",
  "faq",
  "spacer",
  "divider",
];

export const GENERIC_BLOCK_TYPE_SET = new Set<string>(GENERIC_BLOCK_TYPES);

export const GENERIC_META: Partial<Record<BuilderSectionType, BuilderSectionMeta>> = {
  heading: { label: "Encabezado", description: "Título destacado", category: "Contenido", icon: Type, colorClass: "text-sky-500" },
  text: { label: "Texto", description: "Párrafo simple", category: "Contenido", icon: AlignLeft, colorClass: "text-slate-500" },
  richtext: { label: "Texto enriquecido", description: "Contenido con formato (Markdown)", category: "Contenido", icon: FileText, colorClass: "text-violet-500" },
  image: { label: "Imagen", description: "Imagen responsive", category: "Contenido", icon: ImageIcon, colorClass: "text-emerald-500" },
  image_text: { label: "Imagen + Texto", description: "Imagen junto a texto", category: "Contenido", icon: Images, colorClass: "text-teal-500" },
  button: { label: "Botón", description: "Botón / enlace de acción", category: "Contenido", icon: Link2, colorClass: "text-indigo-500" },
  cta: { label: "Llamado a la acción", description: "Banda con título y botón", category: "Secciones", icon: MousePointerClick, colorClass: "text-rose-500" },
  features: { label: "Características", description: "Grid de íconos + texto", category: "Secciones", icon: LayoutGrid, colorClass: "text-amber-500" },
  gallery: { label: "Galería", description: "Cuadrícula de imágenes", category: "Secciones", icon: Images, colorClass: "text-fuchsia-500" },
  faq: { label: "Preguntas frecuentes", description: "Acordeón de preguntas", category: "Secciones", icon: HelpCircle, colorClass: "text-cyan-500" },
  spacer: { label: "Espaciador", description: "Espacio vertical", category: "Layout", icon: MoveVertical, colorClass: "text-slate-400" },
  divider: { label: "Separador", description: "Línea divisoria", category: "Layout", icon: Minus, colorClass: "text-slate-400" },
};

const ALIGN_OPTIONS = [
  { value: "left", label: "Izquierda" },
  { value: "center", label: "Centro" },
  { value: "right", label: "Derecha" },
];

export const GENERIC_FIELDS: Partial<Record<BuilderSectionType, BuilderFieldConfig[]>> = {
  heading: [
    { key: "text", label: "Texto", type: "text" },
    { key: "level", label: "Nivel", type: "select", options: [
      { value: "h1", label: "H1 (grande)" },
      { value: "h2", label: "H2" },
      { value: "h3", label: "H3 (pequeño)" },
    ] },
    { key: "align", label: "Alineación", type: "select", options: ALIGN_OPTIONS },
  ],
  text: [
    { key: "text", label: "Texto", type: "textarea" },
    { key: "align", label: "Alineación", type: "select", options: ALIGN_OPTIONS },
  ],
  richtext: [
    { key: "content", label: "Contenido (Markdown)", type: "richtext", help: "Soporta **negrita**, _cursiva_, listas, enlaces y títulos." },
  ],
  image: [
    { key: "src", label: "Imagen", type: "image" },
    { key: "alt", label: "Texto alternativo (alt)", type: "text" },
    { key: "caption", label: "Pie de foto", type: "text" },
    { key: "max_width", label: "Ancho máx. (px, 0 = full)", type: "number" },
    { key: "rounded", label: "Bordes redondeados", type: "boolean" },
  ],
  image_text: [
    { key: "image", label: "Imagen", type: "image" },
    { key: "image_position", label: "Posición de imagen", type: "select", options: [
      { value: "left", label: "Izquierda" },
      { value: "right", label: "Derecha" },
    ] },
    { key: "title", label: "Título", type: "text" },
    { key: "text", label: "Texto", type: "textarea" },
    { key: "cta_text", label: "Texto del botón", type: "text" },
    { key: "cta_link", label: "Enlace del botón", type: "link" },
  ],
  button: [
    { key: "text", label: "Texto", type: "text" },
    { key: "link", label: "Enlace", type: "link" },
    { key: "variant", label: "Estilo", type: "select", options: [
      { value: "primary", label: "Primario (marca)" },
      { value: "secondary", label: "Secundario" },
      { value: "outline", label: "Contorno" },
    ] },
    { key: "align", label: "Alineación", type: "select", options: ALIGN_OPTIONS },
  ],
  cta: [
    { key: "title", label: "Título", type: "text" },
    { key: "subtitle", label: "Subtítulo", type: "textarea" },
    { key: "button_text", label: "Texto del botón", type: "text" },
    { key: "button_link", label: "Enlace del botón", type: "link" },
  ],
  features: [
    { key: "title", label: "Título de sección", type: "text" },
    { key: "columns", label: "Columnas", type: "number" },
    { key: "item_1_icon", label: "Item 1 · ícono (emoji)", type: "text" },
    { key: "item_1_title", label: "Item 1 · título", type: "text" },
    { key: "item_1_text", label: "Item 1 · texto", type: "textarea" },
    { key: "item_2_icon", label: "Item 2 · ícono (emoji)", type: "text" },
    { key: "item_2_title", label: "Item 2 · título", type: "text" },
    { key: "item_2_text", label: "Item 2 · texto", type: "textarea" },
    { key: "item_3_icon", label: "Item 3 · ícono (emoji)", type: "text" },
    { key: "item_3_title", label: "Item 3 · título", type: "text" },
    { key: "item_3_text", label: "Item 3 · texto", type: "textarea" },
    { key: "item_4_icon", label: "Item 4 · ícono (emoji)", type: "text" },
    { key: "item_4_title", label: "Item 4 · título", type: "text" },
    { key: "item_4_text", label: "Item 4 · texto", type: "textarea" },
  ],
  gallery: [
    { key: "title", label: "Título", type: "text" },
    { key: "columns", label: "Columnas", type: "number" },
    { key: "image_1", label: "Imagen 1", type: "image" },
    { key: "image_2", label: "Imagen 2", type: "image" },
    { key: "image_3", label: "Imagen 3", type: "image" },
    { key: "image_4", label: "Imagen 4", type: "image" },
    { key: "image_5", label: "Imagen 5", type: "image" },
    { key: "image_6", label: "Imagen 6", type: "image" },
  ],
  faq: [
    { key: "title", label: "Título", type: "text" },
    { key: "q_1", label: "Pregunta 1", type: "text" },
    { key: "a_1", label: "Respuesta 1", type: "textarea" },
    { key: "q_2", label: "Pregunta 2", type: "text" },
    { key: "a_2", label: "Respuesta 2", type: "textarea" },
    { key: "q_3", label: "Pregunta 3", type: "text" },
    { key: "a_3", label: "Respuesta 3", type: "textarea" },
    { key: "q_4", label: "Pregunta 4", type: "text" },
    { key: "a_4", label: "Respuesta 4", type: "textarea" },
    { key: "q_5", label: "Pregunta 5", type: "text" },
    { key: "a_5", label: "Respuesta 5", type: "textarea" },
  ],
  spacer: [{ key: "height", label: "Alto (px)", type: "number" }],
  divider: [],
};

export const GENERIC_DEFAULT_PROPS: Partial<Record<BuilderSectionType, Record<string, BuilderPropValue>>> = {
  heading: { text: "Tu título aquí", level: "h2", align: "left" },
  text: { text: "Escribe aquí tu contenido. Este bloque de texto es responsive y editable desde el CMS.", align: "left" },
  richtext: { content: "## Subtítulo\n\nEscribe contenido con **Markdown**: listas, [enlaces](/), _cursiva_ y más.\n\n- Punto uno\n- Punto dos" },
  image: { src: "", alt: "", caption: "", max_width: 0, rounded: true },
  image_text: {
    image: "",
    image_position: "left",
    title: "Título de la sección",
    text: "Describe aquí tu propuesta de valor. Este bloque apila imagen y texto en móvil y los pone lado a lado en escritorio.",
    cta_text: "Saber más",
    cta_link: "/products",
  },
  button: { text: "Ver productos", link: "/products", variant: "primary", align: "left" },
  cta: {
    title: "¿Listo para empezar?",
    subtitle: "Descubre nuestra selección y aprovecha las ofertas de hoy.",
    button_text: "Ver tienda",
    button_link: "/products",
  },
  features: {
    title: "¿Por qué elegirnos?",
    columns: 3,
    item_1_icon: "🚚", item_1_title: "Envío rápido", item_1_text: "Entregas en tiempo récord a todo el país.",
    item_2_icon: "🔒", item_2_title: "Compra segura", item_2_text: "Pagos protegidos y datos cifrados.",
    item_3_icon: "⭐", item_3_title: "Calidad garantizada", item_3_text: "Productos seleccionados y con garantía.",
    item_4_icon: "", item_4_title: "", item_4_text: "",
  },
  gallery: { title: "Galería", columns: 3, image_1: "", image_2: "", image_3: "", image_4: "", image_5: "", image_6: "" },
  faq: {
    title: "Preguntas frecuentes",
    q_1: "¿Cuánto tarda el envío?", a_1: "Los envíos llegan entre 2 y 5 días hábiles según tu ubicación.",
    q_2: "¿Puedo devolver un producto?", a_2: "Sí, tienes 30 días para solicitar una devolución.",
    q_3: "¿Qué métodos de pago aceptan?", a_3: "Aceptamos tarjetas, PSE y transferencias.",
    q_4: "", a_4: "",
    q_5: "", a_5: "",
  },
  spacer: { height: 48 },
  divider: {},
};
