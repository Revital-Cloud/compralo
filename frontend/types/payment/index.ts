export interface PaymentMethod {
  id_metodo_pago: number;
  provider_name: string;
  brand: string;
  last_four_digits: string;
  expiration_month: number;
  expiration_year: number;
  is_default: boolean;
} 