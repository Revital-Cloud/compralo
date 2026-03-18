import type { Metadata } from "next"
import Link from "next/link"
import { buildOpenGraph, buildTwitter } from "@/lib/seo"

const MOCK = {
  titulo: "Accesibilidad",
  ultimaActualizacion: "Febrero 2026",
  intro: "Nos comprometemos a que nuestro sitio sea usable por el mayor número de personas posible, incluidas aquellas con discapacidad o que usan tecnologías de asistencia.",
  secciones: [
    {
      titulo: "Objetivos",
      contenido: "Buscamos cumplir con buenas prácticas de accesibilidad web (WCAG en la medida de lo posible): contenido legible, contraste adecuado, navegación por teclado y compatibilidad con lectores de pantalla.",
    },
    {
      titulo: "Qué hemos implementado",
      contenido: "Estructura de encabezados coherente, textos alternativos en imágenes relevantes, enlaces y botones descriptivos, formularios con etiquetas asociadas y posibilidad de ajustar el tamaño del texto desde el navegador. El sitio es responsive para facilitar su uso en distintos dispositivos.",
    },
    {
      titulo: "Limitaciones conocidas",
      contenido: "Algunas secciones o componentes de terceros pueden no cumplir aún el mismo nivel de accesibilidad. Trabajamos en mejoras continuas. Si encuentras barreras concretas, agradecemos que nos lo indiques por el canal de Contacto.",
    },
    {
      titulo: "Contacto",
      contenido: "Para sugerencias o reportar problemas de accesibilidad, utiliza la página de Contacto o el email indicado en el footer. Tu feedback nos ayuda a mejorar.",
    },
  ],
}

export const generateMetadata = (): Metadata => {
  const title = "Accesibilidad del sitio"
  const description =
    "Conoce el compromiso de Compralo con la accesibilidad web, las medidas implementadas y cómo reportar problemas."

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
      pathname: "/accesibilidad",
    }),
    twitter: buildTwitter({
      title,
      description,
    }),
  }
}

export default function AccesibilidadPage() {
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
