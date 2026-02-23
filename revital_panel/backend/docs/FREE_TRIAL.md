# Free Trial (14 días) – Plan Profesional

Solo el plan **Profesional** (nombre en BD: `Business` o `Professional`) incluye 14 días de prueba gratis. Emprendedor y Enterprise no tienen trial.

## Flujo

1. **Registro**: El cliente se registra y queda con `estado_cliente = 'trial'` (sin suscripción aún).
2. **Elección de plan**: Si elige el plan Profesional, al crear la suscripción se debe usar:
   - `estado_suscripcion = 'trial'`
   - `fecha_proximo_pago = fecha_actual + 14 días`
   - `precio_actual` = precio del plan (se cobrará a partir del fin del trial).
3. **Tras 14 días**: Un proceso (cron, Stripe webhook o job) debe:
   - Pasar la suscripción a `estado_suscripcion = 'activa'` y ejecutar el primer cobro, o
   - Si no hay método de pago, pasar a `expirada` y notificar.

## API

Al crear suscripción por API (por ejemplo desde el dashboard al “Elegir Plan” Profesional sin suscripción previa), enviar en el body:

- `estado_suscripcion`: `"trial"`
- `fecha_proximo_pago`: ISO 8601 de “hoy + 14 días”
- `precio_actual`: precio mensual/anual del plan (según `tipo_facturacion`)

La función `fun_insert_suscripcion` ya acepta `p_estado_suscripcion` y `p_fecha_proximo_pago`. La validación actual exige `precio_actual > 0`; para trial se envía el precio que se cobrará después del trial.

## Frontend

- Landing: texto “El plan Profesional incluye 14 días de prueba gratis”.
- Dashboard: el badge de estado ya muestra “Trial” cuando `estado_suscripcion === 'trial'`.
- Al implementar el flujo “Crear suscripción” desde la página de planes, usar los parámetros anteriores solo cuando el plan sea Profesional (por nombre o `id_plan`).
