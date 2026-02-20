import { z } from "zod";

export const addressSchema = z.object({
  nombre_direccion: z.string().trim().min(1, "Nombre requerido (no solo espacios)"),
  calle_direccion: z.string().trim().min(1, "Dirección requerida (no solo espacios)"),
  ciudad: z.string().trim().min(1, "Ciudad requerida (no solo espacios)"),
  departamento: z.string().trim().min(1, "Departamento requerido (no solo espacios)"),
  codigo_postal: z.string().trim().min(1, "Código postal requerido (no solo espacios)"),
  barrio: z.string().trim().min(1, "Barrio requerido (no solo espacios)"),
  referencias: z.string().trim().optional().or(z.literal("")),
  complemento: z.string().trim().optional().or(z.literal("")),
});

export type AddressFormValues = z.infer<typeof addressSchema>;
