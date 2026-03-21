import type { Metadata } from "next"
import Link from "next/link"
import { buildOpenGraph, buildTwitter } from "@/lib/seo"

const MOCK_PRESS = [
  {
    id: "1",
    titulo: "Compralo amplía su catálogo con nuevas categorías",
    fecha: "2025-02-05",
    resumen: "La plataforma anuncia la incorporación de líneas y sublíneas en tecnología y hogar para el primer trimestre.",
  },
  {
    id: "2",
    titulo: "Nueva alianza con operadores logísticos para envíos express",
    fecha: "2025-01-20",
    resumen: "Acuerdo con socios de distribución para reducir plazos de entrega en las principales ciudades.",
  },
  {
    id: "3",
    titulo: "Compralo supera el millón de pedidos entregados",
    fecha: "2025-01-10",
    resumen: "Hito de operaciones alcanzado gracias al crecimiento en usuarios y confianza en la plataforma.",
  },
]

export const generateMetadata = (): Metadata => {
  const title = "Sala de prensa"
  const description =
    "Consulta los comunicados y notas de prensa más recientes sobre Compralo."

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
      pathname: "/prensa",
    }),
    twitter: buildTwitter({
      title,
      description,
    }),
  }
}

export default function PressPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Sala de Prensa
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Comunicados y notas de prensa (contenido de ejemplo).
      </p>

      <ul className="space-y-6">
        {MOCK_PRESS.map((item) => (
          <li
            key={item.id}
            className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
          >
            <time className="text-sm text-gray-500 dark:text-gray-500">
              {new Date(item.fecha).toLocaleDateString("es-CO", { dateStyle: "long" })}
            </time>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-1 mb-2">
              {item.titulo}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{item.resumen}</p>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-500">
        Para solicitudes de prensa: contacto@compralo.com (asunto: Prensa).
      </p>

      <Link
        href="/"
        className="inline-flex items-center mt-8 text-[#ec2538] dark:text-red-400 hover:underline font-medium"
      >
        ← Volver al inicio
      </Link>
    </div>
  )
}
