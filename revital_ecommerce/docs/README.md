# Documentación — revital_ecommerce

Documentación técnica y de requisitos de la aplicación revital_ecommerce.

## Documentos principales

| Documento | Descripción |
|-----------|-------------|
| [SRS_REVITAL_ECOMMERCE_IEEE830.md](./SRS_REVITAL_ECOMMERCE_IEEE830.md) | Especificación de Requisitos de Software (IEEE 830-1998): requisitos funcionales (RF) y no funcionales (RNF), descripción general y gestión de pruebas. |
| [FEATURE_EMPRESA_Y_FACTURACION_ELECTRONICA.md](./FEATURE_EMPRESA_Y_FACTURACION_ELECTRONICA.md) | Meta, mini metas y plan por fases: perfil de empresa (white-label), panel admin “Sobre mi negocio”, persistencia en BD e integración Factus para facturación electrónica (Colombia / DIAN). |

## Documentación relacionada

- **Backend:** [../backend/README.md](../backend/README.md) — Instalación, estructura y uso del API.
- **Frontend:** [../frontend/README.md](../frontend/README.md) — Estructura del frontend y guías de uso.
- **Base de datos:** [../db/docs/](../db/docs/) — Esquema, funciones almacenadas y guías de BD.
- **Plataforma Revital:** [../../docs/SRS_REVITAL_IEEE830.md](../../docs/SRS_REVITAL_IEEE830.md) — SRS global de la plataforma.

## Convenciones

- Los requisitos se identifican como **RF-xx** (funcionales) y **RNF-xx** (no funcionales).
- La trazabilidad se mantiene entre requisitos, diseño (routers, services, BD) y casos de prueba.
