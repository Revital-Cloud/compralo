import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { defaultMetadata } from "@/content/metadata";
import QueryProvider from "@/providers/query-provider";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = defaultMetadata;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-revital-black text-black dark:text-white transition-colors overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <QueryProvider>
              {/* Overlay con el patrón de puntos - estará controlado por las clases dark de Tailwind */}
              <div
                className="fixed inset-0 pointer-events-none z-[-1]"
                style={{
                  backgroundImage: `
                    radial-gradient(rgba(209, 213, 219, 0.3) 0.5px, transparent 0.5px)
                  `,
                  backgroundSize: "24px 24px",
                  backgroundAttachment: "fixed",
                }}
              />
              <div
                className="fixed inset-0 pointer-events-none z-[-1] hidden dark:block"
                style={{
                  backgroundImage: `
                    radial-gradient(rgba(75, 85, 99, 0.3) 0.5px, transparent 0.5px)
                  `,
                  backgroundSize: "24px 24px",
                  backgroundAttachment: "fixed",
                }}
              />
              {children}
            </QueryProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
