/**
 * Billing Service
 */

import { get, post, put, del, getStoredToken } from '@/utils/apiWrapper';
import type {
  InvoicePublic,
  InvoiceWithDetails,
  InvoiceHeaderCreate,
  InvoiceHeaderUpdate,
  ResponseMessage,
} from '@/types';

const BILLING_BASE = '/billing';

export async function getInvoices(): Promise<InvoicePublic[]> {
  return await get<InvoicePublic[]>(BILLING_BASE);
}

export async function getPendingInvoices(): Promise<any[]> {
  return await get<any[]>(`${BILLING_BASE}/pending`);
}

export async function getInvoice(idInvoice: number | string): Promise<InvoiceWithDetails> {
  return await get<InvoiceWithDetails>(`${BILLING_BASE}/${idInvoice}`);
}

export async function createInvoice(data: InvoiceHeaderCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>(BILLING_BASE, data);
}

export async function updateInvoice(idInvoice: number | string, data: InvoiceHeaderUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`${BILLING_BASE}/${idInvoice}`, data);
}

export async function deleteInvoice(idInvoice: number | string): Promise<ResponseMessage> {
  return await del<ResponseMessage>(`${BILLING_BASE}/${idInvoice}`);
}

export interface StripeCheckoutSessionResponse {
  checkout_url: string | null;
  session_id?: string;
}

export async function createStripeCheckoutSession(idInvoice: number | string): Promise<StripeCheckoutSessionResponse> {
  return await post<StripeCheckoutSessionResponse>(`${BILLING_BASE}/${idInvoice}/create-checkout-session`);
}

export async function downloadInvoicePdf(idInvoice: number | string, filename: string): Promise<void> {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const token = getStoredToken();
  const url = `${baseURL}${BILLING_BASE}/${idInvoice}/pdf`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to download PDF');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

const billingService = {
  getInvoices,
  getPendingInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  createStripeCheckoutSession,
  downloadInvoicePdf,
};

export default billingService;
