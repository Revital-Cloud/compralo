"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Shield,
  Loader2,
  X
} from "lucide-react";
import { formatPrice } from "@/utils/format-price";
import { 
  wompiWidgetService,
  WompiWidgetConfig,
  initializeWompiPayment
} from "@/services/wompi-widget.service";
import { toast } from "sonner";

interface WompiModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number; // Monto en centavos
  orderId?: number; // ID de la orden para obtener configuración del backend
  customerData?: {
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    phoneNumberPrefix?: string;
    legalId?: string;
    legalIdType?: string;
  };
  shippingAddress?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    phoneNumber?: string;
    region?: string;
    country?: string;
    name?: string;
  };
  onPaymentResult?: (result: any) => void;
}

export function WompiModal({
  isOpen,
  onClose,
  amount,
  orderId,
  customerData,
  shippingAddress,
  onPaymentResult
}: WompiModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Abrir el widget cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      openWompiWidget();
    }
  }, [isOpen]);

  const openWompiWidget = async () => {
    setIsLoading(true);

    try {
      // Preparar datos del cliente para Wompi
      // Solo incluir legalId y legalIdType si ambos tienen valores válidos
      const wompiCustomerData: WompiWidgetConfig['customerData'] = customerData ? {
        email: customerData.email,
        fullName: customerData.fullName,
        phoneNumber: customerData.phoneNumber,
        phoneNumberPrefix: customerData.phoneNumberPrefix || '+57',
        // Solo incluir legalId y legalIdType si ambos están presentes y no están vacíos
        ...(customerData.legalId && customerData.legalId.trim() && customerData.legalIdType && customerData.legalIdType.trim() 
          ? {
              legalId: customerData.legalId,
              legalIdType: customerData.legalIdType
            }
          : {})
      } : undefined;

      // Preparar dirección de envío para Wompi
      const wompiShippingAddress: WompiWidgetConfig['shippingAddress'] = shippingAddress ? {
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        phoneNumber: shippingAddress.phoneNumber,
        region: shippingAddress.region,
        country: shippingAddress.country || 'CO',
        name: shippingAddress.name
      } : undefined;

      // Asegurarse de que el script de Wompi esté cargado antes de continuar
      console.log('🔍 Verificando script de Wompi...');
      if (typeof (window as any).WidgetCheckout === 'undefined') {
        console.log('⏳ Script no cargado, esperando...');
        // Esperar hasta 5 segundos a que el script se cargue
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos (50 * 100ms)
        
        while (typeof (window as any).WidgetCheckout === 'undefined' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (typeof (window as any).WidgetCheckout === 'undefined') {
          throw new Error('El script de Wompi no se cargó correctamente. Por favor, recarga la página e intenta nuevamente.');
        }
      }
      
      console.log('✅ Script de Wompi verificado');

      // Usar la función mejorada que incluye respaldo automático
      // Pasar orderId para usar la configuración del backend (recomendado)
      await initializeWompiPayment(
        amount,
        wompiCustomerData,
        wompiShippingAddress,
        (result) => {
          // Si el widget se está abriendo, cerrar el modal de loading
          if (result.widgetOpening) {
            setIsLoading(false);
            onClose();
            return;
          }
          
          // Si hay un resultado de transacción, manejarlo
          if (result.transaction || result.error) {
            setIsLoading(false);
            onClose();
            if (onPaymentResult) {
              onPaymentResult(result);
            }
          }
        },
        orderId // Pasar orderId para usar backend
      );

      // El widget se abrió exitosamente, cerrar el modal después de un breve delay
      // para que el usuario vea que se está procesando
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 500);

    } catch (error) {
      console.error('Error al abrir el widget:', error);
      setIsLoading(false);
      
      // Cerrar el modal en caso de error
      onClose();
      
      // Mostrar mensaje específico según el error
      let errorMessage = 'Error al cargar el sistema de pagos.';
      
      if (error instanceof Error) {
        if (error.message.includes('AdBlocker') || error.message.includes('bloqueo')) {
          errorMessage = 'Se detectó un bloqueador de contenido. Por favor, desactívalo temporalmente o permite el acceso a checkout.wompi.co';
        } else if (error.message.includes('firewall')) {
          errorMessage = 'Acceso bloqueado por firewall. Contacta a tu administrador de red o intenta desde otra conexión.';
        } else if (error.message.includes('configuración') || error.message.includes('NEXT_PUBLIC')) {
          errorMessage = 'Error de configuración del sistema de pagos. Contacta al soporte técnico.';
        } else if (error.message.includes('script')) {
          errorMessage = 'El script de Wompi no se cargó correctamente. Por favor, recarga la página e intenta nuevamente.';
        } else {
          errorMessage = error.message || 'Error al cargar el sistema de pagos.';
        }
      }
      
      toast.error(errorMessage, { duration: 8000 });
    }
  };


  // No mostrar el modal si no está cargando (el widget de Wompi mostrará su propio modal)
  if (!isLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen && isLoading} onOpenChange={onClose} modal={false}>
      <DialogContent 
        className="max-w-md w-full p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Abriendo Wompi</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Abriendo sistema de pagos
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Preparando el pago de {formatPrice(amount / 100)} COP
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400 text-xs">
              Pago 100% seguro
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WompiModal;
