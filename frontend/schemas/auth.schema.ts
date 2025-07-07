import { z } from "zod";

export const registerSchema = z.object({
  id_usuario: z.string().regex(/^[0-9]+$/, {
    message: "La identificación solo debe contener números.",
  }),
  nom_usuario: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  ape_usuario: z.string().min(2, {
    message: "El apellido debe tener al menos 2 caracteres.",
  }),
  email_usuario: z.string().email({
    message: "Por favor, introduce una dirección de correo válida.",
  }),
  password_usuario: z.string().min(8, {
    message: "La contraseña debe tener al menos 8 caracteres.",
  }),
  cel_usuario: z.string().min(9, {
    message: "El número de celular debe tener al menos 9 dígitos.",
  }),
  ind_genero: z.enum(["masculino", "femenino", "otro"]),
  des_direccion: z.string().optional(),
  fec_nacimiento: z.string().optional(),
}); 