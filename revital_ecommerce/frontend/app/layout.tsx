import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui"
import { ThemeProvider } from "@/providers/theme-provider"
import { AuthProvider } from "@/providers/auth-provider"
import QueryProvider from "@/providers/query-provider"
import { cn } from "@/lib/utils";
import { RefreshTokenProvider } from "@/components/providers/refresh-token-provider";

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

const siteOrigin = (() => {
  const rawUrl =
    process.env.NEXT_PUBLIC_CUSTOM_DOMAIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://compralo.revital.cloud";
  try {
    const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const parsed = new URL(normalized);
    parsed.protocol = "https:";
    return parsed.origin;
  } catch {
    return "https://compralo.com";
  }
})();

export const metadata: Metadata = {
  title: "Compralo",
  description: "Compralo",
  metadataBase: new URL(siteOrigin),
  openGraph: {
    title: "Compralo",
    description: "Compralo",
    type: "website",
    url: siteOrigin,
  },
  twitter: {
    card: "summary_large_image",
    title: "Compralo",
    description: "Compralo",
  },
};

const apiOrigin = (() => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const url = new URL(apiUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "http://localhost:8000";
  }
})();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
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
