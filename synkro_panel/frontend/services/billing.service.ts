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
  return await get<InvoicePublic[]>('/facturacion');
}

export async function getPendingInvoices(): Promise<InvoicePending[]> {
  return await get<InvoicePending[]>('/facturacion/pendientes');
}

export async function getInvoice(idInvoice: number | string): Promise<InvoiceWithDetails> {
  return await get<InvoiceWithDetails>(`/facturacion/${idInvoice}`);
}

export async function createInvoice(data: InvoiceHeaderCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/facturacion', data);
}

export async function updateInvoice(idInvoice: number | string, data: InvoiceHeaderUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/facturacion/${idInvoice}`, data);
}

const billingService = {
  getInvoices,
  getPendingInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
};

export default billingService;
