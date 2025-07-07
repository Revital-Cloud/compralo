"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MapPin, Pencil } from "lucide-react";
import { useAuth, useUpdateProfile } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

const addressSchema = z.object({
  des_direccion: z.string().min(1, {
    message: "La dirección es requerida",
  }),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export default function AddressesTab() {
  const { user } = useAuth();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      des_direccion: user?.des_direccion || "",
    },
  });

  const onSubmit = (data: AddressFormValues) => {
    updateProfile(data, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset({ des_direccion: data.des_direccion });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-foreground">Dirección guardada</h3>
          <p className="text-sm text-muted-foreground">Gestiona tu dirección de envío</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              {user?.des_direccion ? (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar dirección
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Agregar dirección
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {user?.des_direccion ? "Editar dirección" : "Agregar dirección"}
              </DialogTitle>
              <DialogDescription>
                Ingresa tu dirección de envío para tus compras
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="des_direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Calle 123 #45-67" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Guardando..." : "Guardar dirección"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="py-6">
          {user?.des_direccion ? (
            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="font-medium">Dirección principal</p>
                <p className="text-sm text-muted-foreground">{user.des_direccion}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tienes una dirección guardada</p>
              <p className="text-sm text-muted-foreground/70">Agrega una dirección para facilitar tus compras</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 