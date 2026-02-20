import { z } from "zod";

export const informationSchema = z.object({
  deliveryMethod: z.enum(["ship", "pickup"]).optional(),
  nombre: z.string().trim().min(1, "Nombre requerido (no solo espacios)"),
  apellidos: z.string().trim().min(1, "Apellidos requeridos (no solo espacios)"),
  direccion: z.string().trim().min(1, "Debes seleccionar o crear una dirección"),
  complemento: z.string().trim().optional().or(z.literal("")),
  pais: z.string().trim().min(1, "País requerido (no solo espacios)"),
  departamento: z.string().trim().min(1, "Departamento requerido (no solo espacios)"),
  ciudad: z.string().trim().min(1, "Ciudad requerida (no solo espacios)"),
  codigo_postal: z.string().trim().optional().or(z.literal("")),
  barrio: z.string().trim().optional().or(z.literal("")),
  referencias: z.string().trim().optional().or(z.literal("")),
  celular: z.string().trim().min(10, "Celular inválido"),
});

export const shippingSchema = z.object({
  shippingMethod: z.string().min(1, "Debes seleccionar un método de envío"),
});

export const paymentSchema = z.object({
  paymentMethod: z.string().min(1, "Debes seleccionar un método de pago"),
  useShippingAddress: z.boolean(),
  tipoIdentificacion: z.string().optional(),
  numeroIdentificacion: z.string().optional(),
  notas: z.string().optional(),
});

export type InformationFormData = z.infer<typeof informationSchema>;
export type ShippingFormData = z.infer<typeof shippingSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
