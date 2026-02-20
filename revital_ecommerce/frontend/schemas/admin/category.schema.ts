import { z } from "zod";

export const categoryModalSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres (no solo espacios)"),
  parent_id: z.union([z.number(), z.null(), z.string()]).optional().transform((v) => (v == null || v === "" || v === "none" ? null : Number(v))),
  ind_activo: z.boolean().optional().default(true),
});

export type CategoryModalFormValues = z.output<typeof categoryModalSchema>;
