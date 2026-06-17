import type { SiteTheme } from "@/lib/theme-types";

// Theme por defecto (espejo de services/theme_service.default_theme en backend).
export const DEFAULT_THEME: SiteTheme = {
  theme: {
    colors: {
      primary: "#ec2538",
      secondary: "#fec806",
      accent: "#FF8C00",
      background: "#F5F5F5",
      foreground: "#000000",
      dark_background: "#0b1220",
      dark_foreground: "#FFFFFF",
    },
    radius: "0.625rem",
    fonts: { heading: "Geist", body: "Geist" },
    logo_url: null,
  },
  header: {
    brand: "Compralo",
    nav: [
      { text: "Inicio", href: "/" },
      { text: "Productos", href: "/products" },
      { text: "Categorías", href: "/categories" },
      { text: "Contacto", href: "/contacto" },
    ],
  },
  footer: {
    copyright: "© Compralo. Todos los derechos reservados.",
    links: [],
  },
};

// Fuentes que se cargan vía Google Fonts cuando el theme las selecciona.
// "Geist" ya viene cargada por next/font, así que no necesita <link>.
const GOOGLE_FONTS = new Set([
  "Inter",
  "Poppins",
  "Roboto",
  "Montserrat",
  "Lato",
  "Open Sans",
  "Nunito",
  "Raleway",
  "Work Sans",
]);

export function fontHref(family: string): string | null {
  if (!family || family === "Geist" || !GOOGLE_FONTS.has(family)) return null;
  const fam = family.trim().replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${fam}:wght@400;500;600;700;800&display=swap`;
}

/** Convierte un hex (#rgb o #rrggbb) a canales "R G B" para usar con alpha. */
export function hexToRgbChannels(hex: string): string {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((ch) => ch + ch).join("");
  if (h.length !== 6) return "0 0 0";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return "0 0 0";
  return `${r} ${g} ${b}`;
}

/** family CSS válido para font-family (con comillas si tiene espacios + fallback). */
function fontStack(family: string): string {
  if (!family || family === "Geist") return "var(--font-geist-sans), system-ui, sans-serif";
  const quoted = /\s/.test(family) ? `"${family}"` : family;
  return `${quoted}, var(--font-geist-sans), system-ui, sans-serif`;
}

/**
 * Genera el CSS (texto plano para un <style>) que sobreescribe las variables del
 * sitio a partir del theme publicado: tokens de marca, tokens shadcn (light/dark),
 * radius y tipografía. Se inyecta en el layout para que el theme aplique a todo el
 * sitio sin tocar componentes.
 */
export function themeToCssText(site: SiteTheme): string {
  const c = site.theme.colors;
  const body = fontStack(site.theme.fonts?.body || "Geist");
  const radius = site.theme.radius || "0.625rem";

  // Se usan selectores de mayor especificidad (html:root / html.dark) para que el
  // override gane sin depender del orden de las hojas de estilo. La clase
  // `font-sans` del body ya consume var(--font-sans), por eso basta con redefinirla.
  const rootVars = [
    `--brand-primary:${c.primary}`,
    `--brand-secondary:${c.secondary}`,
    `--brand-accent:${c.accent}`,
    `--brand-primary-rgb:${hexToRgbChannels(c.primary)}`,
    `--brand-secondary-rgb:${hexToRgbChannels(c.secondary)}`,
    `--brand-accent-rgb:${hexToRgbChannels(c.accent)}`,
    `--primary:${c.primary}`,
    `--secondary:${c.secondary}`,
    `--accent:${c.accent}`,
    `--ring:${c.primary}`,
    `--background:${c.background}`,
    `--foreground:${c.foreground}`,
    `--radius:${radius}`,
    `--font-sans:${body}`,
  ].join(";");

  const darkVars = [
    `--background:${c.dark_background}`,
    `--foreground:${c.dark_foreground}`,
  ].join(";");

  return `html:root{${rootVars}}html.dark{${darkVars}}`;
}
