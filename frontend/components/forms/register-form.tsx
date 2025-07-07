"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { registerSchema } from "@/schemas/auth.schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      id_usuario: "",
      nom_usuario: "",
      ape_usuario: "",
      email_usuario: "",
      password_usuario: "",
      cel_usuario: "",
      des_direccion: "",
      fec_nacimiento: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      // El backend espera `id_rol` y un booleano para `ind_genero`.
      // Asumimos rol de cliente (2) por defecto para el registro.
      const dataToSubmit = {
        ...values,
        id_rol: 2,
        ind_genero: values.ind_genero === "masculino", // true para masculino, false para los demás
      };
      await registerUser(dataToSubmit);
      toast.success("¡Cuenta creada!", {
        description: "Hemos creado tu cuenta exitosamente. Serás redirigido.",
      });
      
      // Redirigir al inicio después de un breve retraso para que el toast sea visible
      setTimeout(() => {
        router.push('/');
      }, 1000);

    } catch (error) {
      toast.error("Error en el registro", {
        description: "No se pudo crear la cuenta. Por favor, revisa los datos.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="id_usuario"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Identificación (DNI/Cédula)</FormLabel>
              <FormControl>
                <Input placeholder="Tu número de identificación" {...field} />
              </FormControl>
              <FormMessage />
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
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
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
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
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
                <Input placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
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
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cel_usuario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Celular</FormLabel>
                <FormControl>
                  <Input placeholder="987654321" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ind_genero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Género</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu género" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="des_direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Av. Siempre Viva 123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fec_nacimiento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Nacimiento (Opcional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Crear cuenta
        </Button>
      </form>
    </Form>
  );
}