"use client";

import { Button } from "@repo/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui";
import { Label } from "@repo/ui";
import { Separator } from "@repo/ui";
import { Switch } from "@repo/ui";
import { Input } from "@repo/ui";
import { Shield, Download, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui";
import { useChangePassword } from "@/hooks/use-auth";
import { changePasswordSchema } from "@/schemas/auth.schema";
import type { z } from "zod";

type PasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function SettingsTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const { mutate: changePassword, isPending } = useChangePassword();
  
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
    },
  });

  const onSubmit = (data: PasswordFormValues) => {
    try {
      changePassword(data);
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error al cambiar la contraseña:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
            <CardDescription>Configura cómo quieres recibir notificaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Notificaciones por email</Label>
                <p className="text-sm text-muted-foreground">Recibe actualizaciones de órdenes por email</p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-notifications">Notificaciones SMS</Label>
                <p className="text-sm text-muted-foreground">Recibe alertas importantes por SMS</p>
              </div>
              <Switch id="sms-notifications" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing-emails">Emails promocionales</Label>
                <p className="text-sm text-muted-foreground">Recibe ofertas y promociones especiales</p>
              </div>
              <Switch id="marketing-emails" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacidad y Seguridad</CardTitle>
            <CardDescription>Gestiona la privacidad de tu cuenta</CardDescription>
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
                    Ingresa tu contraseña actual y la nueva contraseña que deseas usar.
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
                            <div className="relative">
                              <Input 
                                type={showCurrentPassword ? "text" : "password"} 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
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
                            <div className="relative">
                              <Input 
                                type={showNewPassword ? "text" : "password"} 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
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
                        {isPending ? "Guardando..." : "Guardar cambios"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Descargar mis datos
            </Button>
            <Separator />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zona de peligro</CardTitle>
          <CardDescription>Acciones irreversibles para tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Eliminar cuenta</Button>
        </CardContent>
      </Card>
    </div>
  );
} 