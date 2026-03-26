"use client";

import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { profileSchema } from "@/schemas/user.schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import { Separator } from "@/components/ui";
import { UserPublic } from "@/types/auth";
import { useAccountStats } from "@/hooks/use-account-stats";

/**
 * Pestaña de perfil del usuario.
 *
 * Incluye:
 * - edición de datos personales permitidos
 * - visualización de métricas resumidas de actividad de cuenta
 */

interface ProfileTabProps {
  user: UserPublic;
  form: UseFormReturn<z.infer<typeof profileSchema>>;
  isEditing: boolean;
  onSubmit: (values: z.infer<typeof profileSchema>) => void;
}

export default function ProfileTab({ user, form, isEditing, onSubmit }: ProfileTabProps) {
  // Obtiene métricas del backend para mostrar un resumen de actividad del usuario.
  const { data: stats, isLoading } = useAccountStats(user.id_usuario);
  const celField = form.register("cel_usuario");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Actualiza tu información personal y de contacto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nom_usuario">Nombre</Label>
                  <Input 
                    id="nom_usuario" 
                    {...form.register("nom_usuario")}
                    disabled={!isEditing} 
                  />
                  {form.formState.errors.nom_usuario && (
                    <p className="text-sm text-red-500">{form.formState.errors.nom_usuario.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ape_usuario">Apellido</Label>
                  <Input 
                    id="ape_usuario" 
                    {...form.register("ape_usuario")}
                    disabled={!isEditing} 
                  />
                  {form.formState.errors.ape_usuario && (
                    <p className="text-sm text-red-500">{form.formState.errors.ape_usuario.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email_usuario">Email</Label>
                  <Input 
                    id="email_usuario" 
                    type="email" 
                    {...form.register("email_usuario")}
                    disabled={true} 
                  />
                  {form.formState.errors.email_usuario && (
                    <p className="text-sm text-red-500">{form.formState.errors.email_usuario.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cel_usuario">Teléfono</Label>
                  <Input 
                    id="cel_usuario" 
                    {...celField}
                    value={form.watch("cel_usuario") || ""}
                    onChange={(e) => {
                      // Normalizamos el input a dígitos y limitamos longitud para evitar
                      // que se guarden caracteres inválidos en el backend.
                      const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      form.setValue("cel_usuario", onlyDigits, { shouldValidate: true });
                    }}
                    disabled={!isEditing} 
                  />
                  {form.formState.errors.cel_usuario && (
                    <p className="text-sm text-red-500">{form.formState.errors.cel_usuario.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fec_nacimiento">Fecha de nacimiento</Label>
                  <Input 
                    id="fec_nacimiento" 
                    type="date" 
                    {...form.register("fec_nacimiento")}
                    disabled={true} 
                  />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estadísticas de Cuenta</CardTitle>
            <CardDescription>Resumen de tu actividad en la plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total gastado</span>
              <span className="text-lg font-bold text-green-600">
                {isLoading ? (
                  <span className="text-muted-foreground">Cargando...</span>
                ) : (
                  `$${(stats?.totalSpent || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                )}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Órdenes completadas</span>
              <span className="text-lg font-bold">
                {isLoading ? (
                  <span className="text-muted-foreground">Cargando...</span>
                ) : (
                  stats?.completedOrders || 0
                )}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Productos favoritos</span>
              <span className="text-lg font-bold">
                {isLoading ? (
                  <span className="text-muted-foreground">Cargando...</span>
                ) : (
                  stats?.favoriteProducts || 0
                )}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Puntos de fidelidad</span>
              <span className="text-lg font-bold text-purple-600">
                {isLoading ? (
                  <span className="text-muted-foreground">Cargando...</span>
                ) : (
                  (stats?.loyaltyPoints || 0).toLocaleString('es-CO')
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 