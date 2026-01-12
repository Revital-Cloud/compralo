/**
 * Subscription Types
 */

export type BillingType = 'mensual' | 'anual' | 'trimestral';

export type PaymentMethod =
  | 'tarjeta'
  | 'transferencia'
  | 'paypal'
  | 'stripe'
  | 'wompi'
  | 'pse'
  | 'efectivo'
  | 'crypto'
  | 'otro';

export type SubscriptionStatus = 'activa' | 'cancelada' | 'suspendida' | 'expirada' | 'trial';

export interface SubscriptionBase {
  identificacion_fiscal_cliente: string;
  id_plan: number | string;
  id_instancia?: number | string | null;
  tipo_facturacion?: BillingType;
  precio_actual: number | string;
  metodo_pago?: PaymentMethod | null;
}

export interface SubscriptionCreate extends SubscriptionBase {
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  fecha_proximo_pago?: string | null;
  estado_suscripcion?: SubscriptionStatus;
}

export interface SubscriptionUpdate {
  id_plan?: number | string;
  id_instancia?: number | string | null;
  tipo_facturacion?: BillingType;
  precio_actual?: number | string;
  fecha_fin?: string | null;
  fecha_proximo_pago?: string | null;
  estado_suscripcion?: SubscriptionStatus;
  metodo_pago?: PaymentMethod | null;
  fecha_cancelacion?: string | null;
  motivo_cancelacion?: string | null;
}

export interface SubscriptionPublic {
  id_suscripcion: number | string;
  identificacion_fiscal_cliente: string;
  id_plan: number | string;
  id_instancia?: number | string | null;
  tipo_facturacion: string;
  precio_actual: number | string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  fecha_proximo_pago?: string | null;
  estado_suscripcion: string;
  metodo_pago?: string | null;
  fecha_cancelacion?: string | null;
  motivo_cancelacion?: string | null;
}
