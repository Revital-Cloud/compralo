import type { Metadata } from "next"
import Link from "next/link"
import { HelpCircle, Mail } from "lucide-react"
import { buildOpenGraph, buildTwitter } from "@/lib/seo"

const MOCK_FAQS = [
  {
    id: "1",
    pregunta: "¿Cómo realizo un pedido?",
    respuesta: "Añade productos al carrito, ve a finalizar compra y completa tus datos y forma de pago. Recibirás un email de confirmación con el número de pedido.",
  },
  {
    id: "2",
    pregunta: "¿Cuáles son los plazos de entrega?",
    respuesta: "Depende de tu ubicación. En capitales suele ser de 2 a 5 días hábiles; en otras zonas puede extenderse según el operador logístico.",
  },
  {
    id: "3",
    pregunta: "¿Puedo cambiar o devolver un producto?",
    respuesta: "Sí. Tienes hasta 30 días desde la recepción para solicitar devolución en productos que cumplan las condiciones. Revisa la sección Devoluciones.",
  },
  {
    id: "4",
    pregunta: "¿Cómo contacto a soporte?",
    respuesta: "Puedes escribirnos a contacto@compralo.com o usar el formulario en la página de Contacto. Atención al cliente de lunes a viernes.",
  },
]

export const generateMetadata = (): Metadata => {
  const title = "Centro de ayuda"
  const description =
    "Resuelve dudas frecuentes sobre pedidos, envíos, devoluciones y soporte en el Centro de Ayuda de Compralo."

  return {
    title,
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      pathname: "/ayuda",
    }),
    twitter: buildTwitter({
      title,
      description,
    }),
  }
}

export default function HelpCenterPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
        <HelpCircle className="h-8 w-8 text-[#ec2538] dark:text-red-400" />
        Centro de Ayuda
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Preguntas frecuentes y recursos (contenido de ejemplo).
      </p>

      <ul className="space-y-6 mb-10">
        {MOCK_FAQS.map((faq) => (
          <li
            key={faq.id}
            className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {faq.pregunta}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{faq.respuesta}</p>
          </li>
        ))}
      </ul>

      <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center gap-3">
        <Mail className="h-5 w-5 text-[#ec2538] dark:text-red-400 shrink-0" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ¿No encuentras lo que buscas? Escríbenos a{" "}
          <a href="mailto:contacto@compralo.com" className="text-[#ec2538] dark:text-red-400 hover:underline">
            contacto@compralo.com
          </a>
        </p>
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
