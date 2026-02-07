# API de Métricas Admin - Synkro Panel

## Overview

Todos los endpoints requieren **usuario admin_synkro** y están bajo el prefijo:

- Base: `/api/admin/metrics`

Autenticación mediante JWT estándar del panel (`Authorization: Bearer <token>`).

---

## `GET /api/admin/metrics/overview`

Resumen general para el dashboard admin.

```jsonc
{
  "total_clientes": 42,
  "total_instancias": 57,
  "instancias_por_estado": {
    "activa": 40,
    "suspendida": 5,
    "creando": 4,
    "error": 2
  },
  "instancias_por_region": {
    "us-east-1": 30,
    "sa-east-1": 20,
    "sin_region": 7
  },
  "mrr_actual": 12345.67,
  "ingresos_ultimos_30_dias": 7890.12,
  "ingresos_por_plan": {
    "Starter": 1234.56,
    "Business": 5678.9,
    "Enterprise": 2432.21
  },
  "funnel_ultimos_6_meses": [
    {
      "periodo": "2026-01-01",
      "registros": 10,
      "trials": 4,
      "activos": 3
    }
  ]
}
```

## `GET /api/admin/metrics/revenue-timeseries`

Serie temporal de ingresos diarios.

Query params:

- `from_date` (opcional, `YYYY-MM-DD`)
- `to_date` (opcional, `YYYY-MM-DD`)

```jsonc
{
  "from_date": "2026-01-01",
  "to_date": "2026-01-30",
  "puntos": [
    { "fecha": "2026-01-01", "total": 123.45 },
    { "fecha": "2026-01-02", "total": 67.89 }
  ]
}
```

## `GET /api/admin/metrics/clients-timeseries`

Serie mensual de registros / trials / activos.

Query params:

- `from_date` (opcional, `YYYY-MM-DD`)
- `to_date` (opcional, `YYYY-MM-DD`)

```jsonc
{
  "from_date": "2025-08-01",
  "to_date": "2026-01-01",
  "puntos": [
    {
      "periodo": "2025-08-01",
      "registros": 5,
      "trials": 2,
      "activos": 1
    }
  ]
}
```

## `GET /api/admin/metrics/instances-by-plan`

Distribución de instancias por plan y estado.

```jsonc
{
  "items": [
    {
      "id_plan": 1,
      "nom_plan": "Starter",
      "total_instancias": 10,
      "activas": 8,
      "suspendidas": 1,
      "eliminadas": 0,
      "error": 1
    }
  ]
}
```

