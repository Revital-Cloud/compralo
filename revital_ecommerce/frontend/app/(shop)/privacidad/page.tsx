import Link from "next/link"
import { managedPageMetadata } from "@/lib/cms-page"
import { getPublishedPage } from "@/lib/builder-public"
import { BuilderStorefrontRenderer } from "@/components/builder/storefront/page-renderer"

const MOCK = {
  titulo: "Política de Privacidad",
  ultimaActualizacion: "Febrero 2026",
  intro: "La permanencia en el sistema será entendida como la aceptación de los términos y condiciones de la política de privacidad.",
  secciones: [
    {
      titulo: "Responsable del tratamiento",
      contenido: "El responsable del tratamiento de tus datos personales es la tienda identificada en el sitio (Compralo / titular de la marca). Puedes contactarnos a través de la página de Contacto o al email indicado en el footer.",
    },
    {
      titulo: "Datos que recogemos",
      contenido: "Recopilamos datos de registro (email, nombre, apellidos), datos de perfil, direcciones de envío, historial de pedidos y datos de navegación necesarios para el funcionamiento del sitio. Los datos de pago son procesados exclusivamente por nuestra pasarela de pagos (Wompi); no almacenamos datos de tarjetas ni información financiera sensible.",
    },
    {
      titulo: "Finalidad y base legal",
      contenido: "Utilizamos tus datos para prestar el servicio de compra, gestionar tu cuenta, procesar pedidos, enviar comunicaciones transaccionales (confirmación de registro, órdenes, recuperación de contraseña) y, si lo autorizas, para análisis y marketing. La base legal incluye la ejecución del contrato, el consentimiento y el interés legítimo según la normativa aplicable.",
    },
    {
      titulo: "Derechos del titular",
      contenido: "Tienes derecho a conocer, actualizar, rectificar y suprimir tus datos personales, así como a presentar quejas ante la autoridad de protección de datos. Para ejercer estos derechos, contacta a través del email de la página de Contacto o desde tu perfil de usuario cuando esté disponible la opción.",
    },
    {
      titulo: "Marco legal (Colombia)",
      contenido: "Ley 1581 de 2012 – Protección de Datos Personales; Decreto 1377 de 2013; Decreto 1074 de 2015; Circular Externa 002 de 2015 – SIC.",
    },
  ],
}

export const generateMetadata = () =>
  managedPageMetadata("privacidad", { title: "Política de privacidad", description: "Consulta cómo Compralo trata tus datos personales, qué información recopilamos y cuáles son tus derechos de protección de datos.", pathname: "/privacidad" })

function PrivacidadPageStatic() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {MOCK.titulo}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
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
        className="inline-flex items-center mt-8 text-brand dark:text-brand hover:underline font-medium"
      >
        ← Volver al inicio
      </Link>
    </div>
  )
}

export default async function PrivacidadPage() {
  const page = await getPublishedPage("privacidad")
  if (page) {
    return (
      <div className="py-8 md:py-10">
        <BuilderStorefrontRenderer sections={page.sections} />
      </div>
    )
  }
  return <PrivacidadPageStatic />
}
