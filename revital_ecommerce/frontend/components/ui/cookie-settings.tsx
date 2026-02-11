"use client"

import { useState } from "react"
import { Button } from "@/components/ui"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui"
import { Switch } from "@/components/ui"
import { Label } from "@/components/ui"
import { Separator } from "@/components/ui"
import { Settings, Cookie, Shield, BarChart3, Target } from "lucide-react"
import { useCookies, type CookiePreferences } from "@/hooks/use-cookies"

export function CookieSettings() {
  const { cookieConsent, updateCookiePreferences, revokeConsent } = useCookies()
  const [isOpen, setIsOpen] = useState(false)

  const handleToggleCookie = (type: keyof CookiePreferences) => {
    if (!cookieConsent) return
    
    updateCookiePreferences({
      [type]: !cookieConsent.preferences[type]
    })
  }

  const handleRevokeConsent = () => {
    revokeConsent()
    setIsOpen(false)
  }

  if (!cookieConsent) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
          <Settings className="w-4 h-4 mr-2" />
          Configurar Cookies
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-blue-600" />
            Configuración de Cookies
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Cookies Necesarias */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <Label className="text-base font-medium">Cookies Necesarias</Label>
              </div>
              <Switch checked={true} disabled />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
              Estas cookies son esenciales para el funcionamiento del sitio web. Incluyen funcionalidades como 
              inicio de sesión, carrito de compras y preferencias de seguridad. No se pueden desactivar.
            </p>
          </div>

          <Separator />

          {/* Cookies Funcionales */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <Label className="text-base font-medium">Cookies Funcionales</Label>
              </div>
              <Switch 
                checked={cookieConsent.preferences.functional}
                onCheckedChange={() => handleToggleCookie('functional')}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
              Estas cookies permiten que el sitio web recuerde las elecciones que haces y proporcionen 
              funcionalidades mejoradas y más personales.
            </p>
          </div>

          <Separator />

          {/* Cookies Analíticas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <Label className="text-base font-medium">Cookies Analíticas</Label>
              </div>
              <Switch 
                checked={cookieConsent.preferences.analytics}
                onCheckedChange={() => handleToggleCookie('analytics')}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
              Estas cookies nos ayudan a entender cómo los visitantes interactúan con el sitio web, 
              recopilando y reportando información de forma anónima.
            </p>
          </div>

          <Separator />

          {/* Cookies de Marketing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                <Label className="text-base font-medium">Cookies de Marketing</Label>
              </div>
              <Switch 
                checked={cookieConsent.preferences.marketing}
                onCheckedChange={() => handleToggleCookie('marketing')}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
              Estas cookies se utilizan para rastrear visitantes en sitios web. La intención es mostrar 
              anuncios que sean relevantes y atractivos para el usuario individual.
            </p>
          </div>

          <Separator />

          {/* Acciones */}
          <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-between sm:items-center">
            <Button
              variant="destructive"
              onClick={handleRevokeConsent}
              className="text-sm w-full sm:w-auto"
            >
              Revocar Consentimiento
            </Button>
            <div className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
              Última actualización: {new Date(cookieConsent.timestamp).toLocaleDateString()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
