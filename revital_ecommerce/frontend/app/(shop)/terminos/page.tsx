"use client"

import Link from "next/link"
import { getSectionById } from "@/components/chatbot-widget/chatbot-menu-content"

export default function TerminosPage() {
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
        className="inline-flex items-center mt-8 text-[#ec2538] dark:text-red-400 hover:underline font-medium"
      >
        ← Volver al inicio
      </Link>
    </div>
  )
}
