# Esquema de base de datos – Revital E-commerce

Documento de referencia: tablas, relaciones, funciones, triggers y vistas.  
Base: `db_revital.sql` + `Functions/` + `triggers/` + `views/`.

---

## 1. Tablas

Todas las tablas usan el prefijo `tab_`. Campos de auditoría comunes (cuando aplican): `usr_insert`, `fec_insert`, `usr_update`, `fec_update`.

### 1.1 Catálogo (categorías, atributos, productos)

| Tabla | Descripción | PK | Principales columnas |
|-------|-------------|-----|----------------------|
| **tab_categories** | Categorías jerárquicas (parent_id) | id | name, slug, parent_id, is_active |
| **tab_attributes** | Maestro de atributos dinámicos | id | name, data_type (text/number/boolean) |
| **tab_category_attributes** | Atributos por categoría (filtrable/requerido) | id | category_id, attribute_id, is_required, is_filterable |
| **tab_products** | Productos (sin precio/stock) | id | category_id, name, slug, description, id_marca, is_active |
| **tab_product_variants** | Precio y stock por variante | id | product_id, sku, price, stock, is_active, color, size |
| **tab_product_images** | Imágenes por producto | id | product_id, image_url, is_main, sort_order |
| **tab_product_variant_attributes** | Valores de atributos por variante | id | variant_id, attribute_id, value_text, value_number, value_boolean |

### 1.2 Roles y usuarios

| Tabla | Descripción | PK | Principales columnas |
|-------|-------------|-----|----------------------|
| **tab_roles** | Roles del sistema | id_rol | nom_rol, des_rol |
| **tab_usuarios** | Usuarios (clientes/admin) | id_usuario | nom_usuario, ape_usuario, email_usuario, password_usuario, id_rol, ind_activo |
| **tab_direcciones_usuario** | Direcciones de envío | id_direccion | id_usuario, nombre_direccion, calle_direccion, ciudad, departamento, ind_principal |
| **tab_metodos_pago_usuario** | Métodos de pago (Wompi) | id_metodo_pago | id_usuario, provider_name, provider_source_id, is_default |

### 1.3 Marcas y proveedores

| Tabla | Descripción | PK | Principales columnas |
|-------|-------------|-----|----------------------|
| **tab_marcas** | Marcas de productos | id_marca | nom_marca, ind_activo |
| **tab_proveedores** | Proveedores | id_proveedor | nom_proveedor, email, tel_proveedor, ind_activo |

### 1.4 Carrito y órdenes

| Tabla | Descripción | PK | Principales columnas |
|-------|-------------|-----|----------------------|
| **tab_carritos** | Cabecera del carrito | id_carrito | id_usuario, session_id (anon/registrado) |
| **tab_carrito_productos** | Líneas del carrito | id_carrito_producto | id_carrito, variant_id, cantidad, precio_unitario_carrito |
| **tab_ordenes** | Órdenes de compra | id_orden | id_usuario, val_total_productos, val_total_descuentos, val_total_pedido, ind_estado (1=pendiente, 2=pagada, 3=completada, 4=cancelada) |
| **tab_orden_productos** | Líneas de la orden | id_orden_producto | id_orden, variant_id, cant_producto, precio_unitario_orden, subtotal |
| **tab_pagos** | Pagos/transacciones (Wompi) | id_pago | id_orden, provider_name, status, amount, reference |

### 1.5 Descuentos y fidelización

| Tabla | Descripción | PK | Principales columnas |
|-------|-------------|-----|----------------------|
| **tab_descuentos** | Descuentos y cupones | id_descuento | nom_descuento, tipo_calculo, aplica_a, category_id_aplica, product_id_aplica, ind_canjeable_puntos, codigo_descuento |
| **tab_descuentos_usuarios** | Uso de descuentos por usuario | (id_descuento, id_usuario) | veces_usado |
| **tab_config_puntos_empresa** | Configuración puntos (pesos por punto) | id_config_puntos | pesos_por_punto, ind_activo, fec_inicio_vigencia |
| **tab_puntos_usuario** | Puntos por usuario | id_usuario | puntos_disponibles, puntos_totales_ganados, puntos_totales_canjeados, fec_ultimo_canje |
| **tab_movimientos_puntos** | Historial de puntos | id_movimiento_puntos | id_usuario, tipo_movimiento (1=acumulación, 2=canje, 3=expiración), cantidad_puntos, id_orden_origen, id_descuento_canjeado |
| **tab_canjes_puntos_descuentos** | Canjes de puntos por descuentos | id_canje | id_usuario, id_descuento, puntos_utilizados, id_orden_aplicado, ind_utilizado, fec_expiracion_canje |

### 1.6 Comentarios, favoritos, CMS e inventario

| Tabla | Descripción | PK | Principales columnas |
|-------|-------------|-----|----------------------|
| **tab_comentarios** | Reseñas de productos | (id_comentario, product_id) | id_usuario, id_orden, product_id, comentario, calificacion |
| **tab_favoritos** | Favoritos por usuario | (id_usuario, product_id) | product_id |
| **tab_cms_content** | Contenido CMS | id_cms_content | nom_cms_content, des_cms_content (JSONB), ind_publicado |
| **tab_orden_compra_proveedor** | Órdenes de compra a proveedor | id_orden_compra | id_proveedor, product_id, variant_id, cantidad_solicitada, cantidad_recibida, ind_estado_producto |
| **tab_movimientos_inventario** | Movimientos de stock | id_movimiento | variant_id, tipo_movimiento, cantidad, id_orden_usuario_detalle, id_orden_compra |

### 1.7 Estadísticas

| Tabla | Descripción | PK | Principales columnas |
|-------|-------------|-----|----------------------|
| **tab_estadisticas_categorias** | Resumen de ventas por categoría | category_id | total_productos, total_unidades_vendidas, total_ingresos, ventas_mes_actual, producto_mas_vendido |
| **tab_estadisticas_productos** | Resumen de ventas por producto | product_id | nom_producto, total_unidades_vendidas, total_ingresos, rotacion_inventario, nivel_rotacion |

### 1.8 Sistema y KPIs (opcionales, script fase 5)

| Tabla | Descripción | PK |
|-------|-------------|-----|
| **tab_reg_del** | Log de eliminaciones lógicas | id_del |
| **tab_tipos_kpi** | Tipos de KPI | id_tipo_kpi |
| **tab_kpis_maestros** | KPIs definidos | id_kpi |
| **tab_valores_kpi_cache** | Cache de valores KPI | (id_kpi, periodo) |
| **tab_dashboards_usuarios** | Dashboards por usuario | id_dashboard |
| **tab_widgets_dashboard** | Widgets en dashboards | id_widget |
| **tab_alertas_kpi** | Alertas de KPIs | id_alerta |
| **tab_compartir_dashboards** | Compartición de dashboards | (id_dashboard, id_usuario_destino) |

---

## 2. Relaciones entre tablas (FK)

```
tab_roles
  └── tab_usuarios (id_rol)

tab_usuarios
  ├── tab_direcciones_usuario (id_usuario)
  ├── tab_metodos_pago_usuario (id_usuario)
  ├── tab_carritos (id_usuario)
  ├── tab_ordenes (id_usuario)
  ├── tab_descuentos_usuarios (id_usuario)
  ├── tab_puntos_usuario (id_usuario)
  ├── tab_movimientos_puntos (id_usuario)
  ├── tab_canjes_puntos_descuentos (id_usuario)
  ├── tab_comentarios (id_usuario)
  └── tab_favoritos (id_usuario)

tab_categories
  ├── tab_categories (parent_id, autorreferencia)
  ├── tab_category_attributes (category_id)
  ├── tab_products (category_id)
  ├── tab_descuentos (category_id_aplica)
  └── tab_estadisticas_categorias (category_id)

tab_attributes
  ├── tab_category_attributes (attribute_id)
  └── tab_product_variant_attributes (attribute_id)

tab_products
  ├── tab_product_variants (product_id)
  ├── tab_product_images (product_id)
  ├── tab_orden_compra_proveedor (product_id)
  ├── tab_comentarios (product_id)
  ├── tab_descuentos (product_id_aplica)
  ├── tab_favoritos (product_id)
  └── tab_estadisticas_productos (product_id)

tab_product_variants
  ├── tab_product_variant_attributes (variant_id)
  ├── tab_orden_productos (variant_id)
  ├── tab_carrito_productos (variant_id)
  ├── tab_movimientos_inventario (variant_id)
  └── tab_orden_compra_proveedor (variant_id, opcional)

tab_marcas
  └── tab_products (id_marca)

tab_proveedores
  └── tab_orden_compra_proveedor (id_proveedor)

tab_carritos
  └── tab_carrito_productos (id_carrito)

tab_descuentos
  ├── tab_ordenes (id_descuento)
  ├── tab_descuentos_usuarios (id_descuento)
  ├── tab_movimientos_puntos (id_descuento_canjeado)
  └── tab_canjes_puntos_descuentos (id_descuento)

tab_ordenes
  ├── tab_comentarios (id_orden)
  ├── tab_pagos (id_orden)
  ├── tab_orden_productos (id_orden)
  ├── tab_canjes_puntos_descuentos (id_orden_aplicado)
  └── tab_movimientos_puntos (id_orden_origen)

tab_orden_productos
  └── tab_movimientos_inventario (id_orden_usuario_detalle)

tab_orden_compra_proveedor
  └── tab_movimientos_inventario (id_orden_compra)

tab_pagos
  └── tab_pagos (parent_payment_id, opcional)
```

---

## 3. Funciones

Aplicadas por `apply_all.sh` en el orden indicado. Solo se listan funciones `fun_*` (excluyendo ejemplos, schemas y datos iniciales).

### 3.1 Utilidades (`Functions/utils/`)

| Función | Descripción |
|---------|-------------|
| **fun_generate_unique_slug** | Genera slug único para `tab_categories` o `tab_products`. |
| **fun_generate_sku** | Genera SKU único para variantes (SKU-&lt;product_id&gt;-&lt;seq&gt;). |

### 3.2 Categorías (`Functions/tab_categorias/`)

| Función | Descripción |
|---------|-------------|
| **fun_insert_categoria** | Inserta categoría en `tab_categories` (jerarquía por parent_id). |
| **fun_update_categoria** | Actualiza categoría; regenera slug si cambia el nombre. |
| **fun_delete_categoria** | Elimina categoría si no tiene hijas ni productos. |
| **fun_deactivate_activate_categoria** | Activa/desactiva categoría y subárbol y productos. |
| **fun_get_categories_tree** | Devuelve árbol de categorías (lista plana con level, path_ids). |

### 3.3 Productos (`Functions/tab_productos/`)

| Función | Descripción |
|---------|-------------|
| **fun_insert_producto** | Inserta producto en `tab_products` (slug único). |
| **fun_update_producto** | Actualiza producto; regenera slug si cambia nombre. |
| **fun_delete_producto** | Elimina producto si no está en carrito ni en órdenes. |
| **fun_deactivate_activate_producto** | Activa/desactiva producto y sus variantes. |
| **fun_insert_product_variant** | Inserta variante en `tab_product_variants` (SKU opcional). |
| **fun_insert_product_image** | Inserta imagen en `tab_product_images`; puede marcar is_main. |
| **fun_filter_products** | Filtra productos (categoría, paginación, total_registros). |
| **fun_filter_admin_products** | Filtro admin (products + variantes + categorías + marcas + imágenes). |
| **fun_get_productos** | Detalle de producto por ID (variantes, imágenes, categoría). |
| **fun_get_productos_activos** | Lista productos activos con precio mínimo, stock, imagen. |
| **fun_actualizar_stock_automatico** | Trigger: reduce stock al marcar orden como pagada. |
| **fun_restaurar_stock_cancelacion** | Trigger: restaura stock al cancelar orden. |

### 3.4 Carritos (`Functions/tab_carritos/`, `tab_carrito_productos/`)

| Función | Descripción |
|---------|-------------|
| **fun_obtener_carrito_usuario** | Obtiene o crea carrito por id_usuario o session_id. |
| **fun_obtener_carrito_detalle** | Detalle del carrito con productos/variantes/imagen. |
| **fun_calcular_total_carrito** | Calcula totales (subtotal, descuentos, canjes). |
| **fun_limpiar_carrito_completado** | Limpia ítems del carrito tras pago. |
| **fun_agregar_producto_carrito** | Agrega variante al carrito (precio/stock desde variante). |
| **fun_eliminar_producto_carrito** | Elimina o reduce cantidad de variante en carrito. |
| **fun_migrar_carrito_anonimo_a_usuario** | Migra carrito de session_id a id_usuario. |

### 3.5 Órdenes (`Functions/tab_ordenes/`)

| Función | Descripción |
|---------|-------------|
| **fun_crear_orden_desde_carrito** | Crea orden desde carrito (ítems, descuentos, canjes, dirección). |
| **fun_obtener_ordenes_usuario** | Lista órdenes del usuario. |
| **fun_marcar_orden_completada** | Marca orden como completada (ind_estado = 3). |

### 3.6 Pagos (`Functions/tab_pagos/`)

| Función | Descripción |
|---------|-------------|
| **fun_crear_pago** | Crea registro de pago (orden, monto, provider). |
| **fun_actualizar_pago** | Actualiza estado/detalle del pago (webhook). |
| **fun_obtener_pago** | Obtiene pago por id_orden. |
| **fun_marcar_orden_pagada** | Marca orden como pagada y aplica lógica asociada. |

### 3.7 Descuentos (`Functions/tab_descuentos/`, `tab_descuentos_usuarios/`)

| Función | Descripción |
|---------|-------------|
| **fun_insert_descuento** | Inserta descuento. |
| **fun_update_descuento** | Actualiza descuento. |
| **fun_activar_desactivar_descuento** | Activa/desactiva descuento. |
| **fun_listar_descuentos** | Lista descuentos (admin). |
| **fun_listar_descuentos_canjeables** | Lista descuentos canjeables por puntos. |
| **fun_obtener_descuento** | Obtiene descuento por ID o código. |
| **fun_validar_descuento_aplicable** | Valida si un descuento aplica al carrito/usuario. |
| **fun_registrar_uso_descuento** | Registra uso de descuento por usuario. |

### 3.8 Puntos y canjes (`Functions/tab_canjes_puntos_descuentos/`, `tab_puntos_usuario/`, `tab_config_puntos_empresa/`)

| Función | Descripción |
|---------|-------------|
| **fun_canjear_puntos_descuento** | Canjea puntos por un descuento (genera canje). |
| **fun_aplicar_canje_orden** | Aplica un canje previamente generado a una orden. |
| **fun_acumular_puntos_por_compra** | Lógica de acumulación de puntos por compra. |
| **fun_calcular_puntos_por_compra** | Calcula puntos que genera una compra. |
| **fun_obtener_resumen_puntos_usuario** | Resumen de puntos del usuario. |
| **fun_obtener_historial_puntos** | Historial de movimientos de puntos. |
| **fun_crear_config_puntos_empresa** | Crea configuración de puntos. |
| **fun_actualizar_config_puntos_empresa** | Actualiza configuración de puntos. |

### 3.9 Usuarios, roles, direcciones, métodos de pago (`Functions/tab_usuarios/`, `tab_roles/`, `tab_direcciones_usuarios/`, `tab_metodos_pago_usuario/`)

| Función | Descripción |
|---------|-------------|
| **fun_insert_usuarios** | Inserta usuario. |
| **fun_update_usuarios** | Actualiza usuario. |
| **fun_deactivate_usuarios** | Desactiva usuario. |
| **fun_update_password** | Cambia contraseña. |
| **fun_insert_roles** / **fun_update_roles** / **fun_delete_roles** | CRUD roles. |
| **fun_insert_direcciones** / **fun_update_direcciones** | Inserta/actualiza direcciones. |
| **fun_deactivate_direcciones** / **fun_deactivate_direccion_principal** | Desactiva dirección(es). |
| **fun_agregar_metodo_pago** / **fun_eliminar_metodo_pago** / **fun_listar_metodos_pago** / **fun_actualizar_metodo_pago_default** | Métodos de pago. |

### 3.10 Marcas y proveedores (`Functions/tab_marcas/`, `Functions/tab_proveedores/`)

| Función | Descripción |
|---------|-------------|
| **fun_insert_marca** / **fun_update_marca** / **fun_delete_marca** / **fun_deactivate_activate_marca** | CRUD marcas. |
| **fun_insert_proveedores** / **fun_update_proveedores** / **fun_delete_proveedor** / **fun_deactivate_activate_proveedores** | CRUD proveedores. |

### 3.11 Órdenes de compra a proveedor (`Functions/tab_ordenes_compra_proveedor/`)

| Función | Descripción |
|---------|-------------|
| **fun_insert_orden_compra_proveedor** | Inserta orden de compra (product_id, variant_id, proveedor, cantidades). |
| **fun_update_orden_compra_proveedor** | Actualiza líneas de orden de compra. |

### 3.12 Comentarios y favoritos (`Functions/tab_comentarios/`, `Functions/tab_favoritos/`)

| Función | Descripción |
|---------|-------------|
| **fun_insert_comentarios** | Inserta comentario/reseña (producto, orden, usuario). |
| **fun_deactivate_comentarios** | Desactiva comentarios. |
| **fun_get_reviewed_products_in_order** | Productos ya reseñados en una orden. |
| **fun_insert_favorito** / **fun_delete_favorito** | Agrega/elimina favorito. |
| **fun_select_favoritos_usuario** | Lista favoritos del usuario con detalle (nombre, imagen, precio). |

### 3.13 CMS (`Functions/tab_cms_content/`)

| Función | Descripción |
|---------|-------------|
| **fun_get_content** / **fun_insert_content** / **fun_update_content** / **fun_delete_content** | CRUD contenido CMS. |

### 3.14 Estadísticas (`Functions/tab_estadisticas_categorias/`, `tab_estadisticas_productos/`)

| Función | Descripción |
|---------|-------------|
| **fun_actualizar_resumen_categoria** | Recalcula estadísticas por categoría. |
| **fun_actualizar_resumen_ventas** | Recalcula estadísticas por producto (tab_estadisticas_productos). |

### 3.15 KPIs/Dashboards (opcionales, `Functions/tab_kpis_dashboards/`)

| Función / Archivo | Descripción |
|-------------------|-------------|
| **fun_gestionar_dashboard** | Crear/actualizar dashboards y widgets. |
| **fun_calcular_kpi** | Calcula valor de un KPI. |
| **vistas_kpis_sistema.sql** | Crea vista `vw_kpis_disponibles` y otras vistas de KPIs. |
| **schema_kpis_personalizados.sql** | Tablas tab_kpis_maestros, tab_dashboards_usuarios, tab_widgets_dashboard, tab_alertas_kpi, tab_compartir_dashboards, tab_valores_kpi_cache. |

---

## 4. Triggers

### 4.1 Auditoría (`triggers/audit.sql`)

Función común: **fun_audit_tablas** (rellena `fec_insert`/`fec_update`, en DELETE inserta en `tab_reg_del`).

Triggers **BEFORE INSERT OR UPDATE OR DELETE** en:

- tab_categories, tab_attributes, tab_category_attributes, tab_products, tab_product_variants, tab_product_images, tab_product_variant_attributes  
- tab_roles, tab_usuarios, tab_carritos, tab_proveedores, tab_orden_compra_proveedor, tab_marcas  
- tab_comentarios, tab_descuentos, tab_ordenes, tab_orden_productos, tab_carrito_productos  
- tab_movimientos_inventario, tab_cms_content, tab_favoritos, tab_config_puntos_empresa  
- tab_puntos_usuario, tab_movimientos_puntos, tab_canjes_puntos_descuentos, tab_descuentos_usuarios  
- tab_metodos_pago_usuario, tab_pagos  

(Nombres de trigger: `tri_audit_tab_*` o `tri_audit_*` según tabla.)

### 4.2 Negocio (`triggers/triggers.sql`, `trg_*.sql`)

| Trigger | Tabla | Evento | Función | Descripción |
|---------|--------|--------|---------|-------------|
| **trg_orden_acumular_puntos** | tab_ordenes | AFTER UPDATE | trg_acumular_puntos_orden | Cuando ind_estado pasa a 2 (pagada), acumula puntos. |
| **trg_actualizar_estadisticas_orden_pagada** | tab_ordenes | AFTER INSERT/UPDATE | fun_trigger_actualizar_estadisticas_orden | Actualiza estadísticas al pagar orden. |
| **trg_actualizar_estadisticas_cambio_producto_orden** | tab_orden_productos | AFTER INSERT/UPDATE/DELETE | fun_trigger_actualizar_estadisticas_producto_orden | Actualiza estadísticas al cambiar ítems de órdenes. |
| **trg_actualizar_stock_orden_pagada** | tab_ordenes | AFTER UPDATE | fun_actualizar_stock_automatico | Reduce stock al marcar orden como pagada. |
| **trg_limpiar_carrito_pagado** | tab_ordenes | AFTER UPDATE | fun_limpiar_carrito_pagado | Limpia carrito al pagar orden. |
| **trg_restaurar_stock_cancelacion** | tab_ordenes | AFTER UPDATE | fun_restaurar_stock_cancelacion | Restaura stock al cancelar orden (ind_estado = 4). |
| **trg_marcar_orden_pagada_mercadopago** | tab_pagos | AFTER UPDATE OF status | fun_trigger_marcar_orden_pagada_auto | Marca orden como pagada cuando status = 'approved'. |
| **trg_validar_producto_compra_proveedor** | tab_orden_compra_proveedor | BEFORE INSERT | fun_trigger_validar_producto_compra_proveedor | Valida que el producto exista. |
| **trg_actualizar_stock_compra_proveedor** | tab_orden_compra_proveedor | AFTER UPDATE OF ind_estado_producto | fun_trigger_actualizar_stock_compra_proveedor | Actualiza stock cuando ind_estado_producto = 3 (recibido). |

Funciones de trigger definidas en:

- `trg_acumular_puntos_orden.sql`
- `trg_actualizar_estadisticas_ventas.sql` (fun_trigger_actualizar_estadisticas_orden, fun_trigger_actualizar_estadisticas_producto_orden)
- `trg_actualizar_stock_orden_pagada.sql` (fun_actualizar_stock_automatico ya en tab_productos)
- `trg_automatizar_pagos_descuentos.sql` (fun_trigger_marcar_orden_pagada_auto, fun_limpiar_carrito_pagado)
- `trg_actualizar_stock_compra_proveedor.sql`

---

## 5. Vistas

| Vista | Descripción | Dependencias principales |
|-------|-------------|---------------------------|
| **vw_resumen_puntos_usuario** | Resumen de puntos por usuario (cliente): disponibles, ganados, canjeados, fec_ultima_acumulacion, fec_ultimo_canje, canjes_disponibles. | tab_usuarios, tab_puntos_usuario, tab_canjes_puntos_descuentos, tab_movimientos_puntos |
| **vw_descuentos_canjeables** | Descuentos canjeables por puntos vigentes. | tab_descuentos |
| **vw_top_productos_vendidos** | Productos más vendidos con ranking por unidades e ingresos. | tab_estadisticas_productos, tab_products, tab_categories |
| **vw_resumen_ventas_categoria** | Resumen de ventas por categoría. | tab_estadisticas_categorias |
| **vw_kpis_disponibles** | KPIs disponibles para dashboards (opcional, fase 5). | tab_kpis_maestros, tab_widgets_dashboard, tab_dashboards_usuarios, tab_usuarios, etc. |

---

## 6. Orden de aplicación (`apply_all.sh`)

1. **Schema:** `db_revital.sql` (DROP vistas → DROP tablas → CREATE tablas).
2. **Funciones:** utils → tab_categorias → tab_productos (+ indexes_filter_products) → resto de tab_* (excl. tab_lineas, tab_sublineas, tab_kpis_dashboards).
3. **Triggers:** audit.sql → trg_actualizar_estadisticas_ventas → trg_actualizar_stock_compra_proveedor → trg_acumular_puntos_orden → trg_automatizar_pagos_descuentos → trg_actualizar_stock_orden_pagada → triggers.sql.
4. **Vistas:** views/*.sql.
5. **Opcional:** tab_kpis_dashboards/*.sql (con `|| true` para no fallar si faltan tablas).

---

*Documento generado a partir de `revital_ecommerce/db/`. Actualizar al cambiar schema, funciones o triggers.*
