"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, MoreVertical, Trash2, CheckCircle, PlusCircle } from "lucide-react";
import { getPaymentMethods, deletePaymentMethod, setDefaultPaymentMethod } from "@/services/payment.service";
import { PaymentMethod } from "@/types/payment";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

import { AddPaymentMethodDialog } from "./add-payment-method-dialog";

const PaymentMethodSkeleton = () => (
  <Card>
    <CardContent className="p-6 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-12 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-8 w-8" />
    </CardContent>
  </Card>
);

export default function PaymentTab() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: paymentMethods, isLoading, isError } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: getPaymentMethods,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      toast.success("Método de pago eliminado correctamente.");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || "No se pudo eliminar el método de pago";
      toast.error(message);
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      toast.success("Método de pago predeterminado actualizado.");
    },
    onError: (error: any) => {
       const message = error?.response?.data?.detail || "No se pudo establecer como predeterminado";
       toast.error(message);
    }
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate(id);
  };

  const renderContent = () => {
    if (isLoading) {
      return <PaymentMethodSkeleton />;
    }

    if (isError) {
      return (
        <Card>
          <CardContent className="text-center py-8 text-destructive">
            <p>Error al cargar los métodos de pago. Por favor, intenta de nuevo más tarde.</p>
          </CardContent>
        </Card>
      );
    }

    if (!paymentMethods || paymentMethods.length === 0) {
      return (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tienes métodos de pago guardados</p>
              <p className="text-sm text-muted-foreground/70">Agrega una tarjeta para comprar más rápido</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {paymentMethods.map((method: PaymentMethod) => (
          <Card key={method.id_metodo_pago} className="w-full">
            <CardContent className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <CreditCard className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-foreground">
                    {method.brand} terminada en {method.last_four_digits}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expira {String(method.expiration_month).padStart(2, '0')}/{method.expiration_year}
                    {method.is_default && (
                      <span className="ml-2 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Predeterminada
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!method.is_default && (
                    <DropdownMenuItem onClick={() => handleSetDefault(method.id_metodo_pago)}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Establecer como predeterminada
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDelete(method.id_metodo_pago)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      <AddPaymentMethodDialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-foreground">Métodos de pago</h3>
            <p className="text-sm text-muted-foreground">Gestiona tus tarjetas y métodos de pago guardados</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Agregar método
          </Button>
        </div>
        {renderContent()}
      </div>
    </>
  );
} 