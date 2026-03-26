"use client";

import { Button } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui";
import { Input } from "@/components/ui";
import { Separator } from "@/components/ui";
import { PasswordStrength } from "@/components/ui";
import { Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui";
import { useChangePassword, useAuth } from "@/hooks/use-auth";
import { changePasswordSchema } from "@/schemas/auth.schema";
import { toast } from "sonner";
import type { z } from "zod";

/**
 * Pestaña de configuración y seguridad.
 *
 * Flujos:
 * - cambio de contraseña con validación de política.
 * - desactivación de cuenta (soft delete) con confirmación explícita.
 */

type PasswordFormValues = z.infer<typeof changePasswordSchema>;

const CONFIRM_TEXT = "ELIMINAR";

export default function SettingsTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { mutateAsync: changePassword, isPending } = useChangePassword();
  const { deactivateAccount } = useAuth();
  
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_new_password: "",
    },
  });

  /**
   * Flujo: cambio de contraseña
   * - Zod valida política/estructura desde `changePasswordSchema`.
   * - `useChangePassword()` delega el update al backend y muestra toasts.
   * - Se cierra el modal y se limpia el form al éxito.
   */
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
            <Dialog open={isDeleteModalOpen} onOpenChange={(open) => {
              setIsDeleteModalOpen(open);
              if (!open) {
                setDeleteConfirmText("");
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Eliminar cuenta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <>
                  <DialogHeader>
                    <DialogTitle className="text-destructive">¿Estás completamente seguro?</DialogTitle>
                    <DialogDescription>
                      Tu cuenta será desactivada. Tus datos e historial se conservarán, pero no podrás
                      iniciar sesión. Si deseas volver, puedes registrarte de nuevo con el mismo correo
                      y reactivar tu cuenta. Escribe <strong>ELIMINAR</strong> para confirmar.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input
                      placeholder="Escribe ELIMINAR"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="font-mono"
                      disabled={isDeleting}
                      autoFocus
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDeleteModalOpen(false)}
                      disabled={isDeleting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={deleteConfirmText !== CONFIRM_TEXT || isDeleting}
                      onClick={async () => {
                        // Protección anti “clic accidental”:
                        // - se requiere escribir exactamente `CONFIRM_TEXT` para habilitar la acción.
                        // - el backend ejecuta un soft-delete y maneja el estado de sesión via `useAuth`.
                        if (deleteConfirmText !== CONFIRM_TEXT) return;
                        try {
                          setIsDeleting(true);
                          await deactivateAccount();
                          toast.success("Cuenta desactivada correctamente.");
                        } catch (err) {
                          toast.error("Error al desactivar la cuenta. Inténtalo de nuevo.");
                        } finally {
                          setIsDeleting(false);
                        }
                      }}
                    >
                      {isDeleting ? "Desactivando..." : "Confirmar eliminación"}
                    </Button>
                  </DialogFooter>
                </>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 