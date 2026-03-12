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
    .refine((val) => /[a-z]/.test(val), {
      message: "La contraseña debe incluir al menos una letra minúscula.",
    })
    .refine((val) => /[A-Z]/.test(val), {
      message: "La contraseña debe incluir al menos una letra mayúscula.",
    })
    .refine((val) => /\d/.test(val), {
      message: "La contraseña debe incluir al menos un número.",
    })
    .refine((val) => /[^A-Za-z0-9]/.test(val), {
      message: "La contraseña debe incluir al menos un carácter especial.",
    }),
  cel_usuario: z
    .string()
    .regex(/^\d+$/, {
      message: "El número de celular solo debe contener dígitos.",
    })
    .min(9, {
      message: "El número de celular debe tener al menos 9 dígitos.",
    })
    .max(10, {
      message: "El número de celular no puede tener más de 10 dígitos.",
    }),
  ind_genero: z.enum(["masculino", "femenino"]),
  des_direccion: z.string().optional(),
  fec_nacimiento: z.string().optional(),
}); 

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, {
    message: "La contraseña actual es requerida.",
  }),
  new_password: z
    .string()
    .min(8, { message: "La nueva contraseña debe tener al menos 8 caracteres." })
    .refine((val) => /[a-z]/.test(val), {
      message: "La contraseña debe incluir al menos una letra minúscula.",
    })
    .refine((val) => /[A-Z]/.test(val), {
      message: "La contraseña debe incluir al menos una letra mayúscula.",
    })
    .refine((val) => /\d/.test(val), {
      message: "La contraseña debe incluir al menos un número.",
    })
    .refine((val) => /[^A-Za-z0-9]/.test(val), {
      message: "La contraseña debe incluir al menos un carácter especial.",
    }),
  confirm_new_password: z.string().min(1, {
    message: "Confirma tu nueva contraseña.",
  }),
})
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm_new_password"],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: "La nueva contraseña no puede ser igual a la contraseña actual.",
    path: ["new_password"],
  })
  .required();