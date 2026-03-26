"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui";
import { Input } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import authService from "@/services/auth.service";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui";
import { toast } from "sonner";
import { useState } from "react";
import { ArrowLeft, Loader2, CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { PasswordStrength } from "@/components/ui";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { useRouter } from "next/navigation";
import { registerSchema } from "@/schemas/auth.schema";
import type { RegisterRequest } from "@/types";
import { parseLocalDate, formatDateSpanish, fixCalendarDateSelection, debugDate } from "@/utils/date-helpers";
import {
  getLockoutState,
  formatLockoutCountdown,
  REGISTER_ATTEMPT_CONFIG,
  REGISTER_ATTEMPT_KEY,
  remainingLockoutSeconds,
} from "@/lib/auth-attempt-limiter";
import { useAuthLockout } from "@/hooks/use-auth-lockout";

/**
 * Mapa del formulario de registro.
 *
 * Flujo:
 * 1) Valida payload de registro con `registerSchema`.
 * 2) Aplica lockout global de intentos fallidos.
 * 3) Ejecuta registro y redirige a verificación OTP por email.
 * 4) Si la cuenta está soft-deleted, ofrece flujo de reactivación.
 */

type FormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [softDeletedEmail, setSoftDeletedEmail] = useState<string | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);
  const router = useRouter();

  const { isLocked, remainingSeconds } = useAuthLockout(
    REGISTER_ATTEMPT_KEY,
    REGISTER_ATTEMPT_CONFIG,
  );
  const formDisabled = isLoading || isLocked;

  const form = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      id_usuario: "",
      nom_usuario: "",
      ape_usuario: "",
      email_usuario: "",
      password_usuario: "",
      cel_usuario: "",
      ind_genero: "masculino",
      fec_nacimiento: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (values: FormValues) => {
    // Guard anti-spam adicional en cliente.
    const lock = getLockoutState(REGISTER_ATTEMPT_KEY);
    if (lock.remainingMs > 0) {
      toast.error(
        `Demasiados intentos de registro. Espera ${formatLockoutCountdown(
          remainingLockoutSeconds({ remainingMs: lock.remainingMs }),
        )} para volver a intentarlo.`,
      );
      return;
    }
    try {
      setIsLoading(true);
      const dataToSubmit: RegisterRequest = {
        ...values,
        // Convertir id_usuario a número (Decimal en backend)
        id_usuario: Number(values.id_usuario),
        ind_genero: values.ind_genero === "masculino" ? false : true,
        // Asignar rol por defecto de cliente
        id_rol: 2,
      };
      
      await registerUser(dataToSubmit);
      // Redirigir a verificación de email (código OTP enviado al correo)
      router.push(`/verify-email?email=${encodeURIComponent(values.email_usuario)}`);
    } catch (error: any) {
      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;
      const code = typeof detail === 'object' ? detail?.code : undefined;
      if (status === 409 && code === 'ACCOUNT_SOFT_DELETED') {
        setSoftDeletedEmail(values.email_usuario);
        setReactivateModalOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-start mb-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="flex items-center gap-2 cursor-pointer">
                <ArrowLeft className="size-4" />
                Volver
              </Button>
            </Link>
          </div>
          <CardTitle className="text-xl">Crear cuenta</CardTitle>
          <CardDescription>
            Regístrate para comenzar a comprar en nuestra tienda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {isLocked && (
                <p
                  className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  Demasiados intentos fallidos. Podrás enviar el formulario de nuevo en{" "}
                  {formatLockoutCountdown(remainingSeconds)}.
                </p>
              )}
              <FormField
                control={form.control}
                name="id_usuario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identificación (Cédula) <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tu número de identificación"
                        {...field}
                        disabled={formDisabled}
                        type="number"
                        maxLength={11}
                        minLength={10}
                        pattern="\d*"
                        inputMode="numeric"
                      />
                    </FormControl>
                    <FormMessage  />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nom_usuario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} disabled={formDisabled} type="text"/>
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ape_usuario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} disabled={formDisabled} type="text"/>
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email_usuario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="john.doe@example.com"
                        {...field}
                        type="email"
                        disabled={formDisabled}
                      />
                    </FormControl>
                    <FormMessage className="min-h-[1.25rem]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password_usuario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <PasswordStrength
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="••••••••"
                        disabled={formDisabled}
                        showToggle={true}
                        showStrength={true}
                        showCriteria={true}
                      />
                    </FormControl>
                    <FormMessage className="min-h-[1.25rem]" />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cel_usuario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+57 300 123 4567"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10)
                          field.onChange(onlyDigits)
                        }}
                        disabled={formDisabled}
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ind_genero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Género <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Select
                          disabled={formDisabled}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Género" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="femenino">Femenino</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="min-h-[1.25rem]" />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="fec_nacimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de nacimiento (Opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal hover:bg-accent/50 dark:hover:bg-accent/20 dark:hover:text-white",
                              !field.value && "text-muted-foreground dark:text-white/90"
                            )}
                            disabled={formDisabled}
                          >
                            {field.value ? (
                              formatDateSpanish(field.value)
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? parseLocalDate(field.value) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              console.log('🔍 Fecha seleccionada del calendario:', date);
                              debugDate(date, 'Fecha del calendario');
                              
                              // Usar la función específica para corregir problemas de zona horaria
                              const fixedDateString = fixCalendarDateSelection(date);
                              console.log('🔍 Fecha corregida:', fixedDateString);
                              
                              field.onChange(fixedDateString);
                            } else {
                              field.onChange('');
                            }
                          }}
                          defaultMonth={field.value ? parseLocalDate(field.value) : undefined}
                          disabled={(date) =>
                            date > new Date()
                          }
                          autoFocus
                          locale={es}
                          captionLayout="dropdown"
                          startMonth={new Date(1940, 0)}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="min-h-[1.25rem]" />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-6" disabled={formDisabled}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear cuenta
              </Button>
              <div className="text-center text-sm">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Inicia sesión
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={reactivateModalOpen} onOpenChange={(open) => {
        setReactivateModalOpen(open);
        if (!open) setSoftDeletedEmail(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cuenta eliminada</DialogTitle>
            <DialogDescription>
              Este correo ya tenía una cuenta eliminada. ¿Deseas reactivarla?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivateModalOpen(false)} disabled={isReactivating}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!softDeletedEmail) return;
                try {
                  setIsReactivating(true);
                  await authService.requestAccountReactivation(softDeletedEmail);
                  toast.success("Te enviamos un correo para reactivar tu cuenta. Revisa tu bandeja de entrada.");
                  setReactivateModalOpen(false);
                  setSoftDeletedEmail(null);
                } catch {
                  toast.error("Error al solicitar reactivación. Inténtalo de nuevo.");
                } finally {
                  setIsReactivating(false);
                }
              }}
              disabled={isReactivating}
            >
              {isReactivating ? "Enviando..." : "Reactivar cuenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="text-muted-foreground text-center text-xs text-balance">
        Al hacer clic en Crear cuenta, aceptas nuestros{" "}
        <Link href="/terminos" className="underline underline-offset-4 hover:text-primary">
          Términos de Servicio
        </Link>{" "}
        y{" "}
        <Link href="/privacidad" className="underline underline-offset-4 hover:text-primary">
          Política de Privacidad
        </Link>
        .
      </div>
    </div>
  );
}