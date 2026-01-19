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
      const wompiCustomerData: WompiWidgetConfig['customerData'] = customerData ? {
        email: customerData.email,
        fullName: customerData.fullName,
        phoneNumber: customerData.phoneNumber,
        phoneNumberPrefix: customerData.phoneNumberPrefix || '+57',
        legalId: customerData.legalId,
        legalIdType: customerData.legalIdType
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

      // Cerrar este modal primero
      onClose();

      // Usar la función mejorada que incluye respaldo automático
      await initializeWompiPayment(
        amount,
        wompiCustomerData,
        wompiShippingAddress,
        (result) => {
          if (onPaymentResult) {
            onPaymentResult(result);
          }
        }
      );

      setIsLoading(false);

    } catch (error) {
      console.error('Error al abrir el widget:', error);
      setIsLoading(false);
      
      // Mostrar mensaje específico según el error
      let errorMessage = 'Error al cargar el sistema de pagos.';
      
      if (error instanceof Error) {
        if (error.message.includes('AdBlocker') || error.message.includes('bloqueo')) {
          errorMessage = 'Se detectó un bloqueador de contenido. Por favor, desactívalo temporalmente o permite el acceso a checkout.wompi.co';
        } else if (error.message.includes('firewall')) {
          errorMessage = 'Acceso bloqueado por firewall. Contacta a tu administrador de red o intenta desde otra conexión.';
        } else if (error.message.includes('configuración')) {
          errorMessage = 'Error de configuración del sistema de pagos. Contacta al soporte técnico.';
        }
      }
      
      toast.error(errorMessage, { duration: 8000 });
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
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
              Redirigiendo a Wompi para procesar tu pago de {formatPrice(amount / 100)} COP
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
