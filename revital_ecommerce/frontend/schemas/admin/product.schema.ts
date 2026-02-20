import { z } from "zod";

export const productFormSchema = z.object({
  nom_producto: z.string().trim().min(1, "El nombre del producto es requerido (no solo espacios)"),
  des_producto: z.string().trim().min(1, "La descripción es requerida (no solo espacios)"),
  val_precio: z
    .string()
    .trim()
    .min(1, "El precio es requerido")
    .refine(
      (val) => !Number.isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "El precio debe ser un número válido mayor a 0"
    ),
  num_stock: z
    .string()
    .min(1, "El stock es requerido")
    .refine(
      (val) => !Number.isNaN(parseInt(val, 10)) && parseInt(val, 10) >= 0,
      "El stock debe ser un número válido mayor o igual a 0"
    ),
  id_categoria: z.string().min(1, "La categoría es requerida"),
  id_marca: z.string().min(1, "La marca es requerida"),
  id_proveedor: z.string().min(1, "El proveedor es requerido"),
  tags: z.array(z.string()).default([]),
  spcf_producto: z.record(z.string(), z.unknown()).default({}),
});

export type ProductFormData = z.input<typeof productFormSchema> & {
  tags: string[];
  spcf_producto: Record<string, unknown>;
};

export const productFormCompositeSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres (no solo espacios)"),
  category_id: z.coerce.number().min(1, "Seleccione al menos Línea (o Línea y Sublínea)"),
  id_marca: z.union([z.coerce.number(), z.null()]).optional(),
  id_proveedor: z.union([z.coerce.number(), z.null()]).optional(),
  description: z.string().trim().optional(),
  is_active: z.boolean().optional().default(true),
});

export type ProductFormCompositeFields = z.output<typeof productFormCompositeSchema>;
