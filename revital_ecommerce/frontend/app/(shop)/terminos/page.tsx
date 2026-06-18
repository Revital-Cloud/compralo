import Link from "next/link"
import { getSectionById } from "@/components/chatbot-widget/chatbot-menu-content"
import { managedPageMetadata } from "@/lib/cms-page"
import { getPublishedPage } from "@/lib/builder-public"
import { BuilderStorefrontRenderer } from "@/components/builder/storefront/page-renderer"

export const generateMetadata = () =>
  managedPageMetadata("terminos", { title: "Términos y condiciones", description: "Lee los términos y condiciones de uso del sitio y las compras realizadas en Compralo.", pathname: "/terminos" })

function TerminosPageStatic() {
  const section = getSectionById("terminos")
  const title = section?.title ?? "Términos y Condiciones"
  const content = section?.content ?? ""

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        {title}
      </h1>
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <div className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
          {content}
        </div>
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

export default async function TerminosPage() {
  const page = await getPublishedPage("terminos")
  if (page) {
    return (
      <div className="py-8 md:py-10">
        <BuilderStorefrontRenderer sections={page.sections} />
      </div>
    )
  }
  return <TerminosPageStatic />
}
