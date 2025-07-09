"use client";

import { useEffect, useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { addPaymentMethod } from '@/services/payment.service';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Tipado para el SDK de MercadoPago (para que TypeScript no se queje)
declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Reemplaza esto con tu Public Key de prueba desde las variables de entorno
const MERCADOPAGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || "";

export function AddPaymentMethodDialog({ open, onOpenChange }: AddPaymentMethodDialogProps) {
  const queryClient = useQueryClient();
  const [mp, setMp] = useState<any>(null);
  const [cardPayment, setCardPayment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSdkLoading, setIsSdkLoading] = useState(true);

  // Referencias a los divs donde se montarán los campos de MP
  const cardNumberRef = useRef(null);
  const securityCodeRef = useRef(null);
  const expirationDateRef = useRef(null);

  useEffect(() => {
    if (open) {
      if (!MERCADOPAGO_PUBLIC_KEY) {
        console.error("La Public Key de MercadoPago no está configurada.");
        toast.error("Error de configuración", { description: "La pasarela de pago no está disponible." });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => {
        const mercadopago = new window.MercadoPago(MERCADOPAGO_PUBLIC_KEY, {
          locale: 'es-CO',
        });
        setMp(mercadopago);
        setIsSdkLoading(false);
      };
      document.body.appendChild(script);

      return () => {
        // Limpiar el script al desmontar para evitar duplicados
        document.body.removeChild(script);
      };
    }
  }, [open]);

  useEffect(() => {
    if (mp && open) {
      // Inicializar los bricks de pago (los campos del formulario)
      const initializeCardPayment = async () => {
        const bricksBuilder = mp.bricks();
        const card = await bricksBuilder.create('cardPayment', 'cardPaymentBrick_container', {
          initialization: {
            amount: 1000, // Se requiere un monto para inicializar, no se cobra.
            payer: {
              // TODO: Idealmente, precargar el email del usuario
              email: 'test_user@test.com',
            },
          },
          customization: {
            visual: {
              style: {
                theme: document.body.classList.contains('dark') ? 'dark' : 'default',
              }
            }
          },
          callbacks: {
            onReady: () => {
              /* Callback llamado cuando el Brick está listo. */
            },
            onError: (error: any) => {
              console.error(error);
              toast.error("Error en el formulario", { description: "No se pudieron cargar los campos de pago." });
            },
          },
        });
        setCardPayment(card);
      };
      initializeCardPayment();
    }
  }, [mp, open]);


  const addCardMutation = useMutation({
    mutationFn: addPaymentMethod,
    onSuccess: () => {
      toast.success('¡Tarjeta agregada!', { description: 'Tu método de pago se guardó correctamente.' });
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'No se pudo guardar la tarjeta.';
      toast.error('Error al guardar', { description: message });
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    if (cardPayment) {
      try {
        const token = await cardPayment.getCardToken();
        if (token) {
          addCardMutation.mutate(token);
        } else {
            toast.error("Error de validación", { description: "Por favor, completa todos los datos de la tarjeta." });
            setIsLoading(false);
        }
      } catch (error) {
        toast.error("Error inesperado", { description: "No se pudo generar el token de la tarjeta." });
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar nuevo método de pago</DialogTitle>
          <DialogDescription>
            Tu información de pago es procesada de forma segura por MercadoPago.
          </DialogDescription>
        </DialogHeader>
        
        {isSdkLoading && <div className="text-center p-8">Cargando pasarela de pago...</div>}

        {/* El contenedor donde MercadoPago renderizará su formulario */}
        <div id="cardPaymentBrick_container"></div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || isSdkLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar Tarjeta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 