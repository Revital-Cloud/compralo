import type { Metadata } from "next"
import Link from "next/link"
import { Mail, MapPin, Phone, Clock } from "lucide-react"
import { buildOpenGraph, buildTwitter } from "@/lib/seo"

const MOCK = {
  email: "contacto@compralo.com",
  telefono: "+57 1 234 5678",
  direccion: "Calle 123 #45-67, Bogotá, Colombia",
  horario: "Lunes a Viernes: 8:00 - 18:00 | Sábados: 9:00 - 14:00",
  redes: [
    { nombre: "Facebook", url: "https://www.facebook.com/" },
    { nombre: "Instagram", url: "https://www.instagram.com/" },
  ],
}

export const generateMetadata = (): Metadata => {
  const title = "Contacto | Compralo"
  const description =
    "Ponte en contacto con el equipo de Compralo por email, teléfono o visita nuestras oficinas."

  return {
    title,
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      pathname: "/contacto",
    }),
    twitter: buildTwitter({
      title,
      description,
    }),
  }
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Contacto
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Escríbenos o visítanos cuando quieras.
      </p>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 mb-10">
        <div className="flex gap-3 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
          <Mail className="h-6 w-6 shrink-0 text-[#ec2538] dark:text-red-400" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Email</p>
            <a href={`mailto:${MOCK.email}`} className="text-gray-600 dark:text-gray-400 hover:text-[#ec2538] dark:hover:text-red-400">
              {MOCK.email}
            </a>
          </div>
        </div>
        <div className="flex gap-3 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
          <Phone className="h-6 w-6 shrink-0 text-[#ec2538] dark:text-red-400" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Teléfono</p>
            <a href={`tel:${MOCK.telefono.replace(/\s/g, "")}`} className="text-gray-600 dark:text-gray-400 hover:text-[#ec2538] dark:hover:text-red-400">
              {MOCK.telefono}
            </a>
          </div>
        </div>
        <div className="flex gap-3 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 sm:col-span-2">
          <MapPin className="h-6 w-6 shrink-0 text-[#ec2538] dark:text-red-400" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Dirección</p>
            <p className="text-gray-600 dark:text-gray-400">{MOCK.direccion}</p>
          </div>
        </div>
        <div className="flex gap-3 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 sm:col-span-2">
          <Clock className="h-6 w-6 shrink-0 text-[#ec2538] dark:text-red-400" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Horario de atención</p>
            <p className="text-gray-600 dark:text-gray-400">{MOCK.horario}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
        Formulario de contacto en desarrollo. Mientras tanto usa el email o teléfono.
      </p>

      <Link
        href="/"
        className="inline-flex items-center text-[#ec2538] dark:text-red-400 hover:underline font-medium"
      >
        ← Volver al inicio
      </Link>
    </div>
  )
}
