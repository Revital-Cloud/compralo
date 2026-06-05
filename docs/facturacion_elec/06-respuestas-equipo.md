# Decisiones del equipo — Sesión de planeación

**Fecha de registro:** 2025-06-05  
**Rama de trabajo:** `feat/facturacion-electronica`  
**Proveedor tecnológico:** [Factus API](https://developers.factus.com.co/)

Este documento consolida las decisiones tomadas durante la sesión de análisis y planeación. Las decisiones pendientes se documentan en [05-decisiones-pendientes.md](./05-decisiones-pendientes.md).

---

## Decisiones confirmadas

### Emisor (la tienda / vendedor)

| Decisión | Detalle |
|----------|---------|
| **Almacenamiento** | Tabla en base de datos + panel de administración **"Sobre mi negocio"** desde el inicio del MVP. No depender solo de variables `.env`. |
| **Motivo** | Cada instancia de `revital_ecommerce` es un cliente distinto; el administrador debe poder completar NIT, municipio y datos fiscales sin redeploy. |

### Envío en la factura electrónica

| Decisión | Detalle |
|----------|---------|
| **¿Aparece en la FE?** | **Sí**, como línea separada en la factura. |
| **Tratamiento fiscal** | **Exento de IVA** (sin impuesto en el ítem de envío). |
| **Casos especiales** | Debe contemplarse **envío gratis** y **promociones/descuentos aplicados al envío** (no solo a productos). |

### Disparador de emisión

| Decisión | Detalle |
|----------|---------|
| **Automático** | Emitir factura al confirmar pago Wompi con estado `APPROVED`. |
| **Manual** | Permitir **reintento manual** desde el panel admin si la emisión automática falla. |

### Alcance de implementación completa

| Decisión | Detalle |
|----------|---------|
| **Notas crédito** | **Sí**, incluidas en la etapa de implementación completa (devoluciones / cancelaciones vía Factus). |

### Pre-requisitos externos

| Decisión | Detalle |
|----------|---------|
| **Credenciales Factus** | **Aún no disponibles.** Deben generarse como pre-requisito antes de probar en sandbox. |
| **Habilitación DIAN** | El cliente piloto **no está habilitado** ante DIAN como facturador electrónico. Documentar como bloqueante para **producción**; sandbox puede avanzar en paralelo con credenciales Factus. |

---

## Decisiones pendientes (requieren cierre)

| Tema | Estado | Documento de referencia |
|------|--------|-------------------------|
| Política de IVA en precios del catálogo | Pendiente | [05-decisiones-pendientes.md](./05-decisiones-pendientes.md) |
| Datos del receptor exigidos en checkout | Pendiente | [05-decisiones-pendientes.md](./05-decisiones-pendientes.md) |

---

## Notas de la sesión

- El objetivo de la rama es integrar facturación electrónica consumiendo la **API de Factus** (v2).
- No existe hoy ninguna API de facturas implementada en el repositorio; todo el trabajo parte desde cero en backend, BD y panel admin.
- La documentación existente en [FEATURE_EMPRESA_Y_FACTURACION_ELECTRONICA.md](../../revital_ecommerce/docs/FEATURE_EMPRESA_Y_FACTURACION_ELECTRONICA.md) sigue siendo válida como visión de producto; esta carpeta profundiza el análisis técnico y el plan de ejecución con Factus.

---

## Historial de cambios

| Fecha | Cambio |
|-------|--------|
| 2025-06-05 | Creación inicial con decisiones de la sesión de planeación |
