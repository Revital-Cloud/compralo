"use client";

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { addPaymentMethod } from '@/services/payment.service';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Tipado para el SDK de MercadoPago
declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MERCADOPAGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO || "";

// Schema de validación con Zod para el formulario de la tarjeta
const cardSchema = z.object({
  cardholderName: z.string().min(3, "El nombre del titular es requerido"),
  cardNumber: z.string()
    .min(15, "El número de tarjeta debe tener al menos 15 dígitos")
    .max(19, "El número de tarjeta es demasiado largo")
    .regex(/^\d+$/, "El número de tarjeta solo debe contener dígitos"),
  expirationDate: z.string().regex(/^(0[1-9]|1[0-2])\s*\/\s*([0-9]{2})$/, "La fecha debe tener el formato MM/YY"),
  securityCode: z.string().min(3, "El CVC debe tener 3 o 4 dígitos").max(4, "El CVC debe tener 3 o 4 dígitos"),
});

type CardFormData = z.infer<typeof cardSchema>;

export function AddPaymentMethodDialog({ open, onOpenChange }: AddPaymentMethodDialogProps) {
  const queryClient = useQueryClient();
  const [mp, setMp] = useState<any>(null);

  const form = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      cardholderName: "",
      cardNumber: "",
      expirationDate: "",
      securityCode: "",
    },
  });

  // Cargar el SDK de MercadoPago
  useEffect(() => {
    if (open) {
      if (!MERCADOPAGO_PUBLIC_KEY) {
        console.error("La Public Key de MercadoPago no está configurada.");
        toast.error("Error de configuración", { description: "La pasarela de pago no está disponible." });
        return;
      }

      if (window.MercadoPago) {
          setMp(new window.MercadoPago(MERCADOPAGO_PUBLIC_KEY));
          return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => {
        setMp(new window.MercadoPago(MERCADOPAGO_PUBLIC_KEY));
      };
      document.body.appendChild(script);
    }
  }, [open]);

  const addCardMutation = useMutation({
    mutationFn: addPaymentMethod,
    onSuccess: () => {
      toast.success('¡Tarjeta agregada!', { description: 'Tu método de pago se guardó correctamente.' });
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'No se pudo guardar la tarjeta.';
      toast.error('Error al guardar', { description: message });
    }
  });

  const onSubmit = async (data: CardFormData) => {
    if (!mp) {
      toast.error("Error", { description: "La pasarela de pago no está lista. Intenta de nuevo." });
      return;
    }

    const [expirationMonth, expirationYear] = data.expirationDate.replace(/\s/g, '').split('/');

    try {
      const { id: token } = await mp.createCardToken({
        cardholderName: data.cardholderName,
        cardNumber: data.cardNumber.replace(/\s/g, ''),
        securityCode: data.securityCode,
        expirationMonth,
        expirationYear: `20${expirationYear}`,
      });
      
      if (token) {
        addCardMutation.mutate(token);
      } else {
        toast.error("Error de validación", { description: "No se pudo generar el token. Revisa los datos de la tarjeta." });
      }
    } catch (error: any) {
      console.error(error);
      const message = error.cause?.[0]?.description || "No se pudo procesar la tarjeta. Verifica los datos.";
      toast.error("Error inesperado", { description: message });
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
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cardholderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del titular</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre como aparece en la tarjeta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de tarjeta</FormLabel>
                  <FormControl>
                    <Input placeholder="0000 0000 0000 0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem className="w-1/2">
                    <FormLabel>Vencimiento</FormLabel>
                    <FormControl>
                      <Input placeholder="MM / YY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="securityCode"
                render={({ field }) => (
                  <FormItem className="w-1/2">
                    <FormLabel>CVC</FormLabel>
                    <FormControl>
                      <Input placeholder="123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={addCardMutation.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={addCardMutation.isPending || !mp}>
                {addCardMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Guardar Tarjeta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 