'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui';
import { UserAvatar } from '@/components/ui';
import { Badge } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui';
import { useAuth, useChangePassword } from '@/hooks/use-auth';
import { changePasswordSchema } from '@/schemas/auth.schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { IconLock, IconUserCircle } from '@tabler/icons-react';

type PasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function AdminAccountPage() {
  const { user } = useAuth();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { mutateAsync: changePassword, isPending } = useChangePassword();

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: '', new_password: '' },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    if (data.current_password === data.new_password) {
      form.setError('new_password', {
        type: 'manual',
        message: 'La nueva contraseña no puede ser igual a la actual',
      });
      return;
    }
    try {
      await changePassword(data);
      setPasswordOpen(false);
      form.reset();
    } catch {
      // toast manejado por el hook
    }
  };

  if (!user) {
    return null;
  }

  const roleLabel = Number(user.id_rol) === 1 ? 'Administrador' : 'Cliente';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cuenta</h1>
        <p className="text-muted-foreground">
          Información de tu cuenta y opciones de seguridad del panel.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUserCircle className="size-5" />
              Perfil
            </CardTitle>
            <CardDescription>Datos del usuario con el que iniciaste sesión en el panel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <UserAvatar user={user} size={56} variant="squircle" />
              <div className="space-y-1">
                <p className="font-medium">
                  {user.nom_usuario} {user.ape_usuario}
                </p>
                <p className="text-sm text-muted-foreground">{user.email_usuario}</p>
                <Badge variant={Number(user.id_rol) === 1 ? 'default' : 'secondary'}>
                  {roleLabel}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconLock className="size-5" />
              Seguridad
            </CardTitle>
            <CardDescription>Cambia tu contraseña de acceso al panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <IconLock className="mr-2 size-4" />
                  Cambiar contraseña
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cambiar contraseña</DialogTitle>
                  <DialogDescription>
                    Introduce tu contraseña actual y la nueva. La nueva debe tener al menos 8 caracteres.
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
                            <Input type="password" placeholder="••••••••" {...field} />
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
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setPasswordOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isPending}>
                        {isPending ? 'Guardando...' : 'Guardar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
