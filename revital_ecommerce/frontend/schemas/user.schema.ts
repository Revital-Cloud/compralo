import { z } from "zod";

// Misma regla que el backend: solo letras (incl. acentuadas), espacios, guión, apóstrofe, punto.
const NAME_MAX_LENGTH = 150;
const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-'.]+$/;
const nameError = "Solo letras, espacios, guión o apóstrofe.";

export const profileSchema = z.object({
  nom_usuario: z
    .string()
    .optional()
    .refine(
      (v) =>
        v === undefined ||
        v === "" ||
        v.trim() === "" ||
        (v.length <= NAME_MAX_LENGTH && nameRegex.test(v.trim())),
      nameError
    ),
  ape_usuario: z
    .string()
    .optional()
    .refine(
      (v) =>
        v === undefined ||
        v === "" ||
        v.trim() === "" ||
        (v.length <= NAME_MAX_LENGTH && nameRegex.test(v.trim())),
      nameError
    ),
  email_usuario: z.string().email("Por favor, introduce una dirección de correo válida.").optional(),
  cel_usuario: z
    .string()
    .optional()
    .refine(
      (v) =>
        v === undefined ||
        v === "" ||
        /^\d{9,10}$/.test(v),
      {
        message: "El número de celular debe tener entre 9 y 10 dígitos y solo números.",
      }
    ),
  des_direccion: z.string().optional(),
  fec_nacimiento: z.string().optional(),
  avatar_seed: z.string().nullable().optional(), // Seed para el avatar de Facehash
  avatar_colors: z.string().nullable().optional(), // Colores hex separados por coma, ej. "#ec4899,#3b82f6"
  // La contraseña es opcional, pero si se proporciona, debe tener al menos 8 caracteres.
  password_usuario: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").optional().or(z.literal('')),
}); 