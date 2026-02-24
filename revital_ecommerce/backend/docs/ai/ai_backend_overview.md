# Vista general del backend para el asistente de IA

Documento de referencia para que el modelo entienda los dominios y capacidades del backend de Compralo.

## Dominios principales

### Productos
- Productos con variantes (grupos y combinaciones).
- Stock por variante; producto activo/inactivo.
- Búsqueda por nombre, filtros por categoría/marca.

### Categorías
- Jerarquía: categoría raíz → línea → sublínea.
- `parent_id` null = raíz; `parent_id` de raíz = línea; `parent_id` de línea = sublínea.

### Marcas y proveedores
- Marcas: organizan productos.
- Proveedores: gestión de órdenes de compra y stock.

### Órdenes
- Estados: 1=Pendiente, 2=Completada, 3=Cancelada.
- Órdenes pagadas/completadas (2, 3) cuentan para ingresos y analytics.

### Descuentos
- Porcentaje o monto fijo.
- Aplican a: todos, categoría, producto, marca, total_pedido.
- Código opcional, límites de uso, fechas de validez.
- Pueden ser canjeables por puntos.

### Puntos de fidelización
- Usuarios acumulan puntos por compras.
- Puntos pueden canjearse por descuentos.
- Caducidad y reglas en `points_service`.

### Analytics
- Métricas de conversión (tasa, AOV, ingresos).
- Performance por categoría (ventas, crecimiento).
- Datos geográficos, tráfico por hora, demografía.
- Ver `ai_analytics_overview.md` para detalles.

### Barras informativas
- Barra superior configurable (mensaje, colores, botón, fechas).
- Una barra activa a la vez.

## Reglas clave

- **Solo lectura**: get_store_summary, list_*, get_*, check_low_stock, get_top_categories_by_revenue, get_conversion_metrics, get_geographic_sales, get_hourly_traffic, get_customer_demographics.
- **Escritura**: create_brand, create_provider, create_category, create_discount, update_top_info_bar, toggle_product_status, toggle_discount_status, update_order_status. Requieren confirmación explícita del usuario.
- **Validar antes de crear**: marcas, categorías y códigos de descuento ya existentes no se duplican.
