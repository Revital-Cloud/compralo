// Componente deshabilitado: Banner Club VIP comentado
/*
"use client"

import * as React from "react"
import { Input } from "@/components/ui"
import { Button } from "@/components/ui"

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
    <div className="bg-gradient-to-r from-[#ec2538] to-[#FF8C00] dark:from-red-600 dark:to-orange-500 py-8 sm:py-12 transition-colors duration-300">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold mb-2 leading-tight transition-colors duration-300">
          ÚNETE A NUESTRO CLUB VIP Y OBTÉN 15% DE DESCUENTO
        </h2>
        <p className="text-white/90 dark:text-white/95 mb-4 sm:mb-6 text-sm sm:text-base transition-colors duration-300">
          Regístrate gratis y únete a la comunidad
        </p>
        <form onSubmit={handleSubmit} className="max-w-sm sm:max-w-md mx-auto flex flex-col sm:flex-row gap-3 sm:gap-2">
          <Input
            type="email"
            placeholder="Dirección de email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/20 dark:bg-white/25 border-white/30 dark:border-white/40 text-white placeholder:text-white/70 dark:placeholder:text-white/80 flex-1 h-11 sm:h-10 transition-colors duration-300"
            required
          />
          <Button 
            type="submit"
            className="bg-white hover:bg-white/90 dark:bg-white/95 dark:hover:bg-white text-[#ec2538] dark:text-gray-900 px-6 h-11 sm:h-10 font-medium transition-colors duration-300"
          >
            ENVIAR
          </Button>
        </form>
      </div>
    </div>
  )
}

export default NewsletterSection
*/

// Componente temporalmente deshabilitado - retorna null
const NewsletterSection: React.FC<{ onSubscribe?: (email: string) => void }> = () => {
  return null
}

export default NewsletterSection 