"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlusCircle } from "lucide-react";

// Define el schema del formulario con Zod
const formSchema = z.object({
    card_holder: z.string().min(1, "El nombre es requerido."),
    number: z.string().min(13, "Número de tarjeta inválido.").max(19, "Número de tarjeta inválido."),
    exp_month: z.string().length(2, "Mes inválido."),
    exp_year: z.string().length(2, "Año inválido"),
    cvc: z.string().min(3, "CVC inválido").max(4, "CVC inválido"),
});

type FormData = z.infer<typeof formSchema>;

interface AddPaymentMethodDialogProps {
    onAddPaymentMethod: (
        data: FormData,
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
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            card_holder: "",
            number: "",
            exp_month: "",
            exp_year: "",
            cvc: "",
        },
    });

    const onSubmit = async (data: FormData) => {
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
                              {isPending ? "Agregando..." : "Agregar Tarjeta"}
                          </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};