import { z } from "zod";

export const attributeSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio (no solo espacios)"),
  data_type: z.enum(["text", "number", "boolean"], { message: "Seleccione un tipo de dato" }),
  has_predefined_values: z.boolean().optional().default(false),
});

export type AttributeFormValues = z.infer<typeof attributeSchema>;

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const attributeValueSchema = z.object({
  value: z.string().trim().min(1, "El valor es obligatorio (no solo espacios)"),
  hex_color: z
    .string()
    .optional()
    .refine((v) => !v || v.trim() === "" || HEX_REGEX.test(v.trim()), "Color debe ser #RRGGBB"),
  sort_order: z.coerce.number().min(0).default(0),
  is_active: z.boolean().default(true),
});

export type AttributeValueFormValues = z.infer<typeof attributeValueSchema>;
