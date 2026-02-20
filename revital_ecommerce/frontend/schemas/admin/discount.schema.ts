import { z } from "zod";

/** Schema para modales de crear/editar descuento (formulario completo). */
export const discountModalSchema = z.object({
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
  val_descuento: z.string().trim().min(1, "El valor es requerido"),
  aplica_a: z.string().min(1, "Seleccione a qué aplica el descuento"),
  id_producto_aplica: z.string().optional(),
  id_categoria_aplica: z.string().optional(),
  id_marca_aplica: z.string().optional(),
  monto_min_compra: z.string().optional(),
  val_puntos_requeridos: z.string().optional(),
  cod_cupon: z.string().optional(),
  costo_envio: z.string().optional(),
  compra_minima: z.string().optional(),
  fec_inicio: z.string().optional(),
  fec_fin: z.string().optional(),
  max_usos: z.string().optional(),
  max_usos_por_usuario: z.string().optional(),
  ind_activo: z.boolean(),
  ind_canjeable_puntos: z.boolean(),
  ind_es_para_cumpleanos: z.boolean(),
  solo_primera_compra: z.boolean(),
  monto_minimo_producto: z.string().optional(),
  cantidad_minima_producto: z.string().optional(),
  requiere_codigo: z.boolean(),
  id_usuario_destino: z.string().optional(),
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
