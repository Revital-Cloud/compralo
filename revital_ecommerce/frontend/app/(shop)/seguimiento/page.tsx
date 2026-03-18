"use client"

import Link from "next/link"
import { Package, Search } from "lucide-react"

const MOCK = {
  titulo: "Seguir Pedido",
  descripcion: "Consulta el estado de tu envío con el número de pedido y tu email.",
  pasos: [
    "Ingresa el número de pedido (ej: ORD-2025-001234).",
    "Ingresa el email con el que realizaste la compra.",
    "Haz clic en Buscar para ver el estado y la trazabilidad.",
  ],
  estados: [
    { id: "1", nombre: "Recibido", desc: "Pedido confirmado y en preparación." },
    { id: "2", nombre: "En camino", desc: "Tu pedido ha salido de nuestro almacén." },
    { id: "3", nombre: "En reparto", desc: "El mensajero está en camino a tu dirección." },
    { id: "4", nombre: "Entregado", desc: "Pedido entregado correctamente." },
  ],
  nota: "Si tienes problemas con el seguimiento, contacta a soporte con tu número de pedido.",
}

export default function OrderTrackingPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
        <Package className="h-8 w-8 text-[#ec2538] dark:text-red-400" />
        {MOCK.titulo}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        {MOCK.descripcion}
      </p>

      <div className="mb-10 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <p className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Search className="h-5 w-5" /> Cómo consultar (ejemplo)
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
          {MOCK.pasos.map((paso, i) => (
            <li key={i}>{paso}</li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
          Formulario de consulta en desarrollo. Mientras tanto revisa el correo con el número de seguimiento.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Estados del pedido</h2>
        <ul className="space-y-3">
          {MOCK.estados.map((e) => (
            <li key={e.id} className="flex gap-3">
              <span className="font-medium text-[#ec2538] dark:text-red-400 shrink-0">{e.nombre}:</span>
              <span className="text-gray-600 dark:text-gray-400">{e.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">{MOCK.nota}</p>

      <Link
        href="/"
        className="inline-flex items-center text-[#ec2538] dark:text-red-400 hover:underline font-medium"
      >
        ← Volver al inicio
      </Link>
    </div>
  )
}

