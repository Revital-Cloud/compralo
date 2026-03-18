import type { Metadata } from "next"
import Link from "next/link"
import { buildOpenGraph, buildTwitter } from "@/lib/seo"

const MOCK = {
  cifras: [
    { label: "Ventas anuales (ejemplo)", valor: "USD 12.5 M" },
    { label: "Pedidos entregados (ejemplo)", valor: "1.2 M" },
    { label: "Usuarios activos (ejemplo)", valor: "450 K" },
  ],
  mensaje:
    "Los datos mostrados son ilustrativos. Los reportes oficiales y documentación regulatoria estarán disponibles cuando corresponda.",
  contactoSeparado: "Para consultas de inversionistas: inversionistas@compralo.com",
}

export const generateMetadata = (): Metadata => {
  const title = "Información para inversionistas"
  const description =
    "Resumen corporativo y cifras ilustrativas para potenciales inversionistas interesados en Compralo."

  return {
    title,
    description,
    robots: {
      index: false,
      follow: true,
    },
    openGraph: buildOpenGraph({
      title,
      description,
      pathname: "/inversionistas",
    }),
    twitter: buildTwitter({
      title,
      description,
    }),
  }
}

export default function InvestorsPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Información para Inversionistas
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Resumen corporativo y cifras relevantes (datos de ejemplo).
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Cifras destacadas
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {MOCK.cifras.map((c, i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-center"
            >
              <p className="text-2xl font-bold text-[#ec2538] dark:text-red-400">{c.valor}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          {MOCK.mensaje}
        </p>
      </section>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        {MOCK.contactoSeparado}
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

