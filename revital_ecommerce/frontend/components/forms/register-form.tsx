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
import { useState } from "react";
import { ArrowLeft, Loader2, CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui";
import { Select } from "@/components/ui";
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
import { toLocalISOString, parseLocalDate, formatDateSpanish, fixCalendarDateSelection, debugDate } from "@/utils/date-helpers";

type FormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
      // Solo redirigir si el registro fue exitoso
      router.push("/login");
    } catch (error: any) {
      console.error('Error en registro:', error);
      // El error ya se maneja en el hook useAuth con toast
      // Aquí podríamos agregar manejo adicional si es necesario
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
              <FormField
                control={form.control}
                name="id_usuario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identificación (Cédula)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tu número de identificación"
                        {...field}
                        disabled={isLoading}
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
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} disabled={isLoading} type="text"/>
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
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} disabled={isLoading} type="text"/>
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="john.doe@example.com"
                        {...field}
                        type="email"
                        disabled={isLoading}
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
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <PasswordStrength
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="••••••••"
                        disabled={isLoading}
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
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+57 300 123 4567"
                          {...field}
                          disabled={isLoading}
                          type="number"
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
                      <FormLabel>Género</FormLabel>
                      <FormControl>
                        <Select
                          disabled={isLoading}
                          onChange={(e) => field.onChange(e.target.value)}
                          value={field.value}
                          className="bg-background"
                        >
                          <option value="masculino">Masculino</option>
                          <option value="femenino">Femenino</option>
                          <option value="otro">Otro</option>
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
                            disabled={isLoading}
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
              <Button type="submit" className="w-full mt-6" disabled={isLoading}>
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
      <div className="text-muted-foreground text-center text-xs text-balance">
        Al hacer clic en continuar, aceptas nuestros{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-primary">
          Términos de Servicio
        </Link>{" "}
        y{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-primary">
          Política de Privacidad
        </Link>
        .
      </div>
    </div>
  );
}