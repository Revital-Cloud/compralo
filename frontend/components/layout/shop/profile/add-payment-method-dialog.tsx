"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addPaymentMethod } from '@/services/payment.service';
import { toast } from 'sonner';
import { Loader2, CreditCard, Calendar, User, Lock } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || "";
const WOMPI_API_BASE_URL = WOMPI_PUBLIC_KEY.startsWith('pub_prod_')
  ? 'https://production.wompi.co/v1'
  : 'https://sandbox.wompi.co/v1';

// Función para formatear número de tarjeta
const formatCardNumber = (value: string) => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || '';
  const parts = [];

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }

  if (parts.length) {
    return parts.join(' ');
  } else {
    return value;
  }
};

// Función para detectar tipo de tarjeta
const getCardType = (number: string) => {
  const re = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
  };
  
  const cleanNumber = number.replace(/\D/g, '');
  
  if (re.visa.test(cleanNumber)) return 'Visa';
  if (re.mastercard.test(cleanNumber)) return 'Mastercard';
  if (re.amex.test(cleanNumber)) return 'American Express';
  return 'Desconocida';
};

export function AddPaymentMethodDialog({ open, onOpenChange }: AddPaymentMethodDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [cardType, setCardType] = useState('');
  const [errors, setErrors] = useState({
    card_holder: '',
    number: '',
    exp_month: '',
    exp_year: '',
    cvc: '',
  });
  
  const [cardData, setCardData] = useState({
    number: '',
    exp_month: '',
    exp_year: '',
    cvc: '',
    card_holder: '',
  });

  const addCardMutation = useMutation({
    mutationFn: addPaymentMethod,
    onSuccess: () => {
      toast.success('¡Tarjeta agregada exitosamente!', {
        description: 'Tu nuevo método de pago ha sido guardado.',
      });
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      onOpenChange(false);
      // Limpiar el formulario
      setCardData({
        number: '',
        exp_month: '',
        exp_year: '',
        cvc: '',
        card_holder: '',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Error al agregar la tarjeta.';
      toast.error('No se pudo agregar la tarjeta', {
        description: errorMessage,
      });
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  // Validación en tiempo real
  useEffect(() => {
    const newErrors = { ...errors };
    
    // Validar nombre
    if (cardData.card_holder && !/^[a-zA-Z\s]{2,}$/.test(cardData.card_holder)) {
      newErrors.card_holder = 'Ingresa un nombre válido';
    } else {
      newErrors.card_holder = '';
    }
    
    // Validar número de tarjeta
    if (cardData.number && cardData.number.replace(/\s/g, '').length < 15) {
      newErrors.number = 'Número de tarjeta inválido';
    } else {
      newErrors.number = '';
    }
    
    // Validar mes
    const month = parseInt(cardData.exp_month);
    if (cardData.exp_month && (isNaN(month) || month < 1 || month > 12)) {
      newErrors.exp_month = 'Mes inválido';
    } else {
      newErrors.exp_month = '';
    }
    
    // Validar año
    const currentYear = new Date().getFullYear() % 100;
    const year = parseInt(cardData.exp_year);
    if (cardData.exp_year && (isNaN(year) || year < currentYear)) {
      newErrors.exp_year = 'Año inválido';
    } else {
      newErrors.exp_year = '';
    }
    
    // Validar CVC
    if (cardData.cvc && (cardData.cvc.length < 3 || cardData.cvc.length > 4)) {
      newErrors.cvc = 'CVC inválido';
    } else {
      newErrors.cvc = '';
    }
    
    setErrors(newErrors);
  }, [cardData]);

  // Detectar tipo de tarjeta
  useEffect(() => {
    if (cardData.number) {
      setCardType(getCardType(cardData.number));
    } else {
      setCardType('');
    }
  }, [cardData.number]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Formatear número de tarjeta
    if (name === 'number') {
      formattedValue = formatCardNumber(value);
    }
    
    // Limitar longitud de campos
    if (name === 'exp_month' && value.length > 2) return;
    if (name === 'exp_year' && value.length > 2) return;
    if (name === 'cvc' && value.length > 4) return;
    
    // Solo números para campos numéricos
    if (['number', 'exp_month', 'exp_year', 'cvc'].includes(name)) {
      if (!/^\d*$/.test(value.replace(/\s/g, ''))) return;
    }

    setCardData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validar que no haya errores
    if (Object.values(errors).some(error => error !== '')) {
      toast.error('Por favor, corrige los errores del formulario');
      return;
    }
    
    setIsLoading(true);

    try {
      const wompiResponse = await axios.post(
        `${WOMPI_API_BASE_URL}/tokens/cards`,
        {
          number: cardData.number.replace(/\s/g, ''),
          cvc: cardData.cvc,
          exp_month: cardData.exp_month,
          exp_year: cardData.exp_year,
          card_holder: cardData.card_holder,
        },
        {
          headers: {
            Authorization: `Bearer ${WOMPI_PUBLIC_KEY}`,
          },
        }
      );

      if (wompiResponse.data?.data?.id) {
        addCardMutation.mutate(wompiResponse.data.data.id);
      } else {
        throw new Error("Error al procesar la tarjeta");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.messages?.number?.[0] 
        || error.response?.data?.error?.message
        || 'Error al procesar la tarjeta. Verifica los datos.';
      toast.error('Error de validación', {
        description: errorMessage,
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Agregar Nueva Tarjeta
          </DialogTitle>
          <DialogDescription>
            Ingresa los datos de tu tarjeta de forma segura
            {cardType && <span className="ml-2 font-medium text-foreground">• {cardType}</span>}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Label htmlFor="card_holder" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nombre en la tarjeta
              </Label>
              <Input
                id="card_holder"
                name="card_holder"
                value={cardData.card_holder}
                onChange={handleInputChange}
                className={cn(
                  "mt-1",
                  errors.card_holder && "border-red-500 focus-visible:ring-red-500"
                )}
                placeholder="NOMBRE APELLIDO"
                required
              />
              {errors.card_holder && (
                <p className="mt-1 text-sm text-red-500">{errors.card_holder}</p>
              )}
            </div>

            <div className="relative">
              <Label htmlFor="number" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Número de tarjeta
              </Label>
              <Input
                id="number"
                name="number"
                value={cardData.number}
                onChange={handleInputChange}
                className={cn(
                  "mt-1",
                  errors.number && "border-red-500 focus-visible:ring-red-500"
                )}
                placeholder="0000 0000 0000 0000"
                required
              />
              {errors.number && (
                <p className="mt-1 text-sm text-red-500">{errors.number}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="exp_month" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha de expiración
                </Label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      id="exp_month"
                      name="exp_month"
                      value={cardData.exp_month}
                      onChange={handleInputChange}
                      className={cn(
                        errors.exp_month && "border-red-500 focus-visible:ring-red-500"
                      )}
                      placeholder="MM"
                      required
                    />
                    {errors.exp_month && (
                      <p className="mt-1 text-sm text-red-500">{errors.exp_month}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      id="exp_year"
                      name="exp_year"
                      value={cardData.exp_year}
                      onChange={handleInputChange}
                      className={cn(
                        errors.exp_year && "border-red-500 focus-visible:ring-red-500"
                      )}
                      placeholder="AA"
                      required
                    />
                    {errors.exp_year && (
                      <p className="mt-1 text-sm text-red-500">{errors.exp_year}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="cvc" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  CVC
                </Label>
                <Input
                  id="cvc"
                  name="cvc"
                  value={cardData.cvc}
                  onChange={handleInputChange}
                  className={cn(
                    "mt-1",
                    errors.cvc && "border-red-500 focus-visible:ring-red-500"
                  )}
                  placeholder="123"
                  required
                />
                {errors.cvc && (
                  <p className="mt-1 text-sm text-red-500">{errors.cvc}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancelar
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={isLoading || Object.values(errors).some(error => error !== '')}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Guardar Tarjeta'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 