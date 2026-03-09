"use client"

import { useState } from "react"
import { Button } from "@/components/ui"
import { X, Cookie, Shield, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCookies } from "@/hooks/use-cookies"

interface CookieBannerProps {
  className?: string
}

export function CookieBanner({ className }: CookieBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { 
    cookieConsent, 
    acceptAllCookies, 
    acceptNecessaryOnly, 
    updateCookiePreferences,
    isHydrated,
    checkCookiesInRealTime
  } = useCookies()

  // No mostrar nada hasta que esté hidratado para evitar diferencias SSR
  if (!isHydrated) {
    return null
  }

  // Verificar cookies en tiempo real para mostrar/ocultar el banner
  const realTimeCookies = checkCookiesInRealTime()
  
  // Si las cookies ya están aceptadas y NO estamos en la vista expandida de configuración,
  // ocultar el banner. Mientras esté expandido, permitimos seguir ajustando toggles sin cerrar.
  if (!isExpanded && realTimeCookies?.accepted) {
    return null
  }

  const preferences = cookieConsent?.preferences ?? {
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  }

  const handleToggleOptional = (type: "functional" | "analytics" | "marketing") => {
    updateCookiePreferences({
      [type]: !preferences[type],
    })
  }

  const handleAcceptAll = () => {
    acceptAllCookies()
    // El banner se ocultará automáticamente por el estado reactivo
  }

  const handleAcceptNecessary = () => {
    acceptNecessaryOnly()
    // El banner se ocultará automáticamente por el estado reactivo
  }

  const openCookieSettings = () => {
    setIsExpanded(true)
  }

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl",
      className
    )}>
      <div className="container mx-auto px-4 py-4">
        {!isExpanded ? (
          // Vista principal del banner
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 mt-1">
                <Cookie className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  🍪 Utilizamos cookies para mejorar tu experiencia
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Usamos cookies esenciales para el funcionamiento del sitio y opcionales para análisis y personalización. 
                  Al continuar navegando, aceptas nuestro uso de cookies.
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Shield className="w-4 h-4" />
                  <span>Tu privacidad es importante para nosotros</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={handleAcceptAll}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                Aceptar todas
              </Button>
              <Button
                onClick={handleAcceptNecessary}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                Solo necesarias
              </Button>
              <Button
                onClick={openCookieSettings}
                variant="ghost"
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar
              </Button>
            </div>
          </div>
        ) : (
          // Vista expandida con configuraciones detalladas
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configuración de Cookies
              </h3>
              <Button
                onClick={() => setIsExpanded(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid gap-4 text-sm">
              {/* Cookies Necesarias */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Cookies Necesarias</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Esenciales para el funcionamiento del sitio (login, carrito, etc.)
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-green-600 dark:text-green-400 font-medium mr-3">Siempre activas</span>
                  <div className="w-10 h-6 bg-green-500 rounded-full flex items-center justify-end p-1">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Cookies Funcionales */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Cookies Funcionales</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Mejoran la funcionalidad y personalización
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 font-medium mr-3">Opcional</span>
                  <button
                    type="button"
                    onClick={() => handleToggleOptional("functional")}
                    className={cn(
                      "w-10 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors",
                      preferences.functional
                        ? "bg-blue-500 justify-end"
                        : "bg-gray-300 justify-start hover:bg-gray-400"
                    )}
                    aria-label="Alternar cookies funcionales"
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              </div>

              {/* Cookies Analíticas */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Cookies Analíticas</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Nos ayudan a entender cómo usas el sitio
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 font-medium mr-3">Opcional</span>
                  <button
                    type="button"
                    onClick={() => handleToggleOptional("analytics")}
                    className={cn(
                      "w-10 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors",
                      preferences.analytics
                        ? "bg-blue-500 justify-end"
                        : "bg-gray-300 justify-start hover:bg-gray-400"
                    )}
                    aria-label="Alternar cookies analíticas"
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              </div>

              {/* Cookies de Marketing */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Cookies de Marketing</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Para mostrar anuncios relevantes
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 font-medium mr-3">Opcional</span>
                  <button
                    type="button"
                    onClick={() => handleToggleOptional("marketing")}
                    className={cn(
                      "w-10 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors",
                      preferences.marketing
                        ? "bg-blue-500 justify-end"
                        : "bg-gray-300 justify-start hover:bg-gray-400"
                    )}
                    aria-label="Alternar cookies de marketing"
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleAcceptNecessary}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                Solo necesarias
              </Button>
              <Button
                onClick={handleAcceptAll}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                Aceptar todas
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
