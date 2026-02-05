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

const billingService = {
  getInvoices,
  getPendingInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  createStripeCheckoutSession,
};

export default billingService;
