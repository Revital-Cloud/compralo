"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function OrdersTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Historial de Órdenes</CardTitle>
          <CardDescription>Revisa todas tus compras y su estado actual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aún no tienes órdenes</p>
            <p className="text-sm text-muted-foreground/70">Cuando realices tu primera compra aparecerá aquí</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 