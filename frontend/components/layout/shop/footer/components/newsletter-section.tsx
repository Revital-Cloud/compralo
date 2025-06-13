"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface NewsletterSectionProps {
  onSubscribe?: (email: string) => void
}

const NewsletterSection: React.FC<NewsletterSectionProps> = ({ onSubscribe }) => {
  const [email, setEmail] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      onSubscribe?.(email)
      setEmail("")
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 py-8 sm:py-12">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold mb-2 leading-tight">
          ÚNETE A NUESTRO CLUB VIP Y OBTÉN 15% DE DESCUENTO
        </h2>
        <p className="text-blue-100 dark:text-blue-200 mb-4 sm:mb-6 text-sm sm:text-base">
          Regístrate gratis y únete a la comunidad
        </p>
        <form onSubmit={handleSubmit} className="max-w-sm sm:max-w-md mx-auto flex flex-col sm:flex-row gap-3 sm:gap-2">
          <Input
            type="email"
            placeholder="Dirección de email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-blue-100 dark:placeholder:text-blue-200 flex-1 h-11 sm:h-10"
            required
          />
          <Button 
            type="submit"
            className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-blue-600 dark:text-white px-6 h-11 sm:h-10 font-medium transition-colors"
          >
            ENVIAR
          </Button>
        </form>
      </div>
    </div>
  )
}

export default NewsletterSection 