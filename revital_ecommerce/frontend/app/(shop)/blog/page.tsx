import type { Metadata } from "next"
import Link from "next/link"
import { buildOpenGraph, buildTwitter } from "@/lib/seo"

const MOCK_POSTS = [
  {
    id: "1",
    titulo: "Cómo elegir el mejor producto para tu hogar",
    extracto: "Consejos prácticos para comparar opciones y tomar la mejor decisión de compra.",
    fecha: "2025-02-01",
    autor: "Equipo Compralo",
  },
  {
    id: "2",
    titulo: "Nuevas categorías disponibles en la tienda",
    extracto: "Te presentamos las últimas líneas y sublíneas añadidas a nuestro catálogo.",
    fecha: "2025-01-28",
    autor: "Equipo Compralo",
  },
  {
    id: "3",
    titulo: "Envíos rápidos: cómo lo hacemos",
    extracto: "Detrás de escena de nuestra logística para que recibas tu pedido a tiempo.",
    fecha: "2025-01-15",
    autor: "Equipo Compralo",
  },
]

export const generateMetadata = (): Metadata => {
  const title = "Blog de Compralo"
  const description =
    "Lee noticias, consejos y novedades sobre Compralo, envíos, categorías y experiencia de compra."

  return {
    title,
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      pathname: "/blog",
    }),
    twitter: buildTwitter({
      title,
      description,
    }),
  }
}

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Blog
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Noticias, consejos y novedades de Compralo.
      </p>

      <ul className="space-y-6">
        {MOCK_POSTS.map((post) => (
          <li
            key={post.id}
            className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
          >
            <time className="text-sm text-gray-500 dark:text-gray-500">
              {new Date(post.fecha).toLocaleDateString("es-CO", { dateStyle: "long" })}
            </time>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-1 mb-2">
              {post.titulo}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">{post.extracto}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">{post.autor}</p>
          </li>
        ))}
      </ul>

      <Link
        href="/"
        className="inline-flex items-center mt-8 text-[#ec2538] dark:text-red-400 hover:underline font-medium"
      >
        ← Volver al inicio
      </Link>
    </div>
  )
}
