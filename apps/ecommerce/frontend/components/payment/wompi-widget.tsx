"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Wallet, 
  Banknote, 
  Smartphone,
  Shield,
  Check,
  Loader2
} from "lucide-react";
import { formatPrice } from "@/utils/format-price";
import { 
  initializeWompiPayment, 
  WompiWidgetConfig,
  PAYMENT_METHOD_CONFIG 
} from "@/services/wompi-widget.service";
import { toast } from "sonner";

interface WompiWidgetProps {
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
  disabled?: boolean;
}

export function WompiWidget({
  amount,
  customerData,
  shippingAddress,
  onPaymentResult,
  disabled = false
}: WompiWidgetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // Métodos de pago disponibles con iconos y configuración
  const paymentMethods = [
    {
      id: 'CARD',
      title: 'Tarjetas Débito y Crédito',
      description: 'VISA, Mastercard, American Express',
      icon: CreditCard,
      color: 'bg-blue-500',
      logos: ['VISA', 'MC', 'AMEX']
    },
    {
      id: 'PSE',
      title: 'PSE',
      description: 'Débito desde tu cuenta bancaria',
      icon: Wallet,
      color: 'bg-green-500',
      logos: ['PSE']
    },
    {
      id: 'NEQUI',
      title: 'Nequi',
      description: 'Paga con tu cuenta Nequi',
      icon: Smartphone,
      color: 'bg-purple-500',
      logos: ['N']
    },
    {
      id: 'BANCOLOMBIA_TRANSFER',
      title: 'Corresponsal Bancario',
      description: 'Paga en efectivo en Bancolombia',
      icon: Banknote,
      color: 'bg-yellow-500',
      logos: ['BC']
    },
    {
      id: 'DAVIPLATA',
      title: 'Daviplata',
      description: 'Paga con tu cuenta Daviplata',
      icon: Smartphone,
      color: 'bg-red-500',
      logos: ['DP']
    }
  ];

  const handlePaymentMethodSelect = async (methodId: string) => {
    if (disabled || isLoading) return;

    setSelectedMethod(methodId);
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

      // Inicializar el pago con Wompi
      await initializeWompiPayment(
        amount,
        wompiCustomerData,
        wompiShippingAddress,
        (result) => {
          setIsLoading(false);
          setSelectedMethod(null);
          
          if (onPaymentResult) {
            onPaymentResult(result);
          }
        }
      );

    } catch (error) {
      console.error('Error al procesar el pago:', error);
      setIsLoading(false);
      setSelectedMethod(null);
      toast.error('Error al procesar el pago. Intenta nuevamente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Pago seguro con Wompi
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Elige tu método de pago
        </h2>
        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
          Total: {formatPrice(amount / 100)} COP
        </p>
      </div>

      {/* Métodos de pago */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          const isMethodLoading = isLoading && isSelected;

          return (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <CardContent className="p-6">
                <Button
                  variant="ghost"
                  className="w-full h-auto p-0 justify-start"
                  onClick={() => handlePaymentMethodSelect(method.id)}
                  disabled={disabled || isLoading}
                >
                  <div className="flex items-center gap-4 w-full">
                    {/* Icono */}
                    <div className={`w-12 h-12 rounded-full ${method.color} flex items-center justify-center flex-shrink-0`}>
                      {isMethodLoading ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      ) : (
                        <Icon className="h-6 w-6 text-white" />
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {method.title}
                        </h3>
                        {isSelected && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {method.description}
                      </p>
                      
                      {/* Logos de marcas */}
                      <div className="flex gap-1">
                        {method.logos.map((logo, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs px-2 py-1 bg-white dark:bg-gray-700"
                          >
                            {logo}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Estado de carga */}
                    {isMethodLoading && (
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        Procesando...
                      </div>
                    )}
                  </div>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Información de seguridad */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Pago 100% seguro
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Tus datos están protegidos con encriptación SSL de 256 bits. 
          Wompi cumple con los estándares PCI DSS para garantizar la seguridad de tus transacciones.
        </p>
      </div>

      {/* Footer con logos */}
      <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <img 
            src="/wompi-logo.svg" 
            alt="Wompi" 
            className="h-6 w-auto"
            onError={(e) => {
              // Fallback si no existe el logo
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Powered by Wompi
          </span>
        </div>
      </div>
    </div>
  );
}

export default WompiWidget;
