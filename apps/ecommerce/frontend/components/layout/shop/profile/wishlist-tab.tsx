"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

export default function WishlistTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lista de deseos</CardTitle>
          <CardDescription>Productos que has guardado para comprar más tarde</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Tu lista de deseos está vacía</p>
            <p className="text-sm text-muted-foreground/70">Guarda productos que te interesen para encontrarlos fácilmente</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 