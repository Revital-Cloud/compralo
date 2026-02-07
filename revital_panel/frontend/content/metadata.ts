// Metadatos SEO y configuración de páginas

import { Metadata } from "next";
import { siteConfig } from "./config";

export const defaultMetadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "ecommerce",
    "tienda online",
    "colombia",
    "wompi",
    "pagos online",
    "plataforma ecommerce",
    "venta online",
    "cms headless",
    "analytics",
    "stripe",
    "paypal",
  ],
  authors: [{ name: "Revital Team" }],
  creator: "Revital",
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
      {
        url: `${siteConfig.url}/logo.webp`,
        width: 512,
        height: 512,
        alt: "Revital Logo",
        type: "image/webp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage, `${siteConfig.url}/logo.webp`],
    creator: "@revital",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
    yandex: "yandex-verification-code",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.webp", type: "image/webp", sizes: "512x512" },
    ],
    apple: [{ url: "/logo.webp", sizes: "180x180", type: "image/webp" }],
  },
  manifest: `${siteConfig.url}/manifest.json`,
};

export const pageMetadata = {
  home: {
    title: "Revital - Plataforma E-commerce Todo-en-Uno para Colombia",
    description:
      "Crea y gestiona tu tienda online con Revital. Integración nativa con Wompi, panel de estadísticas en tiempo real, CMS headless y más. Comienza gratis.",
    keywords: [
      "ecommerce colombia",
      "tienda online",
      "wompi",
      "plataforma ecommerce",
    ],
  },
  pricing: {
    title: "Precios - Planes que se adaptan a tu negocio",
    description:
      "Descubre nuestros planes de precios. Comienza gratis con el plan Emprendedor o escala con nuestros planes Profesional y Enterprise.",
    keywords: ["precios revital", "planes ecommerce", "costo tienda online"],
  },
  features: {
    title: "Características - Todo lo que necesitas para vender online",
    description:
      "Panel de estadísticas, gestor de productos, integración Wompi, CMS headless y más características diseñadas para el mercado colombiano.",
    keywords: [
      "características ecommerce",
      "funcionalidades tienda online",
      "wompi integration",
    ],
  },
  security: {
    title: "Seguridad - Protección de Nivel Empresarial",
    description:
      "Tu tienda está protegida con SSL, cumplimiento PCI DSS, backups automáticos y monitoreo 24/7.",
    keywords: ["seguridad ecommerce", "ssl", "pci dss", "protección datos"],
  },
};

export const structuredData = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+57-1-234-5678",
      contactType: "customer service",
      availableLanguage: "Spanish",
    },
    sameAs: [
      siteConfig.links.twitter,
      siteConfig.links.linkedin,
      siteConfig.links.github,
    ],
  },

  softwareApplication: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    description: siteConfig.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      priceValidUntil: "2025-12-31",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
    },
  },

  faq: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Cómo funciona la integración con Wompi?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nuestra integración con Wompi incluye procesamiento de pagos con tarjetas de crédito/débito, PSE, Nequi y otros métodos populares en Colombia. Configuración automática de webhooks, manejo de estados de pago y reconciliación automática.",
        },
      },
      {
        "@type": "Question",
        name: "¿Cómo funciona el CMS?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nuestro CMS visual básico te permite crear páginas personalizadas, blog posts, landing pages y conectar con cualquier frontend. Ideal para desarrolladores que quieren flexibilidad total.",
        },
      },
    ],
  },
};
