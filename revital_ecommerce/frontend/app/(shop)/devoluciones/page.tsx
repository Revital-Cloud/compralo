import type { Metadata } from "next"
import Link from "next/link"
import { RotateCcw, Clock, Package } from "lucide-react"
import { buildOpenGraph, buildTwitter } from "@/lib/seo"

const MOCK = {
  titulo: "Devoluciones",
  plazo: "30 días desde la recepción del producto.",
  condiciones: [
    "El producto debe estar sin usar, en su empaque original y con etiquetas.",
    "Incluir factura o comprobante de compra.",
    "Algunos productos (higiene, electrónica abierta) pueden tener restricciones.",
  ],
  pasos: [
    { paso: 1, texto: "Contacta a atención al cliente indicando número de pedido y motivo." },
    { paso: 2, texto: "Te enviaremos una etiqueta o instrucciones para el envío de vuelta." },
    { paso: 3, texto: "Empaca el producto y entrégalo al mensajero o en el punto indicado." },
    { paso: 4, texto: "Tras la revisión, el reembolso se procesará en 5-10 días hábiles." },
  ],
  reembolso: "El reembolso se hará por el mismo medio de pago utilizado en la compra.",
}

export const generateMetadata = (): Metadata => {
  const title = "Política de devoluciones"
  const description =
    "Consulta los plazos, condiciones y pasos para solicitar devoluciones y reembolsos en Compralo."

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
      pathname: "/devoluciones",
    }),
    twitter: buildTwitter({
      title,
      description,
    }),
  }
}

export default function ReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
        <RotateCcw className="h-8 w-8 text-[#ec2538] dark:text-red-400" />
        {MOCK.titulo}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Política y proceso de devoluciones (información de ejemplo).
      </p>

      <div className="mb-10 flex items-start gap-3 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
        <Clock className="h-6 w-6 text-[#ec2538] dark:text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Plazo para devoluciones</p>
          <p className="text-gray-600 dark:text-gray-400">{MOCK.plazo}</p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Condiciones</h2>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
          {MOCK.condiciones.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[#ec2538] dark:text-red-400">•</span>
              {c}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" /> Proceso en 4 pasos
        </h2>
        <ol className="space-y-3">
          {MOCK.pasos.map((p) => (
            <li key={p.paso} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ec2538] dark:bg-red-500 text-white text-sm font-semibold">
                {p.paso}
              </span>
              <span className="text-gray-600 dark:text-gray-400 pt-0.5">{p.texto}</span>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">{MOCK.reembolso}</p>

      <Link
        href="/"
        className="inline-flex items-center text-[#ec2538] dark:text-red-400 hover:underline font-medium"
      >
        ← Volver al inicio
      </Link>
    </div>
  )
}
