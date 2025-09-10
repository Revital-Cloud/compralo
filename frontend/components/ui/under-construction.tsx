"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, Mail, Wrench, Hammer, Construction, HardHat, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface UnderConstructionProps {
  title?: string
  description?: string
  estimatedDate?: string
  showNewsletter?: boolean
  showBackButton?: boolean
  showHomeButton?: boolean
  className?: string
}

export function UnderConstruction({
  title = "EN CONSTRUCCIÓN",
  description = "Estamos trabajando duro para traerte una experiencia increíble. Mientras tanto, explora nuestros productos y mantente al día con las últimas novedades.",
  estimatedDate = "Próximamente Disponible",
  showNewsletter = true,
  showBackButton = true,
  showHomeButton = true,
  className = ""
}: UnderConstructionProps) {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubscribed(true)
      setEmail("")
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 ${className}`}>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Title */}
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {title}
          </h2>

          {/* Description */}
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>

          {/* Construction Icon */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-100 dark:bg-orange-900 rounded-full mb-6">
              <Construction className="h-12 w-12 text-orange-600" />
            </div>
            <div className="text-sm font-semibold text-orange-600 bg-orange-100 dark:bg-orange-900 px-4 py-2 rounded-full inline-block">
              {estimatedDate}
            </div>
          </div>

          {/* CTA Button */}
          <div className="mb-12">
            <Button 
              size="lg" 
              className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Explorar Productos
            </Button>
          </div>

          {/* Newsletter Subscription */}
          {showNewsletter && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md mx-auto border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  ¡Mantente Informado!
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Te notificaremos cuando esta página esté lista
                </p>
              </div>
              
              {!isSubscribed ? (
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Tu email"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-orange-500 focus:outline-none text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold"
                  >
                    Notificarme
                  </Button>
                </form>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">✓</span>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    ¡Perfecto!
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Te notificaremos por email cuando esté lista.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            {showHomeButton && (
              <Button asChild variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Ir al Inicio
                </Link>
              </Button>
            )}
            {showBackButton && (
              <Button 
                variant="outline"
                onClick={() => window.history.back()}
                className="border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver Atrás
              </Button>
            )}
          </div>

          {/* Additional Links */}
          <div className="mt-8 flex flex-col sm:flex-row gap-6 justify-center text-sm">
            <Link href="/productos" className="text-gray-500 hover:text-orange-500 transition-colors">
              Explorar Productos
            </Link>
            <Link href="/contacto" className="text-gray-500 hover:text-orange-500 transition-colors">
              <Mail className="inline h-4 w-4 mr-1" />
              Contactar Soporte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
