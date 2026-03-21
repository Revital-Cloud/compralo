import type { Metadata } from "next"
import Link from "next/link"
import { buildOpenGraph, buildTwitter } from "@/lib/seo"

const MOCK = {
  titulo: "Política de Cookies",
  ultimaActualizacion: "Febrero 2026",
  intro: "Esta política describe qué son las cookies, cómo las usamos y cómo puedes gestionar tus preferencias.",
  secciones: [
    {
      titulo: "¿Qué son las cookies?",
      contenido: "Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas nuestro sitio. Nos permiten recordar preferencias, mantener tu sesión y mejorar la experiencia de uso.",
    },
    {
      titulo: "Tipos de cookies que utilizamos",
      contenido: "Cookies necesarias: esenciales para el funcionamiento del sitio (inicio de sesión, carrito, seguridad). No se pueden desactivar. Cookies funcionales: mejoran la funcionalidad y personalización. Cookies analíticas: nos ayudan a entender cómo se usa el sitio de forma agregada y anónima. Cookies de marketing: se usan para mostrar anuncios relevantes; solo se activan con tu consentimiento.",
    },
    {
      titulo: "Cómo gestionar tus preferencias",
      contenido: "Puedes aceptar o rechazar cookies opcionales desde el banner que aparece la primera vez que visitas el sitio. En cualquier momento puedes cambiar tu elección desde el footer, en «Configurar Cookies», o revocar el consentimiento desde la misma configuración.",
    },
    {
      titulo: "Derechos y más información",
      contenido: "Tienes derecho a retirar tu consentimiento en cualquier momento. Para más detalles sobre el tratamiento de datos personales asociado al uso de cookies, consulta nuestra Política de Privacidad.",
    },
  ],
}

export const generateMetadata = (): Metadata => {
  const title = "Política de cookies"
  const description =
    "Infórmate sobre el uso de cookies en Compralo, los tipos que utilizamos y cómo gestionar tus preferencias."

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: buildOpenGraph({
      title,
      description,
      pathname: "/cookies",
    }),
    twitter: buildTwitter({
      title,
      description,
    }),
  }
}

export default function CookiesPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {MOCK.titulo}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
        Última actualización: {MOCK.ultimaActualizacion}
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
        {MOCK.intro}
      </p>
      <div className="space-y-8">
        {MOCK.secciones.map((s, i) => (
          <section key={i}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {s.titulo}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {s.contenido}
            </p>
          </section>
        ))}
      </div>
      <Link
        href="/"
        className="inline-flex items-center mt-8 text-[#ec2538] dark:text-red-400 hover:underline font-medium"
      >
        ← Volver al inicio
      </Link>
    </div>
  )
}
