import { z } from "zod";

export const profileSchema = z.object({
  nom_usuario: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").optional(),
  ape_usuario: z.string().min(2, "El apellido debe tener al menos 2 caracteres.").optional(),
  email_usuario: z.string().email("Por favor, introduce una dirección de correo válida.").optional(),
  cel_usuario: z.string().min(9, "El número de celular debe tener al menos 9 dígitos.").optional(),
  des_direccion: z.string().optional(),
  fec_nacimiento: z.string().optional(),
  // La contraseña es opcional, pero si se proporciona, debe tener al menos 8 caracteres.
  password_usuario: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").optional().or(z.literal('')),
}); 