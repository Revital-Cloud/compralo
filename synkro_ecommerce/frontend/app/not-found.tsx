"use client"

import { Button } from "@/components/ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Home, Search, ArrowLeft, HelpCircle, AlertTriangle, RefreshCw } from "lucide-react"
import Link from "next/link"
import EcommerceHeader from "@/components/layout/shop/header/header"
import EcommerceFooter from "@/components/layout/shop/footer/footer"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <EcommerceHeader />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* 404 Illustration */}
          <div className="mb-12">
            <div className="relative inline-block">
              <div className="text-8xl sm:text-9xl font-black text-orange-500 mb-4 relative">
                404
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div className="w-32 h-1 bg-gradient-to-r from-orange-400 to-orange-600 mx-auto rounded-full"></div>
            </div>
          </div>

          {/* Error Message */}
          <Card className="mb-12 shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
                ¡Ups! Página No Encontrada
              </CardTitle>
              <CardDescription className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                La página que buscas no existe o ha sido movida. No te preocupes, 
                te ayudamos a encontrar lo que necesitas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-3">
                    Posibles causas:
                  </h4>
                  <ul className="text-left text-sm text-orange-800 dark:text-orange-200 space-y-2 max-w-md mx-auto">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      La URL puede tener un error de escritura
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      La página puede haber sido movida o eliminada
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Puede que no tengas permisos para acceder a esta página
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      El enlace puede estar roto o desactualizado
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-6 mb-12">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Link href="/">
                  <Home className="mr-2 h-5 w-5" />
                  Ir al Inicio
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-8 py-4 text-lg rounded-xl">
                <Link href="/products">
                  <Search className="mr-2 h-5 w-5" />
                  Explorar Productos
                </Link>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 px-6 py-3"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver Atrás
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => window.location.reload()}
                className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 px-6 py-3"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Recargar Página
              </Button>
              <Button asChild variant="ghost" className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 px-6 py-3">
                <Link href="/ayuda">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Centro de Ayuda
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <EcommerceFooter />
    </div>
  )
}
