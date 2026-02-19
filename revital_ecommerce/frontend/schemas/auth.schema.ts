import { z } from "zod";

// Misma regla que el backend: solo letras (incl. acentuadas), espacios, guión, apóstrofe, punto.
const NAME_MAX_LENGTH = 150;
const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-'.]+$/;
const nameError = "Solo letras, espacios, guión o apóstrofe.";

export const registerSchema = z.object({
  id_usuario: z.string().regex(/^[0-9]+$/, {
    message: "La identificación solo debe contener números.",
  }),
  nom_usuario: z
    .string()
    .min(1, "El nombre es requerido.")
    .max(NAME_MAX_LENGTH, `El nombre no puede superar ${NAME_MAX_LENGTH} caracteres.`)
    .regex(nameRegex, nameError),
  ape_usuario: z
    .string()
    .min(1, "El apellido es requerido.")
    .max(NAME_MAX_LENGTH, `El apellido no puede superar ${NAME_MAX_LENGTH} caracteres.`)
    .regex(nameRegex, nameError),
  email_usuario: z.string().email({
    message: "Por favor, introduce una dirección de correo válida.",
  }),
  password_usuario: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
    .refine((val) => /[A-Z]/.test(val), {
      message: "La contraseña debe incluir al menos una letra mayúscula.",
    })
    .refine((val) => /\d/.test(val), {
      message: "La contraseña debe incluir al menos un número.",
    }),
  cel_usuario: z.string().min(9, {
    message: "El número de celular debe tener al menos 9 dígitos.",
  }),
  ind_genero: z.enum(["masculino", "femenino"]),
  des_direccion: z.string().optional(),
  fec_nacimiento: z.string().optional(),
}); 

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, {
    message: "La contraseña actual es requerida.",
  }),
  new_password: z.string().min(8, {
    message: "La nueva contraseña debe tener al menos 8 caracteres.",
  }),
}).required(); 