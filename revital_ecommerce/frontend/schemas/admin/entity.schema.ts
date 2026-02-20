import { z } from "zod";

const trimmedMin2 = (msg = "Mínimo 2 caracteres (no solo espacios)") =>
  z.string().trim().min(2, msg);

export const categoryEntitySchema = z.object({
  name: trimmedMin2(),
  ind_activo: z.boolean().optional().default(true),
});

export const brandEntitySchema = z.object({
  nom_marca: trimmedMin2(),
  ind_activo: z.boolean().optional().default(true),
});

export const providerEntitySchemaEdit = z.object({
  nom_proveedor: z.string().optional().transform((s) => (s == null ? undefined : (s.trim() || undefined))).refine((v) => v === undefined || v.length >= 2, "Mínimo 2 caracteres (no solo espacios)"),
  email: z.union([z.string().trim().email("Email inválido"), z.literal("")]).optional(),
  tel_country_code: z.string().optional(),
  tel_numero: z.string().optional(),
  ind_activo: z.boolean().optional().default(true),
});

export const providerEntitySchemaCreate = z.object({
  nom_proveedor: trimmedMin2(),
  email: z.string().trim().min(1, "Requerido").email("Email inválido"),
  tel_country_code: z.string().min(1, "Seleccione país"),
  tel_numero: z.string().trim().min(7, "Mínimo 7 dígitos").regex(/^\d+$/, "Solo números"),
  ind_activo: z.boolean().optional().default(true),
});

export type EntityType = "category" | "brand" | "provider";

const entitySchemasEdit: Record<EntityType, z.ZodSchema> = {
  category: categoryEntitySchema,
  brand: brandEntitySchema,
  provider: providerEntitySchemaEdit,
};

const entitySchemasCreate: Record<EntityType, z.ZodSchema> = {
  category: categoryEntitySchema,
  brand: brandEntitySchema,
  provider: providerEntitySchemaCreate,
};

export function getEntitySchemas(mode: "create" | "edit"): Record<EntityType, z.ZodSchema> {
  return mode === "create" ? entitySchemasCreate : entitySchemasEdit;
}
