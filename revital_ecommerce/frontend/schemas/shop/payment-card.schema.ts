import { z } from "zod";

export const paymentCardSchema = z.object({
  card_holder: z.string().min(1, "Nombre requerido"),
  number: z.string().min(13, "Número de tarjeta inválido").max(19, "Número de tarjeta inválido"),
  exp_month: z.string().length(2, "Mes inválido"),
  exp_year: z.string().length(2, "Año inválido"),
  cvc: z.string().min(3, "CVC inválido").max(4, "CVC inválido"),
});

export type PaymentCardFormValues = z.infer<typeof paymentCardSchema>;
