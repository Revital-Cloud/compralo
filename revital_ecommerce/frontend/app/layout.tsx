import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui"
import { ThemeProvider } from "@/providers/theme-provider"
import { AuthProvider } from "@/providers/auth-provider"
import QueryProvider from "@/providers/query-provider"
import { cn } from "@/lib/utils";
import { RefreshTokenProvider } from "@/components/providers/refresh-token-provider";
import { getPublicSiteOrigin } from "@/utils/url-helpers";
import { getPublishedTheme } from "@/lib/theme-public";
import { DEFAULT_THEME, fontHref, themeToCssText } from "@/lib/theme-css";

/**
 * Fuentes principales del sitio:
 * - Se exponen como variables CSS para usarlas desde clases utilitarias.
 * - `display: "swap"` evita texto invisible durante la carga de la fuente.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["monospace"],
});

const siteOrigin = getPublicSiteOrigin();
const siteName = "Compralo";

// Metadata global para SEO y social sharing. El nombre del sitio (título, OG, etc.)
// proviene del Theme global publicado (header.brand); cae a "Compralo" si no hay theme.
export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublishedTheme();
  const name = site?.header?.brand?.trim() || siteName;
  const description =
    `${name} es tu tienda online para descubrir y comprar productos de múltiples categorías con envíos rápidos y seguros.`;

  return {
    title: {
      default: name,
      template: `%s | ${name}`,
    },
    description,
    metadataBase: new URL(siteOrigin),
    openGraph: {
      title: name,
      description,
      type: "website",
      url: siteOrigin,
      siteName: name,
      locale: "es_ES",
      images: [
        {
          url: "/api/og",
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
    },
  };
}

const apiOrigin = (() => {
  // Normaliza el origen de la API para habilitar preconnect sin arrastrar rutas.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const url = new URL(apiUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "http://localhost:8000";
  }
})();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Theme global publicado (CMS Builder). Si no hay nada publicado o el backend
  // no responde, se usa el theme por defecto: el sitio nunca queda sin estilos.
  const site = (await getPublishedTheme()) ?? DEFAULT_THEME;
  const themeCss = themeToCssText(site);
  const themeFontHref = fontHref(site.theme.fonts?.body);

  const brand = site.header?.brand?.trim() || siteName;

  // JSON-LD del sitio para mejorar resultados enriquecidos en buscadores.
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand,
    url: siteOrigin,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteOrigin}/products?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand,
    url: siteOrigin,
    logo: site.theme?.logo_url?.trim() || `${siteOrigin}/favicon.ico`,
  };

  return (
    <html lang="es" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Preconexiones para reducir latencia de handshake en recursos externos */}
        <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {themeFontHref ? <link rel="stylesheet" href={themeFontHref} /> : null}
        {/* Variables del Theme global: se inyectan al final del <head> para que
            tengan prioridad sobre globals.css (además usan html:root/html.dark). */}
        <style
          id="theme-vars"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background text-foreground font-sans antialiased transition-colors duration-300",
          geistSans.variable,
          geistMono.variable
        )}
        suppressHydrationWarning={true}
      >
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <RefreshTokenProvider>
                {children}
                <Toaster richColors />
              </RefreshTokenProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
} 
