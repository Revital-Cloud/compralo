"use client";

import { Button } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui";
import { Separator } from "@/components/ui";
import { PasswordStrength } from "@/components/ui";
import { Shield } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui";
import { useChangePassword } from "@/hooks/use-auth";
import { changePasswordSchema } from "@/schemas/auth.schema";
import type { z } from "zod";

type PasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function SettingsTab() {
  const [isOpen, setIsOpen] = useState(false);
  
  const { mutateAsync: changePassword, isPending } = useChangePassword();
  
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_new_password: "",
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    try {
      await changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error al cambiar la contraseña:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Privacidad y Seguridad</CardTitle>
          <CardDescription>Gestiona la seguridad de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="w-4 h-4 mr-2" />
                Cambiar contraseña
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cambiar contraseña</DialogTitle>
                <DialogDescription>
                  Ingresa tu contraseña actual y define una nueva contraseña segura.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="current_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña actual</FormLabel>
                        <FormControl>
                          <PasswordStrength
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Ingresa tu contraseña actual"
                            disabled={isPending}
                            showToggle={true}
                            showStrength={false}
                            showCriteria={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="new_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva contraseña</FormLabel>
                        <FormControl>
                          <PasswordStrength
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Ingresa tu nueva contraseña"
                            disabled={isPending}
                            showToggle={true}
                            showStrength={true}
                            showCriteria={true}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirm_new_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar nueva contraseña</FormLabel>
                        <FormControl>
                          <PasswordStrength
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Confirma tu nueva contraseña"
                            disabled={isPending}
                            showToggle={true}
                            showStrength={false}
                            showCriteria={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                      disabled={isPending}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Separator />

          <div className="space-y-2">
            <div>
              <p className="font-medium">Zona de peligro</p>
              <p className="text-sm text-muted-foreground">Acciones irreversibles para tu cuenta</p>
            </div>
            <Button variant="destructive">Eliminar cuenta</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 