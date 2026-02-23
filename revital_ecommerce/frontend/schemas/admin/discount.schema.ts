import { z } from "zod";

function parseYmdToLocalDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Opcional: si el string tiene valor, debe ser un número >= 0 */
const optionalNonNegative = (msg = "No puede ser negativo") =>
  z.string().optional().refine((s) => !s?.trim() || (() => { const n = Number(String(s).replace(",", ".")); return !Number.isNaN(n) && n >= 0; })(), msg);

/** Schema para modales de crear/editar descuento (formulario completo). */
export const discountModalSchema = z
  .object({
  nom_descuento: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres (no solo espacios)"),
  des_descuento: z
    .string()
    .trim()
    .min(3, "La descripción debe tener al menos 3 caracteres (no solo espacios)"),
  tipo_descuento: z.enum(["porcentaje", "monto_fijo"], {
    message: "Seleccione un tipo de descuento",
  }),
  val_descuento: z
    .string()
    .trim()
    .min(1, "El valor es requerido")
    .refine((s) => {
      const n = Number(s.replace(",", "."));
      return !Number.isNaN(n) && n >= 0;
    }, "El valor no puede ser negativo"),
  aplica_a: z.string().min(1, "Seleccione a qué aplica el descuento"),
  id_producto_aplica: z.string().optional(),
  id_categoria_aplica: z.string().optional(),
  id_marca_aplica: z.string().optional(),
  monto_min_compra: optionalNonNegative(),
  val_puntos_requeridos: optionalNonNegative(),
  cod_cupon: z.string().optional(),
  costo_envio: optionalNonNegative(),
  compra_minima: optionalNonNegative(),
  fec_inicio: z.string().optional(),
  fec_fin: z.string().optional(),
  max_usos: optionalNonNegative(),
  max_usos_por_usuario: optionalNonNegative(),
  ind_activo: z.boolean(),
  ind_canjeable_puntos: z.boolean(),
  ind_es_para_cumpleanos: z.boolean(),
  solo_primera_compra: z.boolean(),
  monto_minimo_producto: optionalNonNegative(),
  cantidad_minima_producto: z
    .string()
    .optional()
    .refine(
      (s) => {
        if (!s || !s.trim()) return true;
        const n = Number(s.replace(",", "."));
        return !Number.isNaN(n) && n >= 1;
      },
      { message: "La cantidad mínima debe ser al menos 1" }
    ),
  requiere_codigo: z.boolean(),
  id_usuario_destino: z.string().optional(),
})
  .superRefine((v, ctx) => {
    const start = v.fec_inicio?.trim() ? parseYmdToLocalDate(v.fec_inicio) : null;
    const end = v.fec_fin?.trim() ? parseYmdToLocalDate(v.fec_fin) : null;

    // Validar rango de fechas solo si ambas están presentes
    if (start && end && start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fec_fin"],
        message: "La fecha de fin debe ser mayor o igual a la fecha de inicio",
      });
    }

    // Si es canjeable por puntos, los puntos requeridos son obligatorios y > 0
    if (v.ind_canjeable_puntos) {
      const raw = v.val_puntos_requeridos?.trim();
      if (!raw) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["val_puntos_requeridos"],
          message: "Si el descuento es canjeable por puntos, debe especificar los puntos requeridos",
        });
        return;
      }
      const n = Number(raw.replace(",", "."));
      if (Number.isNaN(n) || n <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["val_puntos_requeridos"],
          message: "Los puntos requeridos deben ser mayores a 0",
        });
      }
    }
  });

export type DiscountModalFormData = z.infer<typeof discountModalSchema>;

/** Schema para página de crear descuento (campos simplificados). */
export const discountPageCreateSchema = z.object({
  nom_descuento: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres (no solo espacios)"),
  des_descuento: z
    .string()
    .trim()
    .min(3, "La descripción debe tener al menos 3 caracteres (no solo espacios)"),
  tipo_calculo: z.boolean(),
  val_porce_descuento: z.number().optional(),
  val_monto_descuento: z.number().optional(),
  aplica_a: z.string().optional(),
  min_valor_pedido: z.number().optional(),
  costo_puntos_canje: z.number().optional(),
  codigo_descuento: z.string().optional(),
  fec_inicio: z.string().optional(),
  fec_fin: z.string().optional(),
  max_usos_total: z.number().optional(),
  ind_activo: z.boolean(),
});

export type DiscountPageCreateFormData = z.infer<typeof discountPageCreateSchema>;

/** Schema para página de editar descuento. */
export const discountPageEditSchema = z.object({
  des_descuento: z
    .string()
    .trim()
    .min(3, "La descripción debe tener al menos 3 caracteres (no solo espacios)"),
  tipo_calculo: z.string(),
  val_porce_descuento: z.number().optional(),
  val_monto_descuento: z.number().optional(),
  min_valor_pedido: z.number().optional(),
  costo_puntos_canje: z.number().optional(),
  codigo_descuento: z.string().optional(),
  fec_inicio: z.string().optional(),
  fec_fin: z.string().optional(),
  max_usos_total: z.number().optional(),
  ind_activo: z.boolean(),
});

export type DiscountPageEditFormData = z.infer<typeof discountPageEditSchema>;
