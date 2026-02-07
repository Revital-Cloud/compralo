# Integración Wompi Checkout Widget

## Resumen

Esta documentación describe la implementación completa del widget embebido de Wompi para procesamiento de pagos en Revital. La integración incluye creación de pagos con firma integrity en backend, apertura del widget embebido, attach de transaction_id, long-polling server-side, webhooks firmados, y soporte para reintentos.

## Arquitectura

```
Frontend (Next.js)          Backend (FastAPI)           Wompi API
     │                            │                         │
     ├─ POST /api/payments/create─┼─ POST /payments/create │
     │                            │   (genera reference +   │
     │                            │    integrity signature)│
     │                            │                         │
     ├─ WidgetCheckout.open()─────┼───────────────────────▶│
     │                            │                         │
     ├─ POST /api/payments/       │                         │
     │    attach-transaction      │                         │
     │                            │                         │
     ├─ GET /api/payments/poll───┼─ GET /payments/poll───▶│
     │                            │   (long-polling)        │
     │                            │                         │
     │                            │◀─ Webhook ──────────────┤
     │                            │   (verificación firma)  │
```

## Variables de Entorno

### Backend

```bash
# Credenciales Wompi
WOMPI_PUBLIC_KEY=pub_test_... o pub_prod_...
WOMPI_INTEGRITY_SECRET=integrity_secret_...
WOMPI_EVENTS_SECRET=events_secret_...
WOMPI_ENVIRONMENT=sandbox  # o "production"
WOMPI_PRIVATE_KEY=prv_test_...  # Opcional, para consultas directas
```

### Frontend

```bash
# URL del backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
# o usar NEXT_PUBLIC_API_URL si ya existe

# NOTA: NO se debe exponer WOMPI_INTEGRITY_SECRET en frontend
# La firma se genera en el backend
```

## Configuración Multi-tenant

La integración soporta multi-tenant mediante la función `get_store_from_request()` en `core/tenant.py`.

### Estrategias de Identificación de Tenant

1. **Header `x-store-id`**: ID del store/tenant
2. **Subdominio**: Extraer de Host header
3. **Fallback**: Credenciales globales de `settings`

### Implementación Futura

Para implementar multi-tenant real:

1. Crear tabla `tab_stores` con credenciales Wompi por store
2. Modificar `get_store_from_request()` para consultar desde DB
3. Cachear credenciales para performance

## Endpoints Backend

### POST `/api/payments/create`

Crea un pago y retorna configuración para el widget.

**Request:**
```json
{
  "order_id": 123
}
```

**Response:**
```json
{
  "reference": "revital_123_a1b2c3d4e5",
  "amount_in_cents": 100000,
  "currency": "COP",
  "public_key": "pub_test_...",
  "integrity_signature": "sha256_hash..."
}
```

### POST `/api/payments/attach-transaction`

Asocia un transaction_id de Wompi a un payment.

**Request:**
```json
{
  "reference": "revital_123_a1b2c3d4e5",
  "transaction_id": "123456789"
}
```

### GET `/api/payments/poll?reference=...`

Hace long-polling del estado de una transacción.

**Response:**
```json
{
  "status": "APPROVED",
  "transaction_id": "123456789",
  "reference": "revital_123_a1b2c3d4e5",
  "message": null
}
```

Si sigue PENDING:
```json
{
  "status": "PENDING",
  "transaction_id": "123456789",
  "reference": "revital_123_a1b2c3d4e5",
  "message": "Te avisaremos cuando se confirme"
}
```

### POST `/api/payments/reattempt`

Crea un nuevo pago para reintentar uno fallido.

**Request:**
```json
{
  "order_id": 123
}
```

**Response:** Mismo formato que `/payments/create`

## Webhook

### POST `/api/payment/webhook`

Endpoint público para recibir eventos de Wompi.

### Verificación de Firma

El webhook usa verificación dinámica basada en `signature.properties`:

```json
{
  "event": "transaction.updated",
  "data": {
    "transaction": {
      "id": "123456789",
      "reference": "revital_123_a1b2c3d4e5",
      "status": "APPROVED"
    }
  },
  "signature": {
    "properties": ["event", "data.transaction.id", "data.transaction.status"],
    "checksum": "sha256_hash...",
    "timestamp": 1234567890
  }
}
```

**Algoritmo de verificación:**
1. Concatenar valores según `signature.properties` en orden
2. Agregar `timestamp`
3. Agregar `events_secret`
4. SHA256 del string resultante
5. Comparar con `signature.checksum` usando `hmac.compare_digest`

### Ejemplo Payload Webhook

```json
{
  "event": "transaction.updated",
  "data": {
    "transaction": {
      "id": "123456789",
      "reference": "revital_123_a1b2c3d4e5",
      "status": "APPROVED",
      "amount_in_cents": 100000,
      "currency": "COP",
      "payment_method": {
        "type": "CARD",
        "extra": {
          "bin": "411111",
          "name": "VISA",
          "exp_year": "2025",
          "exp_month": "12",
          "card_holder": {
            "full_name": "Juan Pérez"
          }
        }
      },
      "created_at": "2025-01-15T10:30:00Z",
      "finalized_at": "2025-01-15T10:30:05Z"
    }
  },
  "signature": {
    "properties": ["event", "data.transaction.id", "data.transaction.status"],
    "checksum": "a1b2c3d4e5f6...",
    "timestamp": 1705315800
  }
}
```

## Flujo Completo de Pago

1. **Usuario hace click en "Pagar"**
   - Frontend llama `POST /api/payments/create` con `order_id`

2. **Backend crea payment**
   - Valida orden existe y está pagable
   - Genera `reference` única: `revital_{order_id}_{random10}`
   - Genera firma integrity SHA256
   - Crea registro Payment con status CREATED
   - Retorna configuración del widget

3. **Frontend abre widget**
   - Instancia `new WidgetCheckout({ ... })`
   - Llama `checkout.open((result) => { ... })`

4. **Widget procesa pago**
   - Usuario selecciona método de pago
   - Wompi procesa la transacción
   - Widget retorna resultado en callback

5. **Frontend attach transaction_id**
   - Extrae `transaction.id` del resultado
   - Llama `POST /api/payments/attach-transaction`
   - Backend actualiza payment con `wompi_transaction_id`

6. **Frontend inicia polling**
   - Llama `GET /api/payments/poll?reference=...` cada 2s
   - Backend hace long-polling contra Wompi (máx 30s)
   - Si estado final: actualiza payment y marca orden pagada

7. **Webhook confirma (fuente de verdad)**
   - Wompi envía webhook cuando cambia estado
   - Backend verifica firma y actualiza payment
   - Marca orden pagada si APPROVED (idempotente)

## Estados de Pago

- **CREATED**: Payment creado, widget no abierto aún
- **PENDING**: Widget abierto, transacción en proceso
- **APPROVED**: Pago exitoso
- **DECLINED**: Pago rechazado
- **VOIDED**: Pago anulado
- **ERROR**: Error durante el pago

## Reintentos

Si un pago falla (DECLINED, ERROR, VOIDED), se puede reintentar:

1. Frontend llama `POST /api/payments/reattempt` con `order_id`
2. Backend valida último payment está en estado que permite reintento
3. Crea nuevo payment con nueva `reference` única
4. Setea `parent_payment_id` al payment anterior
5. Retorna configuración para nuevo widget

## Pruebas en Sandbox

### Probar Pago Aprobado

1. Usar tarjeta de prueba: `4242 4242 4242 4242`
2. CVV: cualquier 3 dígitos
3. Fecha: cualquier fecha futura
4. Resultado: Estado APPROVED inmediatamente

### Probar Pago Pendiente

1. Usar método PSE o Nequi
2. Resultado: Estado PENDING
3. El polling detectará cuando cambie a APPROVED

### Probar Pago Rechazado

1. Usar tarjeta de prueba rechazada: `4000 0000 0000 0002`
2. Resultado: Estado DECLINED
3. Se puede reintentar con `/payments/reattempt`

## Migración de Base de Datos

Ejecutar la migración SQL:

```bash
psql -d revital_db -f db/migrations/add_payment_reference_fields.sql
```

Esta migración agrega:
- Campo `reference` (VARCHAR(255) UNIQUE)
- Campo `parent_payment_id` (INTEGER, FK a tab_pagos)
- Campo `raw_last_event` (JSONB)
- Hace `provider_transaction_id` nullable
- Índices necesarios

## Seguridad

1. **Firma Integrity**: Siempre generada en backend, nunca en frontend
2. **Webhook Signature**: Verificación dinámica con `signature.properties`
3. **Idempotencia**: Webhook no repite efectos si payment ya está en estado final
4. **Transacciones DB**: Uso de transacciones al marcar orden pagada
5. **CSP Headers**: Configurados para permitir solo `checkout.wompi.co`

## Troubleshooting

### Widget no se carga

- Verificar CSP headers permiten `https://checkout.wompi.co`
- Verificar script está en `app/layout.tsx`
- Verificar conexión a internet

### Firma inválida

- Verificar `WOMPI_INTEGRITY_SECRET` está configurado
- Verificar formato de `reference` es correcto
- Verificar orden de concatenación: `reference + amount_in_cents + currency + secret`

### Webhook no funciona

- Verificar `WOMPI_EVENTS_SECRET` está configurado
- Verificar URL del webhook está configurada en dashboard de Wompi
- Verificar firma usando logs del backend

### Polling no detecta cambios

- Verificar `wompi_transaction_id` está attachado
- Verificar `WOMPI_ENVIRONMENT` es correcto (sandbox/production)
- Verificar endpoint público de Wompi es accesible

## Referencias

- [Documentación Wompi Widget](https://docs.wompi.co/docs/widget-de-pago)
- [Documentación Wompi Webhooks](https://docs.wompi.co/docs/webhooks)
- [Documentación Wompi API](https://docs.wompi.co/docs/api)

