/**
 * Billing Service
 */

import { get, post, put } from '@/utils/apiWrapper';
import type {
  InvoicePublic,
  InvoiceWithDetails,
  InvoiceHeaderCreate,
  InvoiceHeaderUpdate,
  InvoicePending,
  ResponseMessage,
} from '@/types';

export async function getInvoices(): Promise<InvoicePublic[]> {
  return await get<InvoicePublic[]>('/billing');
}

export async function getPendingInvoices(): Promise<InvoicePending[]> {
  return await get<InvoicePending[]>('/billing/pending');
}

export async function getInvoice(idInvoice: number | string): Promise<InvoiceWithDetails> {
  return await get<InvoiceWithDetails>(`/billing/${idInvoice}`);
}

export async function createInvoice(data: InvoiceHeaderCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/billing', data);
}

export async function updateInvoice(idInvoice: number | string, data: InvoiceHeaderUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/billing/${idInvoice}`, data);
}

export async function createStripeCheckoutSession(
  idInvoice: number | string
): Promise<{ checkout_url: string; session_id?: string }> {
  return await post<{ checkout_url: string; session_id?: string }>(
    `/billing/${idInvoice}/create-checkout-session`
  );
}

/**
 * Obtiene el PDF de una factura como Blob (generado por el backend).
 */
export async function getInvoicePdf(idInvoice: number | string): Promise<Blob> {
  return await get<Blob>(`/billing/${idInvoice}/pdf`, { responseType: 'blob' });
}

/**
 * Descarga el PDF de una factura. Genera el PDF en el backend y dispara la descarga en el cliente.
 */
export async function downloadInvoicePdf(
  idInvoice: number | string,
  filename: string = `invoice-${idInvoice}.pdf`
): Promise<void> {
  const blob = await getInvoicePdf(idInvoice);
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace(/\s+/g, '-');
  a.click();
  URL.revokeObjectURL(url);
}

const billingService = {
  getInvoices,
  getPendingInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  createStripeCheckoutSession,
  getInvoicePdf,
  downloadInvoicePdf,
};

export default billingService;
