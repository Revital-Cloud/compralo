"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastActions } from "@/hooks/use-toast-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, MoreVertical, Trash2, CheckCircle, PlusCircle, Star, Edit3, Shield } from "lucide-react";
import { listPaymentMethods, deletePaymentMethod, setDefaultPaymentMethod, addPaymentMethod } from "@/services/payment.service";
import { MetodoPagoUsuario } from "@/types/payment";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddPaymentMethodDialog } from "./add-payment-method-dialog";

const getBrandIcon = (brand: string) => {
    const iconClass = "w-8 h-5 text-white";
    switch (brand.toLowerCase()) {
      case "visa":
        return <div className={`${iconClass} bg-blue-600/50 rounded flex items-center justify-center text-xs font-bold`}>VISA</div>;
      case "mastercard":
        return (
          <div className="flex space-x-1">
            <div className="w-4 h-4 bg-red-500 rounded-full opacity-90"></div>
            <div className="w-4 h-4 bg-yellow-500 rounded-full opacity-90 -ml-2"></div>
          </div>
        );
      case "amex":
        return <div className={`${iconClass} bg-green-600/50 rounded flex items-center justify-center text-xs font-bold`}>AMEX</div>;
      default:
        return <CreditCard className="w-6 h-6 text-white" />;
    }
};

const PaymentMethods = () => {
    const { showSuccess, showError } = useToastActions();
    const queryClient = useQueryClient();

    const { data: paymentMethods = [], isLoading } = useQuery<MetodoPagoUsuario[]>({
        queryKey: ['paymentMethods'],
        queryFn: listPaymentMethods,
    });

    const mutationOptions = {
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
            showSuccess(data.message || "Operación completada con éxito.");
        },
        onError: (error: any) => {
            showError(error.message || "Ocurrió un error al procesar la solicitud.");
        },
    };

    const addMutation = useMutation({
        mutationFn: addPaymentMethod,
        ...mutationOptions
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deletePaymentMethod(id),
        ...mutationOptions
    });

    const setDefaultMutation = useMutation({
        mutationFn: (id: number) => setDefaultPaymentMethod(id),
        ...mutationOptions
    });

    return (
        <div className="relative z-10 w-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Métodos de Pago</h3>
                <AddPaymentMethodDialog 
                    onAddPaymentMethod={addMutation.mutate} 
                    isPending={addMutation.isPending}
                />
            </div>

            {isLoading ? (
                <PaymentMethodsSkeleton />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paymentMethods.map((method, index) => (
                        <Card
                            key={method.id_metodo_pago}
                            className="group relative overflow-hidden bg-gray-900/80 border-white/10 backdrop-blur-sm hover:border-violet-500/50 transition-all duration-300 transform hover:scale-[1.03]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <CardContent className="relative p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        {getBrandIcon(method.brand)}
                                        {method.is_default && (
                                            <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 text-xs">
                                                <Star className="w-3 h-3 mr-1" />
                                                Principal
                                            </Badge>
                                        )}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 p-0">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-gray-800/90 backdrop-blur-lg border-white/10">
                                            {!method.is_default && (
                                                <DropdownMenuItem onClick={() => setDefaultMutation.mutate(method.id_metodo_pago)} disabled={setDefaultMutation.isPending}>
                                                    <Star className="w-4 h-4 mr-2" />
                                                    Establecer como principal
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => deleteMutation.mutate(method.id_metodo_pago)} disabled={deleteMutation.isPending} className="text-red-400 focus:bg-red-500/20 focus:text-red-400">
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="mb-4">
                                    <div className="flex items-center space-x-2 text-xl font-mono text-gray-200">
                                        <span>••••</span><span>••••</span><span>••••</span>
                                        <span>{method.last_four_digits}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end text-sm">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Titular</p>
                                        <p className="font-medium text-gray-200">{method.card_holder}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 mb-1">Expira</p>
                                        <p className="font-medium text-gray-200">{String(method.expiration_month).padStart(2, '0')}/{method.expiration_year}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {paymentMethods.length === 0 && (
                         <div className="md:col-span-2 lg:col-span-3 text-center py-10 border-2 border-dashed border-gray-700 rounded-lg">
                            <p className="text-gray-500">No tienes métodos de pago guardados.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const PaymentMethodsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-gray-900/80 border-white/10 p-6">
                <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-7 w-12" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <Skeleton className="h-6 w-full mb-4" />
                <div className="flex justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="space-y-2 items-end">
                        <Skeleton className="h-3 w-12 ml-auto" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                </div>
            </Card>
        ))}
    </div>
);

export default PaymentMethods; 