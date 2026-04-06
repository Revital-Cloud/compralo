# Inventario de transacciones compralo
### Catálogo

| Tipo (Función, Trigger o Vista) | Nombre | Tabla principal | Tablas involucradas | Funcionalidad | Descripción de proceso | Medio de transporte de la información |
|---|---|---|---|---|---|---|
| Función | `fun_insert_categoria` | `tab_categories` | `tab_categories` | Crear categoría (árbol) | Inserta categoría y genera `slug` único (jerarquía por `parent_id`). | HTTP/JSON → `category_router.py` → `category_service.py` → `fun_insert_categoria` |
| Función | `fun_update_categoria` | `tab_categories` | `tab_categories` | Actualizar categoría | Actualiza nombre/parent/estado. | HTTP/JSON → `category_router.py` → `category_service.py` → `fun_update_categoria` |
| Función | `fun_delete_categoria` | `tab_categories` | `tab_categories` | Eliminar categoría | Elimina categoría (según reglas internas). | HTTP/JSON → `category_router.py` → `category_service.py` → `fun_delete_categoria` |
| Función | `fun_deactivate_activate_categoria` | `tab_categories` | `tab_categories`, `tab_products` | Activar/desactivar en cascada | Cambia estado y (según implementación) afecta descendientes y productos. | HTTP/JSON → `category_router.py` → `category_service.py` → `fun_deactivate_activate_categoria` |
| Función | `fun_get_categories_tree` | `tab_categories` | `tab_categories` | Consultar árbol | Devuelve árbol con CTE recursivo (niveles/path). | HTTP/JSON → (endpoints tree / filtros) → service → `fun_get_categories_tree` |
| Función | `fun_insert_marca` | `tab_marcas` | `tab_marcas` | Crear marca | Inserta marca. | HTTP/JSON → `brand_router.py` → `brand_service.py` → `fun_insert_marca` |
| Función | `fun_update_marca` | `tab_marcas` | `tab_marcas` | Actualizar marca | Actualiza nombre/estado. | HTTP/JSON → `brand_router.py` → `brand_service.py` → `fun_update_marca` |
| Función | `fun_delete_marca` | `tab_marcas` | `tab_marcas` | Eliminar marca | Elimina marca. | HTTP/JSON → `brand_router.py` → `brand_service.py` → `fun_delete_marca` |
| Función | `fun_deactivate_activate_marca` | `tab_marcas` | `tab_marcas` | Activar/desactivar marca | Toggle de estado. | HTTP/JSON → `brand_router.py` → `brand_service.py` → `fun_deactivate_activate_marca` |
| Función | `fun_insert_producto` | `tab_products` | `tab_products` | Crear producto | Inserta cabecera de producto (sin precio/stock; eso va en combinaciones). | HTTP/JSON → `product_router.py` → `product_service.py` → `fun_insert_producto` |
| Función | `fun_update_producto` | `tab_products` | `tab_products` | Actualizar producto | Actualiza cabecera (categoría, marca/proveedor, estado, etc.). | HTTP/JSON → `product_router.py` → `product_service.py` → `fun_update_producto` |
| Función | `fun_delete_producto` | `tab_products` | `tab_products` | Eliminar producto | Elimina producto. | HTTP/JSON → `product_router.py` → `product_service.py` → `fun_delete_producto` |
| Función | `fun_deactivate_activate_producto` | `tab_products` | `tab_products`, `tab_product_variant_groups`, `tab_product_variant_combinations` | Activar/desactivar producto/variantes | Toggle y cascada a variantes/grupos. | HTTP/JSON → `product_router.py` → `product_service.py` → `fun_deactivate_activate_producto` |
| Función | `fun_get_productos_activos` | `tab_products` | `tab_products` (+ joins en función) | Listado público | Devuelve productos activos para storefront. | HTTP/JSON → `product_router.py` → `product_service.py` → `fun_get_productos_activos` |
| Función | `fun_get_all_products_admin` | `tab_products` | `tab_products`, `tab_categories`, `tab_marcas`, `tab_product_variant_groups`, `tab_product_variant_combinations` | Listado admin | Listado enriquecido para panel admin. | HTTP/JSON → `product_router.py` → `product_service.py` → `fun_get_all_products_admin` |
| Función | `fun_filter_products` | `tab_products` | `tab_products`, `tab_categories`, `tab_marcas`, `tab_product_variant_groups`, `tab_product_variant_combinations`, `tab_product_variant_images` | Filtro catálogo (store) | Filtra por categoría (con subcategorías), marca, precio/stock; calcula `price_min`, stock total e imagen. | HTTP/JSON → `product_router.py` → `product_service.py` → `fun_filter_products` |
| Función | `fun_insert_variant_group` | `tab_product_variant_groups` | `tab_product_variant_groups` | Crear grupo variante | Crea grupo (p.ej. por color) para un producto. | HTTP/JSON → `product_router.py` → `product_service.py` → `fun_insert_variant_group` |
| Función | `fun_insert_variant_group_image` | `tab_product_variant_images` | `tab_product_variant_images` | Imagen por grupo | Inserta imagen asociada a grupo (primary/sort). | HTTP/JSON → `product_router.py` → `product_service.py` → `fun_insert_variant_group_image` |
| Función | `fun_insert_variant_combination` | `tab_product_variant_combinations` | `tab_product_variant_combinations` | Crear combinación vendible | Inserta SKU, precio, stock y `attributes` (JSONB) por combinación. | HTTP/JSON → `product_router.py` → `product_service.py` → `fun_insert_variant_combination` |
| Función | `fun_generate_unique_slug` | (util) | `tab_categories`, `tab_products` (según uso) | Generación de slugs | Utilidad para slugs únicos. | Implícito: llamada desde funciones de inserción (DB-internal) |
| Función | `fun_generate_sku` | (util) | `tab_product_variant_*` | Generación SKU | Utilidad para SKU (variantes). | Implícito: llamada desde funciones de variantes (DB-internal) |

---

### Carrito

| Tipo (Función, Trigger o Vista) | Nombre | Tabla principal | Tablas involucradas | Funcionalidad | Descripción de proceso | Medio de transporte de la información |
|---|---|---|---|---|---|---|
| Función | `fun_obtener_carrito_usuario` | `tab_carritos` | `tab_carritos` | Get/crear carrito | Obtiene o crea carrito para `id_usuario` o `session_id`. | HTTP/JSON → `cart_product_router.py` → `cart_product_service.py` → `fun_obtener_carrito_usuario` |
| Función | `fun_obtener_carrito_detalle` | `tab_carritos` | `tab_carritos`, `tab_carrito_productos`, `tab_product_variant_*`, `tab_products` | Detalle carrito | Devuelve detalle del carrito (items, totales/joins). | HTTP/JSON → `cart_product_router.py` → `cart_product_service.py` → `fun_obtener_carrito_detalle` (y/o SQL directo) |
| Función | `fun_agregar_producto_carrito` | `tab_carrito_productos` | `tab_carritos`, `tab_carrito_productos`, `tab_product_variant_combinations`, `tab_product_variant_groups`, `tab_products` | Agregar ítem | Agrega variante al carrito; valida stock; soporta `opciones_elegidas` (JSONB). | HTTP/JSON → `cart_product_router.py` → `cart_product_service.py` → `fun_agregar_producto_carrito` |
| Función | `fun_eliminar_producto_carrito` | `tab_carrito_productos` | `tab_carritos`, `tab_carrito_productos` | Quitar/reducir ítem | Elimina o reduce cantidad de una variante en carrito. | HTTP/JSON → `cart_product_router.py` → `cart_product_service.py` → `fun_eliminar_producto_carrito` |
| Función | `fun_migrar_carrito_anonimo_a_usuario` | `tab_carritos` | `tab_carritos`, `tab_carrito_productos` | Migración carrito | Transfiere ítems de carrito anónimo (`session_id`) al carrito de usuario. | HTTP/JSON → `cart_product_router.py` → `cart_product_service.py` → `fun_migrar_carrito_anonimo_a_usuario` |
| Función | `fun_calcular_total_carrito` | `tab_carritos` | `tab_carritos`, `tab_carrito_productos`, `tab_descuentos`, `tab_descuentos_usuarios`, `tab_canjes_puntos_descuentos`, `tab_puntos_usuario`, `tab_product_variant_*`, `tab_products` | Total carrito (descuentos/puntos) | Calcula subtotal, descuentos automáticos, cupón, canje; retorna JSON con totales + puntos. | HTTP/JSON → `cart_product_router.py` → `cart_product_service.py` → `fun_calcular_total_carrito` |

---

### Órdenes

| Tipo (Función, Trigger o Vista) | Nombre | Tabla principal | Tablas involucradas | Funcionalidad | Descripción de proceso | Medio de transporte de la información |
|---|---|---|---|---|---|---|
| Función | `fun_crear_orden_desde_carrito` | `tab_ordenes` | `tab_carritos`, `tab_carrito_productos`, `tab_ordenes`, `tab_orden_productos`, `tab_direcciones_usuario`, `tab_descuentos`, `tab_descuentos_usuarios`, `tab_canjes_puntos_descuentos`, `tab_product_variant_*`, `tab_products` | Crear orden | Convierte carrito en orden; valida stock; calcula descuentos/canje; copia ítems; registra uso de descuentos/canje. | HTTP/JSON → `order_router.py` → `order_service.py` → `fun_crear_orden_desde_carrito` |
| Función | `fun_obtener_ordenes_usuario` | `tab_ordenes` | `tab_ordenes`, `tab_orden_productos` | Historial usuario | Devuelve historial resumido (cantidad de productos, método pago, descuentos). | HTTP/JSON → `order_router.py` (SQL directo) → `fun_obtener_ordenes_usuario` |
| Función | `fun_marcar_orden_completada` | `tab_ordenes` | `tab_ordenes` | Completar orden | Cambia estado a completada (fulfillment). | HTTP/JSON → `order_router.py` (admin status) → service/SQL → `fun_marcar_orden_completada` (si se usa) |
| Trigger | `trg_limpiar_carrito_pagado` | `tab_ordenes` | `tab_ordenes`, `tab_carritos`, `tab_carrito_productos` | Limpieza carrito | Cuando cambia a pagada (solo UPDATE), ejecuta `fun_limpiar_carrito_pagado()` para vaciar carrito. | Implícito por `UPDATE tab_ordenes` (ej. `order_service.update_order_payment_info`) |
| Trigger | `trg_restaurar_stock_cancelacion` | `tab_ordenes` | `tab_ordenes`, `tab_orden_productos`, `tab_product_variant_combinations`, `tab_movimientos_inventario` | Stock al cancelar | Si cambia a cancelada, ejecuta `fun_restaurar_stock_cancelacion()` (reversa stock). | Implícito por `UPDATE tab_ordenes` (admin/pagos) |

---

### Pagos

| Tipo (Función, Trigger o Vista) | Nombre | Tabla principal | Tablas involucradas | Funcionalidad | Descripción de proceso | Medio de transporte de la información |
|---|---|---|---|---|---|---|
| Función | `fun_agregar_metodo_pago` | `tab_metodos_pago_usuario` | `tab_metodos_pago_usuario` | Guardar tarjeta | Inserta método de pago (fuente Wompi) y opcional default. | HTTP/JSON → `payment_router.py` → `payment_service.py` → `fun_agregar_metodo_pago` |
| Función | `fun_listar_metodos_pago` | `tab_metodos_pago_usuario` | `tab_metodos_pago_usuario` | Listar métodos | Lista métodos guardados del usuario. | HTTP/JSON → `payment_router.py` → `payment_service.py` → `fun_listar_metodos_pago` (y/o SQL directo) |
| Función | `fun_eliminar_metodo_pago` | `tab_metodos_pago_usuario` | `tab_metodos_pago_usuario` | Eliminar método | Elimina un método de pago del usuario. | HTTP/JSON → `payment_router.py` → `payment_service.py` → `fun_eliminar_metodo_pago` |
| Función | `fun_actualizar_metodo_pago_default` | `tab_metodos_pago_usuario` | `tab_metodos_pago_usuario` | Set default | Marca un método como predeterminado y desmarca otros. | HTTP/JSON → `payment_router.py` → `payment_service.py` → `fun_actualizar_metodo_pago_default` |
| Trigger | `trg_marcar_orden_pagada_mercadopago` | `tab_pagos` | `tab_pagos`, `tab_ordenes` | Auto-pago por status | Si un pago cambia a `approved`, ejecuta `fun_trigger_marcar_orden_pagada_auto()`. | Implícito por `UPDATE tab_pagos.status` |
| Función (referenciada) | `fun_marcar_orden_pagada` | `tab_ordenes` | `tab_ordenes`, `tab_pagos`, `tab_descuentos_usuarios`, `tab_puntos_usuario`, `tab_movimientos_puntos` | Marcar orden pagada | Orquesta cambio a pagada + procesos (descuentos/puntos/stats). **Nota**: referencia `fun_cambiar_estado_orden` y `fun_procesar_descuentos_usados_orden` (no encontradas definidas en `db/`). | Potencial: HTTP/JSON → pagos/admin → service → `fun_marcar_orden_pagada` (hoy el backend usa más `UPDATE tab_ordenes` + triggers) |

---

### Inventario

| Tipo (Función, Trigger o Vista) | Nombre | Tabla principal | Tablas involucradas | Funcionalidad | Descripción de proceso | Medio de transporte de la información |
|---|---|---|---|---|---|---|
| Trigger | `trg_actualizar_stock_orden_pagada` | `tab_ordenes` | `tab_ordenes`, `tab_orden_productos`, `tab_product_variant_combinations`, `tab_movimientos_inventario`, `tab_product_variant_groups`, `tab_products` | Stock al pagar | Al pasar a pagada/completada, ejecuta `fun_actualizar_stock_automatico()` (descuenta stock + registra movimiento). | Implícito por `UPDATE tab_ordenes` (checkout widget/webhook/pago) |
| Función | `fun_actualizar_stock_automatico` | `tab_ordenes` | `tab_ordenes`, `tab_orden_productos`, `tab_product_variant_combinations`, `tab_movimientos_inventario`, `tab_product_variant_groups`, `tab_products` | Descuento stock venta | Trigger function: descuenta stock por `variant_id` y registra movimiento `salida_venta`. | Implícito por trigger `trg_actualizar_stock_orden_pagada` |
| Función | `fun_restaurar_stock_cancelacion` | `tab_ordenes` | `tab_ordenes`, `tab_orden_productos`, `tab_product_variant_combinations`, `tab_movimientos_inventario` | Revertir stock | Restaura stock al cancelar orden. | Implícito por trigger `trg_restaurar_stock_cancelacion` |
| Trigger | `trg_actualizar_stock_compra_proveedor` | `tab_orden_compra_proveedor` | `tab_orden_compra_proveedor`, `tab_product_variant_combinations`, `tab_movimientos_inventario` | Stock por recepción | Al marcar producto recibido (`ind_estado_producto=3`) ejecuta `fun_trigger_actualizar_stock_compra_proveedor()`. | Implícito por `UPDATE tab_orden_compra_proveedor.ind_estado_producto` |

---

### Puntos

| Tipo (Función, Trigger o Vista) | Nombre | Tabla principal | Tablas involucradas | Funcionalidad | Descripción de proceso | Medio de transporte de la información |
|---|---|---|---|---|---|---|
| Función | `fun_crear_config_puntos_empresa` | `tab_config_puntos_empresa` | `tab_config_puntos_empresa` | Crear config puntos | Crea una nueva tasa/parametrización de puntos. | HTTP/JSON → `points_router.py` → `points_service.py` → `fun_crear_config_puntos_empresa` |
| Función | `fun_actualizar_config_puntos_empresa` | `tab_config_puntos_empresa` | `tab_config_puntos_empresa` | Actualizar config puntos | Actualiza/activa vigencia de configuración (tasa). | HTTP/JSON → `points_router.py` → `points_service.py` → `fun_actualizar_config_puntos_empresa` |
| Función | `fun_calcular_puntos_por_compra` | `tab_config_puntos_empresa` | `tab_config_puntos_empresa` | Cálculo puntos | Calcula puntos a otorgar según tasa activa. | Implícito (llamada desde acumulación o desde total carrito) |
| Trigger | `trg_orden_acumular_puntos` | `tab_ordenes` | `tab_ordenes`, `tab_puntos_usuario`, `tab_movimientos_puntos`, `tab_config_puntos_empresa` | Puntos al pagar | Al marcar `ind_estado=2` ejecuta `trg_acumular_puntos_orden()` para otorgar puntos. | Implícito por `UPDATE tab_ordenes` (checkout widget/webhook/pago) |
| Función | `trg_acumular_puntos_orden` | `tab_ordenes` | `tab_ordenes`, `tab_puntos_usuario`, `tab_movimientos_puntos` | Trigger points | Trigger function para acumular puntos al pagar. | Implícito por trigger `trg_orden_acumular_puntos` |
| Función | `fun_acumular_puntos_compra` | `tab_movimientos_puntos` | `tab_puntos_usuario`, `tab_movimientos_puntos`, `tab_config_puntos_empresa`, `tab_ordenes` | Acumular puntos | Registra movimiento de puntos por compra y actualiza saldo. | Trigger/flujo pago: `tab_ordenes.ind_estado→2` → trigger → `trg_acumular_puntos_orden()` → `fun_acumular_puntos_compra` |
| Función | `fun_obtener_historial_puntos` | `tab_movimientos_puntos` | `tab_movimientos_puntos` | Historial puntos | Devuelve historial (formateado) de movimientos. | HTTP/JSON → `points_per_user_router.py` → `points_per_user_service.py` → `fun_obtener_historial_puntos` |
| Vista | `vw_resumen_puntos_usuario` | `tab_puntos_usuario` | `tab_puntos_usuario`, `tab_usuarios` (según definición) | Vista puntos | Resumen de puntos por usuario (para panel/reporting). | HTTP/JSON → endpoints de puntos/reporting → `SELECT` a vista |

---

### Descuentos

| Tipo (Función, Trigger o Vista) | Nombre | Tabla principal | Tablas involucradas | Funcionalidad | Descripción de proceso | Medio de transporte de la información |
|---|---|---|---|---|---|---|
| Función | `fun_insert_descuento` | `tab_descuentos` | `tab_descuentos` | Crear descuento | Inserta descuento (porcentaje/monto, reglas, canjeable, cupón, etc.). | HTTP/JSON → `discount_router.py` → `discount_service.py` → `fun_insert_descuento` |
| Función | `fun_update_descuento` | `tab_descuentos` | `tab_descuentos` | Actualizar descuento | Actualiza reglas/fechas/usos/estado del descuento. | HTTP/JSON → `discount_router.py` → `discount_service.py` → `fun_update_descuento` |
| Función | `fun_obtener_descuento` | `tab_descuentos` | `tab_descuentos` | Consultar descuento | Devuelve detalle de un descuento. | HTTP/JSON → `discount_router.py` → `discount_service.py` → `fun_obtener_descuento` (o SQL directo) |
| Función | `fun_listar_descuentos` | `tab_descuentos` | `tab_descuentos` | Listado descuentos | Lista descuentos (admin). | HTTP/JSON → `discount_router.py` → `discount_service.py` → `fun_listar_descuentos` (si se usa) |
| Función | `fun_activar_desactivar_descuento` | `tab_descuentos` | `tab_descuentos` | Toggle descuento | Activa/desactiva descuento. | HTTP/JSON → `discount_router.py` → `discount_service.py` → `fun_activar_desactivar_descuento` |
| Función | `fun_validar_descuento_aplicable` | `tab_descuentos_usuarios` | `tab_descuentos`, `tab_descuentos_usuarios`, `tab_ordenes`, `tab_usuarios` | Validación cupón/reglas | Evalúa restricciones: vigencia, usos por usuario, primera compra, cupón personal (`id_usuario_destino`), etc. | HTTP/JSON → `discount_router.py` (validate) → `discount_service.py` → `fun_validar_descuento_aplicable` |
| Función | `fun_registrar_uso_descuento` | `tab_descuentos_usuarios` | `tab_descuentos_usuarios`, `tab_descuentos` | Registrar uso | Registra uso de descuento por usuario (y totales). | Implícito desde `fun_crear_orden_desde_carrito` (DB-internal) y/o services |
| Función | `fun_listar_descuentos_canjeables` | `tab_descuentos` | `tab_descuentos`, `tab_puntos_usuario`, `tab_canjes_puntos_descuentos` | Descuentos canjeables | Lista descuentos canjeables y calcula si el usuario puede canjear (puntos disponibles). | HTTP/JSON → `discount_router.py` → `discount_service.py` → `fun_listar_descuentos_canjeables` |
| Vista | `vw_descuentos_canjeables` | `tab_descuentos` | `tab_descuentos` | Vista canjeables | Proyección de descuentos canjeables por puntos + estado de vigencia formateado. | Consumo típico: `SELECT` (y/o desde `fun_listar_descuentos_canjeables`) |

---

### CMS

| Tipo (Función, Trigger o Vista) | Nombre | Tabla principal | Tablas involucradas | Funcionalidad | Descripción de proceso | Medio de transporte de la información |
|---|---|---|---|---|---|---|
| Función | `fun_insert_content` | `tab_cms_content` | `tab_cms_content` | Crear CMS | Inserta contenido CMS (bloques). | HTTP/JSON → `cms_router.py` → `cms_service.py` → `fun_insert_content` |
| Función | `fun_update_content` | `tab_cms_content` | `tab_cms_content` | Actualizar CMS | Actualiza contenido CMS. | HTTP/JSON → `cms_router.py` → `cms_service.py` → `fun_update_content` |
| Función | `fun_get_content` | `tab_cms_content` | `tab_cms_content` | Consultar CMS | Obtiene contenido CMS por filtros/id. | HTTP/JSON → `cms_router.py` → `cms_service.py` → `fun_get_content` |
| Función | `fun_delete_content` | `tab_cms_content` | `tab_cms_content` | Eliminar CMS | Elimina (lógico o físico según función). | HTTP/JSON → `cms_router.py` → `cms_service.py` → `fun_delete_content` |

---

### Favoritos

| Tipo (Función, Trigger o Vista) | Nombre | Tabla principal | Tablas involucradas | Funcionalidad | Descripción de proceso | Medio de transporte de la información |
|---|---|---|---|---|---|---|
| Función | `fun_insert_favorito` | `tab_favoritos` | `tab_favoritos`, `tab_products` | Agregar favorito | Inserta favorito usuario-producto. | HTTP/JSON → `favorites_router.py` → `favorites_service.py` → `fun_insert_favorito` |
| Función | `fun_delete_favorito` | `tab_favoritos` | `tab_favoritos` | Eliminar favorito | Borra favorito. | HTTP/JSON → `favorites_router.py` → `favorites_service.py` → `fun_delete_favorito` |
| Función | `fun_select_favoritos_usuario` / `fun_select_favoritos_usuario_con_detalles` | `tab_favoritos` | `tab_favoritos`, `tab_products`, `tab_product_variant_*`, `tab_product_variant_images` | Listar favoritos | Lista favoritos (con o sin detalles enriquecidos). | HTTP/JSON → `favorites_router.py` → `favorites_service.py` → `fun_select_favoritos_usuario*` |

---

### Comentarios

| Tipo (Función, Trigger o Vista) | Nombre | Tabla principal | Tablas involucradas | Funcionalidad | Descripción de proceso | Medio de transporte de la información |
|---|---|---|---|---|---|---|
| Función | `fun_insert_comentarios` | `tab_comentarios` | `tab_comentarios`, `tab_ordenes`, `tab_orden_productos` | Crear comentario/reseña | Inserta reseña vinculada a compra/orden. | HTTP/JSON → `comentary_router.py` → `comentary_service.py` → `fun_insert_comentarios` |
| Función | `fun_deactivate_comentarios` | `tab_comentarios` | `tab_comentarios` | Desactivar comentario | Oculta/desactiva comentario. | HTTP/JSON → `comentary_router.py` → `comentary_service.py` → `fun_deactivate_comentarios` |
| Función | `fun_get_reviewed_products_in_order` | `tab_comentarios` | `tab_comentarios`, `tab_orden_productos` | Validación reseñas | Devuelve productos ya reseñados para una orden. | HTTP/JSON → `comentary_router.py` → `comentary_service.py` → `fun_get_reviewed_products_in_order` |

---

### Proveedores/KPIs

| Tipo (Función, Trigger o Vista) | Nombre | Tabla principal | Tablas involucradas | Funcionalidad | Descripción de proceso | Medio de transporte de la información |
|---|---|---|---|---|---|---|
| Función | `fun_insert_proveedores` | `tab_proveedores` | `tab_proveedores` | Crear proveedor | Inserta proveedor. | HTTP/JSON → `provider_router.py` → `provider_service.py` → `fun_insert_proveedores` |
| Función | `fun_update_proveedores` | `tab_proveedores` | `tab_proveedores` | Actualizar proveedor | Actualiza datos/estado. | HTTP/JSON → `provider_router.py` → `provider_service.py` → `fun_update_proveedores` |
| Función | `fun_delete_proveedor` | `tab_proveedores` | `tab_proveedores` | Eliminar proveedor | Elimina proveedor. | HTTP/JSON → `provider_router.py` → `provider_service.py` → `fun_delete_proveedor` |
| Función | `fun_deactivate_activate_proveedores` | `tab_proveedores` | `tab_proveedores` | Activar/desactivar proveedor | Toggle de estado. | HTTP/JSON → `provider_router.py` → `provider_service.py` → `fun_deactivate_activate_proveedores` |
| Función | `fun_insert_orden_compra_proveedor` | `tab_orden_compra_proveedor` | `tab_orden_compra_proveedor`, `tab_proveedores`, `tab_products` | Crear O/C proveedor | Inserta orden de compra (abastecimiento). | HTTP/JSON → `order_buy_provider_router.py` → `order_buy_provider_services.py` → `fun_insert_orden_compra_proveedor` |
| Función | `fun_update_orden_compra_proveedor` | `tab_orden_compra_proveedor` | `tab_orden_compra_proveedor` | Actualizar O/C proveedor | Actualiza estados/cantidades/recepción. | HTTP/JSON → `order_buy_provider_router.py` → `order_buy_provider_services.py` → `fun_update_orden_compra_proveedor` |
| Trigger | `trg_validar_producto_compra_proveedor` | `tab_orden_compra_proveedor` | `tab_orden_compra_proveedor`, `tab_products` | Validación OC | Antes de insertar OC valida existencia de producto (`fun_trigger_validar_producto_compra_proveedor()`). | Implícito por `INSERT tab_orden_compra_proveedor` |
| Vista | `vw_top_productos_vendidos` | `tab_estadisticas_productos` | `tab_estadisticas_productos`, `tab_products`, `tab_categories` | Top ventas | Ranking de productos por unidades/ingresos con joins a categoría. | HTTP/JSON → `analytics_router.py`/`dashboard_router.py`/`statistic_router.py` → services → `SELECT` a vista |
| Vista | `vw_resumen_ventas_categoria` | `tab_estadisticas_categorias` | `tab_estadisticas_categorias`, `tab_categories` | Ventas por categoría | Resumen de ventas por categoría para reporting. | HTTP/JSON → analytics/dashboard/statistics → `SELECT` a vista |
| Trigger | `trg_actualizar_estadisticas_orden_pagada` | `tab_ordenes` | `tab_ordenes`, `tab_estadisticas_productos`, `tab_estadisticas_categorias`, `tab_orden_productos`, `tab_products` | Estadísticas ventas | Al pagar (`ind_estado=2`) ejecuta `fun_trigger_actualizar_estadisticas_orden()`. | Implícito por `UPDATE tab_ordenes` (pago aprobado) |
| Trigger | `trg_actualizar_estadisticas_cambio_producto_orden` | `tab_orden_productos` | `tab_orden_productos`, `tab_estadisticas_productos`, `tab_estadisticas_categorias` | Recalcular stats | Si se inserta/actualiza/elimina ítems de orden, ejecuta `fun_trigger_actualizar_estadisticas_producto_orden()`. | Implícito por DML sobre `tab_orden_productos` |
| Función | `fun_calcular_kpi` | (kpis) | `tab_kpis_*` | Cálculo KPI | Calcula KPI (según config del dashboard). | HTTP/JSON → `dashboard_router.py` → `dashboard_service.py`/SQL → `fun_calcular_kpi` |
| Función | `fun_crear_dashboard` / `fun_agregar_widget` / `fun_obtener_dashboard_completo` / `fun_actualizar_posicion_widget` | `tab_kpis_dashboards` | `tab_kpis_dashboards`, `tab_kpis_widgets`, cache/tablas auxiliares | Dashboard admin | CRUD/ensamble de dashboard y widgets KPI. | HTTP/JSON → `dashboard_router.py` → `dashboard_service.py` → funciones KPI |
| Función | `fun_limpiar_cache_expirado` / `fun_verificar_alertas_kpi` / `fun_trigger_limpiar_cache` | (kpis) | cache/tablas KPI | Mantenimiento KPI | Limpieza/alertas/caché y trigger asociado. | Implícito por trigger/cron/manual (según uso) |

Si quieres, puedo además **marcar explícitamente cuáles transacciones están 100% confirmadas por código DB+Service+Router** y cuáles quedan como **“potenciales/legacy”** (p.ej. `fun_marcar_orden_pagada` y funciones referenciadas no encontradas).