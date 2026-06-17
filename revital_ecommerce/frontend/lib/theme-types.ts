// Tipos compartidos del Theme global + chrome (espejo de schemas/theme_schema.py).
// Solo tipos (sin runtime) para que los puedan usar tanto utilidades server-side
// como el servicio cliente sin arrastrar dependencias.

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  dark_background: string;
  dark_foreground: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
}

export interface ThemeTokens {
  colors: ThemeColors;
  radius: string;
  fonts: ThemeFonts;
  logo_url: string | null;
}

export interface NavItem {
  text: string;
  href: string;
}

export interface HeaderConfig {
  brand: string;
  nav: NavItem[];
}

export interface FooterLink {
  text: string;
  href: string;
}

export interface FooterConfig {
  copyright: string;
  links: FooterLink[];
}

export interface SiteTheme {
  theme: ThemeTokens;
  header: HeaderConfig;
  footer: FooterConfig;
}

export interface SiteThemeDetail extends SiteTheme {
  status: "published" | "draft";
  num_version: number;
  has_published: boolean;
}
