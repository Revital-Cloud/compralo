"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  RefreshCw,
  Settings
} from "lucide-react";

interface WompiTroubleshootGuideProps {
  isVisible: boolean;
  onRetry: () => void;
  onClose: () => void;
  errorType?: 'adblocker' | 'firewall' | 'csp' | 'connectivity' | 'general';
}

export function WompiTroubleshootGuide({
  isVisible,
  onRetry,
  onClose,
  errorType = 'general'
}: WompiTroubleshootGuideProps) {
  if (!isVisible) return null;

  const getGuideContent = () => {
    switch (errorType) {
      case 'adblocker':
        return {
          icon: Shield,
          title: 'Bloqueador de Contenido Detectado',
          color: 'text-orange-500',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          description: 'Tu bloqueador de anuncios está impidiendo cargar el sistema de pagos de Wompi.',
          steps: [
            'Desactiva temporalmente tu AdBlocker para este sitio',
            'Agrega checkout.wompi.co a la lista de excepciones',
            'Recarga la página e intenta nuevamente',
            'Como alternativa, usa el método de pago directo'
          ],
          alternativeText: 'Usar método de pago alternativo'
        };
      
      case 'firewall':
        return {
          icon: AlertTriangle,
          title: 'Acceso Bloqueado por Firewall',
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          description: 'Tu red corporativa o firewall está bloqueando el acceso a Wompi.',
          steps: [
            'Contacta a tu administrador de red',
            'Solicita acceso a checkout.wompi.co',
            'Intenta desde otra conexión (datos móviles)',
            'Usa el método de pago alternativo mientras tanto'
          ],
          alternativeText: 'Usar método alternativo'
        };
      
      case 'connectivity':
        return {
          icon: AlertTriangle,
          title: 'Problemas de Conectividad',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          description: 'Hay problemas para conectarse con los servidores de Wompi.',
          steps: [
            'Verifica tu conexión a internet',
            'Intenta recargar la página',
            'Cambia a una conexión más estable',
            'Usa el método de pago alternativo'
          ],
          alternativeText: 'Usar método alternativo'
        };
      
      default:
        return {
          icon: AlertTriangle,
          title: 'Error al Cargar Sistema de Pagos',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          description: 'Hubo un problema al cargar el widget de pagos de Wompi.',
          steps: [
            'Recarga la página e intenta nuevamente',
            'Verifica que JavaScript esté habilitado',
            'Desactiva temporalmente extensiones del navegador',
            'Usa el método de pago alternativo'
          ],
          alternativeText: 'Usar método alternativo'
        };
    }
  };

  const content = getGuideContent();
  const Icon = content.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className={`max-w-md w-full ${content.bgColor} ${content.borderColor} border-2`}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center`}>
              <Icon className={`h-6 w-6 ${content.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {content.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sistema de pagos Wompi
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
            {content.description}
          </p>

          {/* Steps */}
          <div className="space-y-2 mb-6">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
              Pasos para solucionarlo:
            </h4>
            <ol className="space-y-1">
              {content.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={onRetry}
              className="w-full flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Intentar nuevamente
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                // Aquí se podría abrir directamente el Web Checkout
                window.open('https://checkout.wompi.co/p/', '_blank');
              }}
              className="w-full flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {content.alternativeText}
            </Button>
            
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-sm"
            >
              Cancelar
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Pagos seguros procesados por Wompi</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WompiTroubleshootGuide;
