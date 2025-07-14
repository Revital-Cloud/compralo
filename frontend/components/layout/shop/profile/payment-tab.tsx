"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

import { AddPaymentMethodDialog } from "./add-payment-method-dialog";

const PaymentMethodSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <div className="h-40 animate-pulse bg-muted"></div>
    </CardContent>
  </Card>
);

// Función para obtener el icono de la marca de la tarjeta
const getCardIcon = (brand: string) => {
  const baseClasses = "w-10 h-10";
  switch (brand.toLowerCase()) {
    case 'visa':
      return <CreditCard className={`${baseClasses} text-foreground`} />;
    case 'mastercard':
      return <CreditCard className={`${baseClasses} text-foreground`} />;
    default:
      return <CreditCard className={`${baseClasses} text-foreground`} />;
  }
};

// Función para obtener el color de fondo de la tarjeta
const getCardBackground = (brand: string) => {
  switch (brand.toLowerCase()) {
    case 'visa':
      return 'bg-background hover:bg-muted/50';
    case 'mastercard':
      return 'bg-background hover:bg-muted/50';
    default:
      return 'bg-background hover:bg-muted/50';
  }
};

// Función para obtener el nombre de la marca
const getBrandName = (brand: string) => {
  switch (brand.toLowerCase()) {
    case 'visa':
      return 'VISA';
    case 'mastercard':
      return 'Mastercard';
    default:
      return brand.toUpperCase();
  }
};

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
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PaymentMethodSkeleton />
          <PaymentMethodSkeleton />
        </div>
      );
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
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">No tienes métodos de pago guardados</p>
              <p className="text-sm text-muted-foreground">Agrega una tarjeta para comprar más rápido</p>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4"
                variant="outline"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Agregar tarjeta
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method: PaymentMethod) => (
          <Card 
            key={method.id_metodo_pago} 
            className={cn(
              "relative group border transition-all duration-200",
              getCardBackground(method.brand)
            )}
          >
            <CardContent className="p-6 h-40">
              <div className="flex flex-col h-full justify-between">
                {/* Encabezado con chip y marca */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-5 bg-muted/20 rounded" /> {/* Chip minimalista */}
                    <span className="text-sm font-medium text-foreground">
                      {getBrandName(method.brand)}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!method.is_default && (
                        <DropdownMenuItem 
                          onClick={() => handleSetDefault(method.id_metodo_pago)}
                          className="text-primary"
                        >
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
                </div>

                {/* Número de tarjeta */}
                <div className="font-mono text-lg text-foreground">
                  •••• •••• •••• {method.last_four_digits}
                </div>

                {/* Pie con fecha y estado predeterminado */}
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Expira</div>
                    <div className="font-mono text-sm text-foreground">
                      {String(method.expiration_month).padStart(2, '0')}/{method.expiration_year}
                    </div>
                  </div>
                  {method.is_default && (
                    <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      Predeterminada
                    </div>
                  )}
                </div>
              </div>
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