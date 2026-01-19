/**
 * Billing Types
 */

import type { Currency } from './plan';
import type { PaymentMethod } from './subscription';

export type PaymentStatus = 'pendiente' | 'pagado' | 'fallido' | 'reembolsado' | 'cancelado';

export interface InvoiceDetailBase {
  num_linea: number;
  concepto: string;
  cantidad?: number | string;
  precio_unitario: number | string;
  descuento_linea?: number | string;
  impuesto_linea?: number | string;
  id_plan?: number | string | null;
  id_instancia?: number | string | null;
  metadata_json?: Record<string, any> | null;
}

export interface InvoiceDetailCreate extends InvoiceDetailBase {}

export interface InvoiceDetail extends InvoiceDetailBase {
  id_detalle: number | string;
  id_factura: number | string;
  subtotal_linea: number | string;
  total_linea: number | string;
}

export interface InvoiceHeaderBase {
  id_suscripcion: number | string;
  identificacion_fiscal_cliente: string;
  moneda?: Currency;
  metodo_pago?: PaymentMethod | null;
  fecha_vencimiento?: string | null;
  periodo_facturado_desde?: string | null;
  periodo_facturado_hasta?: string | null;
  notas?: string | null;
}

export interface InvoiceHeaderCreate extends InvoiceHeaderBase {
  detalles?: InvoiceDetailCreate[];
}

export interface InvoiceHeaderUpdate {
  estado_pago?: PaymentStatus;
  metodo_pago?: PaymentMethod | null;
  fecha_pago?: string | null;
  referencia_pago?: string | null;
  notas?: string | null;
}

export interface InvoicePublic {
  id_factura: number | string;
  id_suscripcion: number | string;
  identificacion_fiscal_cliente: string;
  num_factura: string;
  fecha_emision: string;
  fecha_vencimiento?: string | null;
  fecha_pago?: string | null;
  moneda: string;
  subtotal: number | string;
  impuestos: number | string;
  descuentos: number | string;
  total: number | string;
  estado_pago: string;
  metodo_pago?: string | null;
  referencia_pago?: string | null;
  periodo_facturado_desde?: string | null;
  periodo_facturado_hasta?: string | null;
  notas?: string | null;
}

export interface InvoiceWithDetails extends InvoicePublic {
  detalles: InvoiceDetail[];
}
