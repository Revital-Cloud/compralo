# Analytics para el asistente de IA

Documento de referencia sobre las métricas y datos de analytics disponibles.

## Categorías más vendidas (get_top_categories_by_revenue)

- Productos agrupados por categoría.
- Ingresos por categoría en últimos 30 días.
- Porcentaje del total y crecimiento vs período anterior.
- Usar cuando el usuario pregunte: "categoría más vendida", "qué categoría vende más", "ranking de categorías".

## Métricas de conversión (get_conversion_metrics)

- **Tasa de conversión**: órdenes / carritos (aproximado).
- **Valor promedio de orden (AOV)**.
- **Total de órdenes**.
- **Ingresos totales**.
- Cada métrica incluye cambio % vs período anterior (30 días).

## Ventas geográficas (get_geographic_sales)

- Ventas por región (departamento o ciudad de la dirección del usuario).
- Órdenes y revenue por región.
- Últimos 30 días.

## Tráfico por hora (get_hourly_traffic)

- Órdenes por hora del día (0-23).
- Proxy de horas de mayor actividad.

## Demografía de clientes (get_customer_demographics)

- Grupos de edad: 0-17, 18-24, 25-34, 35-44, 45-54, 55+.
- Porcentaje de ingresos y revenue por grupo.
- Basado en fec_nacimiento de usuarios.

## Resumen general (get_store_summary)

- KPIs, productos más vendidos, órdenes recientes, alertas.
- Usar para preguntas amplias de "cómo va la tienda", "resumen general".
