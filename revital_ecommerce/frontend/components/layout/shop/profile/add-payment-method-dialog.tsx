"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentCardSchema, type PaymentCardFormValues } from "@/schemas/shop/payment-card.schema";
import { useToastActions } from "@/hooks/use-toast-actions";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui";
import { PlusCircle, Loader2 } from "lucide-react";

/**
 * Diálogo para agregar un nuevo método de pago (tarjeta).
 *
 * Este componente es “presentational”: no llama al backend directamente.
 * En su lugar, delega la mutación a través del callback `onAddPaymentMethod`.
 *
 * Flujo:
 * 1) Abre `Dialog` con formulario validado por `paymentCardSchema` (React Hook Form + Zod).
 * 2) Al enviar, ejecuta `onAddPaymentMethod(data, { onSuccess, onError })`.
 * 3) En `onSuccess`, si el backend responde `success=true`, cierra el modal y resetea el formulario.
 * 4) La UI usa `isPending` para mostrar mensajes de progreso (estado externo controlado por el padre).
 */
interface AddPaymentMethodDialogProps {
    onAddPaymentMethod: (
        data: PaymentCardFormValues,
        options?: {
            onSuccess?: (result: any) => void;
            onError?: (error: any) => void;
        }
    ) => void;
    isPending: boolean;
}

export const AddPaymentMethodDialog: React.FC<AddPaymentMethodDialogProps> = ({ onAddPaymentMethod, isPending }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { showSuccess, showError } = useToastActions();
    const form = useForm<PaymentCardFormValues>({
        resolver: zodResolver(paymentCardSchema),
        defaultValues: {
            card_holder: "",
            number: "",
            exp_month: "",
            exp_year: "",
            cvc: "",
        },
    });

    /**
     * Envía el formulario al callback provisto por el contenedor.
     *
     * Nota:
     * - `onError` está diseñado para capturar errores de la mutación.
     * - El `catch` adicional cubre fallos inesperados (por ejemplo, si el callback lanza).
     */
    const onSubmit = async (data: PaymentCardFormValues) => {
        try {
            onAddPaymentMethod(data, {
                onSuccess: (result: any) => {
                    if (result.success) {
                        showSuccess("Método de pago agregado con éxito.");
                        setIsOpen(false);
                        form.reset();
                    } else {
                        showError(result.error || "No se pudo agregar el método de pago.");
                    }
                },
                onError: (error: any) => {
                    showError(error.message || "Ocurrió un error inesperado.");
                },
            });
        } catch (error) {
            // Este catch es por si la mutación misma falla, aunque onError debería cubrirlo.
            showError("Algo salió mal.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Agregar Método
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Agregar Nuevo Método de Pago</DialogTitle>
                    <DialogDescription>
                        Ingresa los detalles de tu tarjeta. La información es guardada de forma segura.
                        {isPending && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <div className="flex items-center text-blue-700">
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    <span className="text-sm">Procesando tu tarjeta... Esto puede tomar unos segundos.</span>
                                </div>
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="card_holder"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre en la tarjeta</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} type="text" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número de tarjeta</FormLabel>
                                    <FormControl>
                                        <Input placeholder="**** **** **** 1234" {...field} type="number" inputMode="numeric" pattern="\d*" minLength={13} maxLength={19}  />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="exp_month"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mes Exp.</FormLabel>
                                        <FormControl>
                                            <Input placeholder="MM" {...field} type="number" inputMode="numeric" pattern="\d*" minLength={2} maxLength={2} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="exp_year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Año Exp.</FormLabel>
                                        <FormControl>
                                            <Input placeholder="YY" {...field} type="number" inputMode="numeric" pattern="\d*" minLength={2} maxLength={2} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cvc"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CVC</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123" {...field} type="number" inputMode="numeric" pattern="\d*" minLength={3} maxLength={4} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={isPending} className="w-full">
                              {isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Procesando...
                                </>
                              ) : (
                                "Agregar Tarjeta"
                              )}
                          </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};