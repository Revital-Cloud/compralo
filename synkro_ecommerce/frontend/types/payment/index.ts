export interface PaymentMethod {
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    is_default: boolean;
}

export interface MetodoPagoUsuario {
    id_metodo_pago: number;
    id_usuario: number;
    provider_name: string;
    provider_source_id: string;
    brand: string;
    last_four_digits: string;
    card_holder: string;
    expiration_month: number;
    expiration_year: number;
    is_default: boolean;
}

export interface AddPaymentMethodResponse extends MetodoPagoUsuario {
    success: boolean;
    message: string;
}

export interface WompiError {
    type: string;
    reason?: string;
    messages?: {
        [key: string]: string[];
    };
}

export interface CardTokenData {
    id: string;
    created_at: string;
    brand: string;
    name: string;
    last_four: string;
    bin: string;
    exp_year: string;
    exp_month: string;
    card_holder: string;
    created_with_cvc: boolean;
    expires_at: string;
    validity_ends_at: string;
}

export interface WompiTokenResponse {
    status: 'CREATED' | 'ERROR';
    data: CardTokenData;
    error?: WompiError;
} 