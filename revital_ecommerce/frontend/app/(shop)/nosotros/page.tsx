"use client"

import Link from "next/link"

const MOCK = {
  nombre: "Compralo",
  fundacion: 2020,
  mision: "Conectar a millones de personas con los productos que necesitan, ofreciendo calidad, precios justos y un servicio excepcional.",
  vision: "Ser la plataforma de e-commerce de referencia en la región, reconocida por la confianza y la experiencia de compra.",
  valores: [
    { titulo: "Confianza", desc: "Construimos relaciones duraderas con clientes y proveedores." },
    { titulo: "Innovación", desc: "Mejoramos constantemente nuestra tecnología y procesos." },
    { titulo: "Compromiso", desc: "Nos responsabilizamos de cada pedido de principio a fin." },
  ],
  equipo: [
    { nombre: "María García", rol: "CEO y cofundadora" },
    { nombre: "Carlos López", rol: "CTO" },
    { nombre: "Ana Martínez", rol: "Directora de Operaciones" },
  ],
}

export default function AboutUsPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Acerca de {MOCK.nombre}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Tu tienda de confianza desde {MOCK.fundacion}.
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
