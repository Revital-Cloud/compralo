"use client";

import { useEffect, useState, FormEvent } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addPaymentMethod } from '@/services/payment.service';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    Wompi: any;
  }
}

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || "";

export function AddPaymentMethodDialog({ open, onOpenChange }: AddPaymentMethodDialogProps) {
  const queryClient = useQueryClient();
  const [isWompiReady, setIsWompiReady] = useState(false);

  // Estados para el formulario no controlado
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');

  // Cargar el SDK de Wompi para tokenización
  useEffect(() => {
    if (document.querySelector('script[src="https://sdk.wompi.co/v1/wompi.js"]')) {
      setIsWompiReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.wompi.co/v1/wompi.js';
    script.async = true;
    script.onload = () => setIsWompiReady(true);
    document.body.appendChild(script);
  }, []);

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
    }
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isWompiReady || !WOMPI_PUBLIC_KEY) {
      toast.error("Error", { description: "La pasarela de pago no está lista. Intenta de nuevo." });
      return;
    }

    const wompi = new window.Wompi({ publicKey: WOMPI_PUBLIC_KEY });

    try {
      const result = await wompi.tokenizeCard({
        number: cardNumber.replace(/\s/g, ''),
        cvc: cvc,
        exp_month: expMonth,
        exp_year: expYear,
      });

      if (result.status === 'SUCCESS' && result.data.id) {
        addCardMutation.mutate(result.data.id);
      } else {
        const errorMessage = result.error?.messages?.[0] || "No se pudo procesar la tarjeta. Revisa los datos.";
        toast.error("Error de validación", { description: errorMessage });
      }
    } catch (error) {
        console.error("Error inesperado al tokenizar:", error);
        toast.error("Error inesperado", { description: "Ocurrió un error al contactar el servicio de pago." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar nuevo método de pago</DialogTitle>
          <DialogDescription>
            Tu información es tokenizada de forma segura por Wompi.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
                <Label htmlFor="cardNumber">Número de tarjeta</Label>
                <Input id="cardNumber" placeholder="0000 0000 0000 0000" value={cardNumber} onChange={e => setCardNumber(e.target.value)} required />
            </div>
            <div className="flex gap-4">
                <div className="w-1/3">
                    <Label htmlFor="expMonth">Mes Exp.</Label>
                    <Input id="expMonth" placeholder="MM" value={expMonth} onChange={e => setExpMonth(e.target.value)} required />
                </div>
                <div className="w-1/3">
                    <Label htmlFor="expYear">Año Exp.</Label>
                    <Input id="expYear" placeholder="YY" value={expYear} onChange={e => setExpYear(e.target.value)} required />
                </div>
                <div className="w-1/3">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="123" value={cvc} onChange={e => setCvc(e.target.value)} required />
                </div>
            </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={addCardMutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addCardMutation.isPending || !isWompiReady}>
              {addCardMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar Tarjeta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 