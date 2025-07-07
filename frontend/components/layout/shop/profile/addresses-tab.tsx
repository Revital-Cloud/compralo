"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function AddressesTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-foreground">Direcciones guardadas</h3>
          <p className="text-sm text-muted-foreground">Gestiona tus direcciones de envío</p>
        </div>
        <Button>
          <MapPin className="w-4 h-4 mr-2" />
          Agregar dirección
        </Button>
      </div>
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tienes direcciones guardadas</p>
            <p className="text-sm text-muted-foreground/70">Agrega una dirección para facilitar tus compras</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 