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
  return await get<InvoicePending[]>('/billing/pendientes');
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

const billingService = {
  getInvoices,
  getPendingInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
};

export default billingService;
