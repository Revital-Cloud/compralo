import { z } from "zod";

export const editUserSchema = z.object({
  nom_usuario: z.string().trim().min(1, "Nombre requerido (no solo espacios)"),
  ape_usuario: z.string().trim().optional(),
  email_usuario: z.string().trim().email("Email inválido"),
  cel_usuario: z.string().optional(),
  ind_genero: z.boolean().optional(),
  fec_nacimiento: z.string().optional(),
});

export type EditUserFormData = z.infer<typeof editUserSchema>;
