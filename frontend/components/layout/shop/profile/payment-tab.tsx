"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function PaymentTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-foreground">Métodos de pago</h3>
          <p className="text-sm text-muted-foreground">Gestiona tus tarjetas y métodos de pago</p>
        </div>
        <Button>
          <CreditCard className="w-4 h-4 mr-2" />
          Agregar método
        </Button>
      </div>
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tienes métodos de pago guardados</p>
            <p className="text-sm text-muted-foreground/70">Agrega una tarjeta para comprar más rápido</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 