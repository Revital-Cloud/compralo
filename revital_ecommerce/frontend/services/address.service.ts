import { post, get, put } from '@/utils/apiWrapper';

/**
 * Service de direcciones (frontend).
 *
 * Responsabilidad:
 * - Encapsular llamadas HTTP a endpoints del backend para CRUD/estado de direcciones.
 * - Exponer una API tipada para los tabs de perfil (`AddressesTab`).
 *
 * Endpoints (según uso actual):
 * - `POST /address` -> crear
 * - `PUT /address/:id_direccion` -> actualizar
 * - `PUT /address/:id_direccion-:id_usuario/deactivate` -> desactivar
 * - `PUT /address/:id_direccion-:id_usuario/deactivate-main` -> desactivar como principal
 * - `GET /addresses` -> listar mis direcciones
 */
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

/**
 * Crea una nueva dirección.
 *
 * Nota:
 * - El payload incluye los flags `ind_principal` y `ind_activa` cuando aplica.
 */
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

/**
 * Actualiza el contenido de una dirección existente.
 *
 * Importante:
 * - El backend decide cómo tratar flags booleanos (principal/activa) según su lógica SQL.
 */
export async function updateAddress(id_direccion: number, payload: AddressUpdateRequest): Promise<{ message: string }> {
  return await put<{ message: string }>(`/address/${id_direccion}`, payload);
}

/** Desactiva una dirección (soft deactivation en backend). */
export async function deactivateAddress(id_direccion: number, id_usuario: number): Promise<{ message: string }> {
  return await put<{ message: string }>(`/address/${id_direccion}-${id_usuario}/deactivate`, {});
}

/** Desactiva la condición de “principal” de una dirección. */
export async function deactivateMainAddress(id_direccion: number, id_usuario: number): Promise<{ message: string }> {
  return await put<{ message: string }>(`/address/${id_direccion}-${id_usuario}/deactivate-main`, {});
}

/** Lista direcciones asociadas al usuario autenticado (sesión por cookies/tokens). */
export async function getMyAddresses(): Promise<AddressItem[]> {
  return await get<AddressItem[]>('/addresses');
}

const addressService = { createAddress, getMyAddresses, updateAddress, deactivateAddress, deactivateMainAddress };
export default addressService;


