import type { Metadata } from "next"
import Link from "next/link"
import { buildOpenGraph, buildTwitter } from "@/lib/seo"

const MOCK = {  
  fundacion: 2026,
  mision:
    "Diseñar y escalar software a medida para startups y empresas que necesitan velocidad sin perder calidad, con comunicación clara y estándares de ingeniería sólidos.",
  vision:
    "Ser el socio técnico de referencia en la región para construir productos digitales confiables, rápidos y mantenibles, con mentalidad de producto global.",
  valores: [
    { titulo: "Claridad", desc: "Sin jerga innecesaria: alcance, riesgos y plazos visibles desde el día uno." },
    { titulo: "Ownership", desc: "Pensamos como socios técnicos y asumimos responsabilidad de principio a fin." },
    { titulo: "Calidad", desc: "Código mantenible, revisable y con foco en rendimiento y experiencia de usuario." },
  ],
  equipo: [
    { nombre: "Alejandro Hernández Lara", rol: "Co-founder · Desarrollo" },
    { nombre: "Kevin Daniel Bermúdez Calderón", rol: "Co-founder · Desarrollo" },
    { nombre: "Jhoan Camilo Suárez Mora", rol: "Co-founder · Desarrollo" },
  ],
}

export const generateMetadata = (): Metadata => {
  const title = "Acerca de Revital"
  const description =
    "Conoce la misión, visión, valores y el equipo detrás de Revital."

  return {
    title,
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      pathname: "/nosotros",
    }),
    twitter: buildTwitter({
      title,
      description,
    }),
  }
}

export default function AboutUsPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Acerca de
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Construyendo productos digitales desde {MOCK.fundacion}.{" "}
        <a
          href="https://revital.cloud/"
          target="_blank"
          rel="noreferrer"
          className="text-[#ec2538] dark:text-red-400 hover:underline font-medium"
        >
          Conoce más en revital.cloud
        </a>
        .
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Nuestra misión</h2>
        <p className="text-gray-600 dark:text-gray-400">{MOCK.mision}</p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Nuestra visión</h2>
        <p className="text-gray-600 dark:text-gray-400">{MOCK.vision}</p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Valores</h2>
        <ul className="space-y-3">
          {MOCK.valores.map((v, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-medium text-[#ec2538] dark:text-red-400 shrink-0">{v.titulo}:</span>
              <span className="text-gray-600 dark:text-gray-400">{v.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Equipo directivo</h2>
        <ul className="space-y-2">
          {MOCK.equipo.map((e, i) => (
            <li key={i} className="text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">{e.nombre}</span> — {e.rol}
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/"
        className="inline-flex items-center text-[#ec2538] dark:text-red-400 hover:underline font-medium"
      >
        ← Volver al inicio
      </Link>
    </div>
  )
}
