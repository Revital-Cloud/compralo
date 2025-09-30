import { post, get, put } from '@/utils/apiWrapper';

export interface AddressCreateRequest {
  id_usuario: number;
  nombre_direccion: string;
  calle_direccion: string;
  ciudad: string;
  departamento: string;
  codigo_postal: string;
  barrio: string;
  referencias?: string | null;
  complemento?: string | null;
  ind_principal?: boolean;
  ind_activa?: boolean;
}

export interface AddressItem {
  id_direccion: number;
  id_usuario: number;
  nombre_direccion: string;
  calle_direccion: string;
  ciudad: string;
  departamento: string;
  codigo_postal: string;
  barrio: string;
  referencias?: string | null;
  complemento?: string | null;
  ind_principal?: boolean;
  ind_activa?: boolean;
}

export async function createAddress(payload: AddressCreateRequest): Promise<{ message: string }> {
  return await post<{ message: string }>('/address', payload);
}

export interface AddressUpdateRequest {
  id_usuario?: number;
  nombre_direccion?: string;
  calle_direccion?: string;
  ciudad?: string;
  departamento?: string;
  codigo_postal?: string;
  barrio?: string;
  referencias?: string | null;
  complemento?: string | null;
  ind_principal?: boolean;
  ind_activa?: boolean;
}

export async function updateAddress(id_direccion: number, payload: AddressUpdateRequest): Promise<{ message: string }> {
  return await put<{ message: string }>(`/address/${id_direccion}`, payload);
}

export async function deactivateAddress(id_direccion: number, id_usuario: number): Promise<{ message: string }> {
  return await put<{ message: string }>(`/address/${id_direccion}-${id_usuario}/deactivate`, {});
}

export async function getMyAddresses(): Promise<AddressItem[]> {
  return await get<AddressItem[]>('/addresses');
}

const addressService = { createAddress, getMyAddresses, updateAddress, deactivateAddress };
export default addressService;


