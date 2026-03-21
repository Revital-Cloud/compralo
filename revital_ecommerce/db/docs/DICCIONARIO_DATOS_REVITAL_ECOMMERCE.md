# Diccionario de datos — Revital E-commerce (DB)

- **Fuente de verdad**: `revital_ecommerce/db/db_revital.sql`
- **Última lectura del script**: 2026-03-19
- **Notas**:
  - Este diccionario refleja el esquema actual del “catálogo multi-industria”, que reemplaza el modelo anterior basado en `tab_categorias/tab_lineas/tab_sublineas/tab_productos`.
  - En tablas operativas (carrito/órdenes/inventario/compras), la referencia principal a “qué se compra/vende/mueve” es `**variant_id`** (`tab_product_variant_combinations.id`).

---

## Convenciones usadas aquí

- **Restricciones**:
  - PK = Primary Key
  - FK = Foreign Key
  - UQ = Unique
  - DF = Default
  - CK = Check
- Los **índices** listados son los definidos explícitamente en el script (incluye índices únicos parciales y GIN).

---

## Tabla: `tab_reg_del`

Registro de eliminaciones (log/soft-delete centralizado por tabla).


| Atributo   | Tipo de dato                | Restricción  | Descripción                        |
| ---------- | --------------------------- | ------------ | ---------------------------------- |
| id_del     | SERIAL                      | **PK**       | Identificador del log de borrado   |
| tab_name   | VARCHAR                     | **NOT NULL** | Nombre de la tabla afectada        |
| atributos  | JSONB                       | **NOT NULL** | Snapshot de atributos relevantes   |
| usr_delete | VARCHAR                     | **NOT NULL** | Usuario que ejecutó la eliminación |
| fec_delete | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL** | Fecha/hora de eliminación          |


---

## Catálogo multi-industria

### Tabla: `tab_categories`

Categorías jerárquicas (árbol) con `parent_id` auto-referenciado.


| Atributo   | Tipo de dato                | Restricción                         | Descripción                 |
| ---------- | --------------------------- | ----------------------------------- | --------------------------- |
| id         | DECIMAL(10)                 | **PK**                              | Identificador de categoría  |
| name       | VARCHAR                     | **NOT NULL**                        | Nombre                      |
| slug       | VARCHAR                     | **NOT NULL, UQ**                    | Slug único                  |
| parent_id  | DECIMAL(10)                 | **NULL, FK** → `tab_categories(id)` | Categoría padre (jerarquía) |
| is_active  | BOOLEAN                     | **DF TRUE**                         | Indicador de activo         |
| usr_insert | DECIMAL(10)                 | **NOT NULL**                        | Usuario creación            |
| fec_insert | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL, DF NOW()**              | Fecha creación              |
| usr_update | DECIMAL(10)                 | NULL                                | Usuario actualización       |
| fec_update | TIMESTAMP WITHOUT TIME ZONE | NULL                                | Fecha actualización         |


- **Índices**:
  - `idx_tab_categories_parent_id` en `(parent_id)`

---

### Tabla: `tab_attributes`

Maestro de atributos dinámicos (tipos controlados).


| Atributo              | Tipo de dato                | Restricción                                     | Descripción                        |
| --------------------- | --------------------------- | ----------------------------------------------- | ---------------------------------- |
| id                    | DECIMAL(10)                 | **PK**                                          | Identificador de atributo          |
| name                  | VARCHAR                     | **NOT NULL**                                    | Nombre                             |
| data_type             | VARCHAR                     | **NOT NULL, CK IN ('text','number','boolean')** | Tipo de dato lógico                |
| has_predefined_values | BOOLEAN                     | **DF FALSE**                                    | Indica si usa valores predefinidos |
| usr_insert            | DECIMAL(10)                 | **NOT NULL**                                    | Usuario creación                   |
| fec_insert            | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL, DF NOW()**                          | Fecha creación                     |
| usr_update            | DECIMAL(10)                 | NULL                                            | Usuario actualización              |
| fec_update            | TIMESTAMP WITHOUT TIME ZONE | NULL                                            | Fecha actualización                |


---

### Tabla: `tab_attribute_values`

Valores predefinidos por atributo (útil para swatches, selects, etc.).


| Atributo     | Tipo de dato                | Restricción                             | Descripción             |
| ------------ | --------------------------- | --------------------------------------- | ----------------------- |
| id           | DECIMAL(10)                 | **PK**                                  | Identificador del valor |
| attribute_id | DECIMAL(10)                 | **NOT NULL, FK** → `tab_attributes(id)` | Atributo padre          |
| value        | VARCHAR                     | **NOT NULL**                            | Valor (texto)           |
| hex_color    | VARCHAR                     | NULL                                    | Color HEX (si aplica)   |
| sort_order   | INT                         | **DF 0**                                | Orden                   |
| is_active    | BOOLEAN                     | **DF TRUE**                             | Indicador activo        |
| usr_insert   | DECIMAL(10)                 | **NOT NULL**                            | Usuario creación        |
| fec_insert   | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL, DF NOW()**                  | Fecha creación          |
| usr_update   | DECIMAL(10)                 | NULL                                    | Usuario actualización   |
| fec_update   | TIMESTAMP WITHOUT TIME ZONE | NULL                                    | Fecha actualización     |


- **Índices**:
  - `idx_tab_attribute_values_attribute_id` en `(attribute_id)`

---

### Tabla: `tab_category_attributes`

Asociación categoría ↔ atributo (requerido/filtrable).


| Atributo      | Tipo de dato                | Restricción                             | Descripción                              |
| ------------- | --------------------------- | --------------------------------------- | ---------------------------------------- |
| id            | DECIMAL(10)                 | **PK**                                  | Identificador de la relación             |
| category_id   | DECIMAL(10)                 | **NOT NULL, FK** → `tab_categories(id)` | Categoría                                |
| attribute_id  | DECIMAL(10)                 | **NOT NULL, FK** → `tab_attributes(id)` | Atributo                                 |
| is_required   | BOOLEAN                     | **NOT NULL, DF FALSE**                  | Requerido para productos de la categoría |
| is_filterable | BOOLEAN                     | **NOT NULL, DF FALSE**                  | Visible/usable en filtros                |
| usr_insert    | DECIMAL(10)                 | **NOT NULL**                            | Usuario creación                         |
| fec_insert    | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL, DF NOW()**                  | Fecha creación                           |
| usr_update    | DECIMAL(10)                 | NULL                                    | Usuario actualización                    |
| fec_update    | TIMESTAMP WITHOUT TIME ZONE | NULL                                    | Fecha actualización                      |


- **Restricciones**:
  - **UQ** `(category_id, attribute_id)`
- **Índices**:
  - `idx_tab_category_attributes_category_id` en `(category_id)`
  - `idx_tab_category_attributes_attribute_id` en `(attribute_id)`

---

### Tabla: `tab_products`

Producto base (sin precio/stock); el precio/stock vive en combinaciones de variante.


| Atributo     | Tipo de dato                | Restricción                                    | Descripción                   |
| ------------ | --------------------------- | ---------------------------------------------- | ----------------------------- |
| id           | DECIMAL(10)                 | **PK**                                         | Identificador del producto    |
| category_id  | DECIMAL(10)                 | **NOT NULL, FK** → `tab_categories(id)`        | Categoría                     |
| name         | VARCHAR                     | **NOT NULL**                                   | Nombre                        |
| slug         | VARCHAR                     | **NOT NULL, UQ**                               | Slug único                    |
| description  | TEXT                        | NULL                                           | Descripción                   |
| id_marca     | DECIMAL(10)                 | NULL, **FK** → `tab_marcas(id_marca)`          | Marca (vía `ALTER TABLE`)     |
| id_proveedor | DECIMAL(10)                 | NULL, **FK** → `tab_proveedores(id_proveedor)` | Proveedor (vía `ALTER TABLE`) |
| is_active    | BOOLEAN                     | **DF TRUE**                                    | Indicador activo              |
| usr_insert   | DECIMAL(10)                 | **NOT NULL**                                   | Usuario creación              |
| fec_insert   | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL, DF NOW()**                         | Fecha creación                |
| usr_update   | DECIMAL(10)                 | NULL                                           | Usuario actualización         |
| fec_update   | TIMESTAMP WITHOUT TIME ZONE | NULL                                           | Fecha actualización           |


- **Índices**:
  - `idx_tab_products_category_id` en `(category_id)`
  - `idx_tab_products_slug` (**UNIQUE INDEX**) en `(slug)` *(además del `UNIQUE` en columna)*

---

### Tabla: `tab_product_variant_groups`

Grupo de variantes por “atributo dominante” (cada grupo suele mapearse a una galería/variación principal).


| Atributo           | Tipo de dato                | Restricción                           | Descripción                               |
| ------------------ | --------------------------- | ------------------------------------- | ----------------------------------------- |
| id                 | BIGSERIAL                   | **PK**                                | Identificador del grupo                   |
| product_id         | DECIMAL(10)                 | **NOT NULL, FK** → `tab_products(id)` | Producto                                  |
| dominant_attribute | VARCHAR(100)                | **NOT NULL**                          | Nombre del atributo dominante (ej: Color) |
| dominant_value     | VARCHAR(255)                | **NOT NULL**                          | Valor dominante (ej: Negro)               |
| is_active          | BOOLEAN                     | **NOT NULL, DF TRUE**                 | Indicador activo                          |
| usr_insert         | DECIMAL(10)                 | **NOT NULL, DF 0**                    | Usuario creación                          |
| fec_insert         | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL, DF NOW()**                | Fecha creación                            |
| usr_update         | DECIMAL(10)                 | NULL                                  | Usuario actualización                     |
| fec_update         | TIMESTAMP WITHOUT TIME ZONE | NULL                                  | Fecha actualización                       |


- **Restricciones**:
  - **UQ** `(product_id, dominant_value)`
- **Índices**:
  - `idx_tab_product_variant_groups_product_id` en `(product_id)`
  - `idx_tab_product_variant_groups_product_active` en `(product_id, is_active)`

---

### Tabla: `tab_product_variant_combinations`

Combinación concreta (SKU) con **precio y stock** + atributos en JSONB.


| Atributo           | Tipo de dato                | Restricción                                         | Descripción                     |
| ------------------ | --------------------------- | --------------------------------------------------- | ------------------------------- |
| id                 | DECIMAL(10)                 | **PK**                                              | Identificador de la combinación |
| group_id           | BIGINT                      | **NOT NULL, FK** → `tab_product_variant_groups(id)` | Grupo                           |
| sku                | VARCHAR(120)                | **NOT NULL, UQ**                                    | SKU único                       |
| price              | DECIMAL(12,2)               | **NOT NULL, CK price >= 0**                         | Precio                          |
| stock              | INT                         | **NOT NULL, DF 0, CK stock >= 0**                   | Stock                           |
| tipo_clasificacion | VARCHAR(100)                | NULL                                                | Clasificación (si aplica)       |
| attributes         | JSONB                       | **NOT NULL, DF '{}'**                               | Atributos (JSON)                |
| is_active          | BOOLEAN                     | **NOT NULL, DF TRUE**                               | Indicador activo                |
| usr_insert         | DECIMAL(10)                 | **NOT NULL, DF 0**                                  | Usuario creación                |
| fec_insert         | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL, DF NOW()**                              | Fecha creación                  |
| usr_update         | DECIMAL(10)                 | NULL                                                | Usuario actualización           |
| fec_update         | TIMESTAMP WITHOUT TIME ZONE | NULL                                                | Fecha actualización             |


- **Índices**:
  - `idx_tab_product_variant_combinations_group_id` en `(group_id)`
  - `idx_tab_product_variant_combinations_group_active` en `(group_id, is_active)`
  - `idx_tab_product_variant_combinations_attributes_gin` (**GIN**) sobre `(attributes)`

---

### Tabla: `tab_product_variant_images`

Imágenes por grupo de variante (galería).


| Atributo         | Tipo de dato                | Restricción                                         | Descripción                |
| ---------------- | --------------------------- | --------------------------------------------------- | -------------------------- |
| id               | BIGSERIAL                   | **PK**                                              | Identificador de la imagen |
| variant_group_id | BIGINT                      | **NOT NULL, FK** → `tab_product_variant_groups(id)` | Grupo de variante          |
| image_url        | VARCHAR                     | **NOT NULL**                                        | URL                        |
| is_primary       | BOOLEAN                     | **NOT NULL, DF FALSE**                              | Principal                  |
| sort_order       | INT                         | **NOT NULL, DF 0**                                  | Orden                      |
| usr_insert       | DECIMAL(10)                 | **NOT NULL, DF 0**                                  | Usuario creación           |
| fec_insert       | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL, DF NOW()**                              | Fecha creación             |
| usr_update       | DECIMAL(10)                 | NULL                                                | Usuario actualización      |
| fec_update       | TIMESTAMP WITHOUT TIME ZONE | NULL                                                | Fecha actualización        |


- **Índices**:
  - `idx_tab_product_variant_images_variant_group_id` en `(variant_group_id)`
  - `idx_tab_product_variant_images_group_url` (**UNIQUE INDEX**) en `(variant_group_id, image_url)`

---

## Estadísticas

### Tabla: `tab_estadisticas_categorias`

Agregados por categoría (resumen ventas/inventario a nivel categoría).


| Atributo                  | Tipo de dato                | Restricción                       | Descripción                           |
| ------------------------- | --------------------------- | --------------------------------- | ------------------------------------- |
| category_id               | DECIMAL(10)                 | **PK, FK** → `tab_categories(id)` | Categoría                             |
| nom_categoria             | VARCHAR                     | NULL                              | Nombre de categoría (cache)           |
| categoria_activa          | BOOLEAN                     | NULL                              | Estado activo (cache)                 |
| total_productos           | INT                         | **DF 0**                          | Total productos                       |
| productos_activos         | INT                         | **DF 0**                          | Activos                               |
| productos_con_ventas      | INT                         | **DF 0**                          | Con ventas                            |
| total_ordenes             | INT                         | **DF 0**                          | Órdenes con productos de la categoría |
| total_unidades_vendidas   | INT                         | **DF 0**                          | Unidades vendidas                     |
| total_ingresos            | DECIMAL(15,2)               | **DF 0**                          | Ingresos totales                      |
| ventas_mes_actual         | INT                         | **DF 0**                          | Ventas mes actual                     |
| ingresos_mes_actual       | DECIMAL(12,2)               | **DF 0**                          | Ingresos mes actual                   |
| ventas_mes_anterior       | INT                         | **DF 0**                          | Ventas mes anterior                   |
| ingresos_mes_anterior     | DECIMAL(12,2)               | **DF 0**                          | Ingresos mes anterior                 |
| participacion_ventas      | DECIMAL(5,2)                | **DF 0**                          | % participación ventas                |
| crecimiento_mensual       | DECIMAL(5,2)                | **DF 0**                          | % crecimiento                         |
| precio_promedio_categoria | DECIMAL(10,2)               | **DF 0**                          | Precio promedio                       |
| producto_mas_vendido      | VARCHAR(255)                | NULL                              | Top producto (nombre)                 |
| producto_mayor_ingreso    | VARCHAR(255)                | NULL                              | Producto mayor ingreso (nombre)       |
| unidades_top_producto     | INT                         | **DF 0**                          | Unidades del top                      |
| fecha_primera_venta       | DATE                        | NULL                              | Primera venta                         |
| fecha_ultima_venta        | DATE                        | NULL                              | Última venta                          |
| mejor_mes_ventas          | VARCHAR(7)                  | NULL                              | Mejor mes (YYYY-MM)                   |
| ultima_actualizacion      | TIMESTAMP WITHOUT TIME ZONE | **DF NOW()**                      | Última actualización                  |
| periodo_calculo           | VARCHAR(7)                  | NULL                              | Período (YYYY-MM)                     |


---

### Tabla: `tab_estadisticas_productos`

Agregados por producto (resumen ventas/inventario a nivel producto).


| Atributo                 | Tipo de dato                | Restricción                     | Descripción               |
| ------------------------ | --------------------------- | ------------------------------- | ------------------------- |
| product_id               | DECIMAL(10)                 | **PK, FK** → `tab_products(id)` | Producto                  |
| nom_producto             | VARCHAR                     | NULL                            | Nombre (cache)            |
| precio_actual            | DECIMAL(10,2)               | NULL                            | Precio actual (cache)     |
| stock_actual             | INT                         | NULL                            | Stock actual (cache)      |
| producto_activo          | BOOLEAN                     | NULL                            | Activo (cache)            |
| total_ordenes            | INT                         | **DF 0**                        | Órdenes totales           |
| total_unidades_vendidas  | INT                         | **DF 0**                        | Unidades vendidas         |
| total_ingresos           | DECIMAL(15,2)               | **DF 0**                        | Ingresos totales          |
| ventas_mes_actual        | INT                         | **DF 0**                        | Unidades mes actual       |
| ingresos_mes_actual      | DECIMAL(12,2)               | **DF 0**                        | Ingresos mes actual       |
| ventas_mes_anterior      | INT                         | **DF 0**                        | Unidades mes anterior     |
| ingresos_mes_anterior    | DECIMAL(12,2)               | **DF 0**                        | Ingresos mes anterior     |
| promedio_venta_mensual   | DECIMAL(8,2)                | **DF 0**                        | Promedio unidades/mes     |
| promedio_ingreso_mensual | DECIMAL(12,2)               | **DF 0**                        | Promedio ingresos/mes     |
| precio_promedio_venta    | DECIMAL(10,2)               | **DF 0**                        | Precio promedio histórico |
| fecha_primera_venta      | DATE                        | NULL                            | Primera venta             |
| fecha_ultima_venta       | DATE                        | NULL                            | Última venta              |
| mes_mejor_venta          | VARCHAR(7)                  | NULL                            | Mejor mes (YYYY-MM)       |
| mejor_venta_unidades     | INT                         | **DF 0**                        | Máx unidades/mes          |
| dias_desde_ultima_venta  | INT                         | NULL                            | Días desde última venta   |
| rotacion_inventario      | DECIMAL(5,2)                | **DF 0**                        | Rotación anual            |
| nivel_rotacion           | VARCHAR(20)                 | NULL                            | Nivel (texto)             |
| ultima_actualizacion     | TIMESTAMP WITHOUT TIME ZONE | **DF NOW()**                    | Última actualización      |
| periodo_calculo          | VARCHAR(7)                  | NULL                            | Período (YYYY-MM)         |


---

## Seguridad, usuarios y perfiles

### Tabla: `tab_roles`

Roles de usuario.


| Atributo   | Tipo de dato                | Restricción      | Descripción           |
| ---------- | --------------------------- | ---------------- | --------------------- |
| id_rol     | DECIMAL(1)                  | **PK**           | Identificador del rol |
| nom_rol    | VARCHAR                     | **NOT NULL, UQ** | Nombre del rol        |
| des_rol    | VARCHAR                     | NULL             | Descripción           |
| usr_insert | DECIMAL(10)                 | **NOT NULL**     | Usuario creación      |
| fec_insert | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL**     | Fecha creación        |
| usr_update | DECIMAL(10)                 | NULL             | Usuario actualización |
| fec_update | TIMESTAMP WITHOUT TIME ZONE | NULL             | Fecha actualización   |


---

### Tabla: `tab_usuarios`

Usuarios del sistema.


| Atributo         | Tipo de dato                | Restricción                        | Descripción                  |
| ---------------- | --------------------------- | ---------------------------------- | ---------------------------- |
| id_usuario       | DECIMAL(10)                 | **PK**                             | Identificador del usuario    |
| nom_usuario      | VARCHAR                     | **NOT NULL**                       | Nombre                       |
| ape_usuario      | VARCHAR                     | **NOT NULL**                       | Apellido                     |
| email_usuario    | VARCHAR                     | **NOT NULL, UQ**                   | Email                        |
| password_usuario | VARCHAR                     | **NOT NULL**                       | Password encriptado          |
| id_rol           | DECIMAL(1)                  | **DF 2, FK** → `tab_roles(id_rol)` | Rol                          |
| ind_genero       | BOOLEAN                     | **NOT NULL**                       | Género (según modelo actual) |
| cel_usuario      | VARCHAR                     | **NOT NULL**                       | Celular                      |
| fec_nacimiento   | DATE                        | NULL                               | Fecha nacimiento             |
| ind_activo       | BOOLEAN                     | **DF TRUE**                        | Activo                       |
| avatar_seed      | VARCHAR(255)                | NULL                               | Seed avatar                  |
| avatar_colors    | VARCHAR(500)                | NULL                               | Colores avatar               |
| deleted_at       | TIMESTAMP WITHOUT TIME ZONE | NULL                               | Soft-delete timestamp        |
| usr_insert       | DECIMAL(10)                 | **NOT NULL**                       | Usuario creación             |
| fec_insert       | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL**                       | Fecha creación               |
| usr_update       | DECIMAL(10)                 | NULL                               | Usuario actualización        |
| fec_update       | TIMESTAMP WITHOUT TIME ZONE | NULL                               | Fecha actualización          |


---

### Tabla: `tab_direcciones_usuario`

Direcciones (múltiples por usuario).


| Atributo         | Tipo de dato                | Restricción                                                                   | Descripción                   |
| ---------------- | --------------------------- | ----------------------------------------------------------------------------- | ----------------------------- |
| id_direccion     | DECIMAL                     | **PK**                                                                        | Identificador de la dirección |
| id_usuario       | DECIMAL(10)                 | **NOT NULL, FK** → `tab_usuarios(id_usuario)` *(define `ON DELETE SET NULL`)* | Usuario                       |
| nombre_direccion | VARCHAR                     | **NOT NULL, CK LENGTH(TRIM) >= 2**                                            | Alias (Casa/Trabajo/…)        |
| calle_direccion  | VARCHAR                     | **NOT NULL, CK LENGTH(TRIM) >= 5**                                            | Calle/dirección               |
| ciudad           | VARCHAR                     | **NOT NULL**                                                                  | Ciudad                        |
| departamento     | VARCHAR                     | **NOT NULL**                                                                  | Departamento/Estado           |
| codigo_postal    | VARCHAR                     | **NOT NULL**                                                                  | Código postal                 |
| barrio           | VARCHAR                     | **NOT NULL**                                                                  | Barrio                        |
| referencias      | VARCHAR                     | NULL                                                                          | Referencias                   |
| complemento      | VARCHAR                     | NULL                                                                          | Complemento                   |
| ind_principal    | BOOLEAN                     | **NOT NULL, DF FALSE**                                                        | Principal                     |
| ind_activa       | BOOLEAN                     | **NOT NULL, DF TRUE**                                                         | Activa                        |
| usr_insert       | DECIMAL(10)                 | **NOT NULL**                                                                  | Usuario creación              |
| fec_insert       | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL, DF NOW()**                                                        | Fecha creación                |
| usr_update       | DECIMAL(10)                 | NULL                                                                          | Usuario actualización         |
| fec_update       | TIMESTAMP WITHOUT TIME ZONE | NULL                                                                          | Fecha actualización           |


- **Índices**:
  - `idx_direcciones_usuario_lookup` en `(id_usuario, ind_activa)`
  - `idx_direcciones_usuario_principal` en `(id_usuario, ind_principal)` **WHERE** `ind_principal = TRUE`
  - `idx_direcciones_usuario_ciudad` en `(ciudad, departamento)` **WHERE** `ind_activa = TRUE`
  - `idx_direcciones_una_principal_por_usuario` (**UNIQUE INDEX**) en `(id_usuario)` **WHERE** `ind_principal = TRUE AND ind_activa = TRUE`

---

### Tabla: `tab_metodos_pago_usuario`

Métodos de pago por usuario (Wompi).


| Atributo           | Tipo de dato                | Restricción                                   | Descripción            |
| ------------------ | --------------------------- | --------------------------------------------- | ---------------------- |
| id_metodo_pago     | SERIAL                      | **PK**                                        | Identificador          |
| id_usuario         | DECIMAL(10)                 | **NOT NULL, FK** → `tab_usuarios(id_usuario)` | Usuario                |
| provider_name      | VARCHAR(50)                 | **NOT NULL, DF 'wompi'**                      | Proveedor              |
| provider_source_id | VARCHAR(255)                | **NOT NULL**                                  | ID fuente en proveedor |
| brand              | VARCHAR(50)                 | NULL                                          | Marca tarjeta          |
| last_four_digits   | VARCHAR(4)                  | NULL                                          | Últimos 4 dígitos      |
| expiration_month   | INTEGER                     | NULL                                          | Mes                    |
| expiration_year    | INTEGER                     | NULL                                          | Año                    |
| card_holder        | VARCHAR(255)                | NULL                                          | Titular                |
| is_default         | BOOLEAN                     | **NOT NULL, DF FALSE**                        | Por defecto            |
| usr_insert         | DECIMAL(10)                 | **NOT NULL**                                  | Usuario creación       |
| fec_insert         | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL, DF NOW()**                        | Fecha creación         |
| usr_update         | DECIMAL(10)                 | NULL                                          | Usuario actualización  |
| fec_update         | TIMESTAMP WITHOUT TIME ZONE | NULL                                          | Fecha actualización    |


- **Restricciones**:
  - **UQ** `(id_usuario, provider_source_id, provider_name)`
- **Índices**:
  - `idx_metodos_pago_usuario` en `(id_usuario)`
  - `idx_metodos_pago_provider_source_id` en `(provider_source_id)`

---

## Compras, carrito, órdenes y pagos

### Tabla: `tab_carritos`

Cabecera de carrito (usuario o sesión anónima).


| Atributo   | Tipo de dato                | Restricción                           | Descripción               |
| ---------- | --------------------------- | ------------------------------------- | ------------------------- |
| id_carrito | SERIAL                      | **PK**                                | Identificador del carrito |
| id_usuario | DECIMAL(10)                 | NULL, FK → `tab_usuarios(id_usuario)` | Usuario (si autenticado)  |
| session_id | VARCHAR                     | NULL                                  | Sesión (si anónimo)       |
| usr_insert | DECIMAL(10)                 | **NOT NULL**                          | Usuario creación          |
| fec_insert | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL, DF NOW()**                | Fecha creación            |
| usr_update | DECIMAL(10)                 | NULL                                  | Usuario actualización     |
| fec_update | TIMESTAMP WITHOUT TIME ZONE | NULL                                  | Fecha actualización       |


- **Restricciones**:
  - **CK** `chk_usuario_o_session`: `id_usuario IS NOT NULL OR session_id IS NOT NULL`

---

### Tabla: `tab_carrito_productos`

Items del carrito (referencia principal por `variant_id`).


| Atributo                | Tipo de dato                | Restricción                                               | Descripción           |
| ----------------------- | --------------------------- | --------------------------------------------------------- | --------------------- |
| id_carrito_producto     | SERIAL                      | **PK**                                                    | Identificador item    |
| id_carrito              | INT                         | **NOT NULL, FK** → `tab_carritos(id_carrito)`             | Carrito               |
| variant_id              | DECIMAL(10)                 | **NOT NULL, FK** → `tab_product_variant_combinations(id)` | Variante              |
| cantidad                | INT                         | **NOT NULL, DF 1, CK cantidad > 0**                       | Cantidad              |
| precio_unitario_carrito | DECIMAL(12,2)               | **NOT NULL, CK >= 0**                                     | Precio unitario       |
| opciones_elegidas       | JSONB                       | **NOT NULL, DF '{}'::JSONB**                              | Opciones elegidas     |
| usr_insert              | DECIMAL(10)                 | **NOT NULL**                                              | Usuario creación      |
| fec_insert              | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL**                                              | Fecha creación        |
| usr_update              | DECIMAL(10)                 | NULL                                                      | Usuario actualización |
| fec_update              | TIMESTAMP WITHOUT TIME ZONE | NULL                                                      | Fecha actualización   |


- **Restricciones**:
  - **UQ** `uq_carrito_producto`: `(id_carrito, variant_id)`
- **Índices**:
  - `idx_carrito_productos_carrito` en `(id_carrito)`
  - `idx_carrito_productos_variant_id` en `(variant_id)`

---

### Tabla: `tab_ordenes`

Órdenes de usuario (totales con coherencia forzada por check).


| Atributo                     | Tipo de dato                | Restricción                                                | Descripción            |
| ---------------------------- | --------------------------- | ---------------------------------------------------------- | ---------------------- |
| id_orden                     | DECIMAL(10)                 | **PK**                                                     | Identificador de orden |
| fec_pedido                   | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL, DF NOW()**                                     | Fecha pedido           |
| id_usuario                   | DECIMAL(10)                 | **NOT NULL, FK** → `tab_usuarios(id_usuario)`              | Usuario                |
| val_total_productos          | DECIMAL(10,0)               | **NOT NULL, CK >= 0**                                      | Total productos        |
| val_total_descuentos         | DECIMAL(10,0)               | **NOT NULL, DF 0, CK >= 0**                                | Total descuentos       |
| val_total_pedido             | DECIMAL(10,0)               | **NOT NULL, CK >= 0**                                      | Total final            |
| ind_estado                   | DECIMAL(1)                  | **NOT NULL, DF 1, CK 1..3**                                | Estado                 |
| metodo_pago                  | VARCHAR(50)                 | **CK IN ('tarjeta','efectivo_red_pagos','transferencia')** | Método pago            |
| id_descuento                 | DECIMAL(10)                 | NULL, FK → `tab_descuentos(id_descuento)`                  | Descuento (legacy)     |
| detalle_descuentos_aplicados | JSON                        | NULL                                                       | Detalle descuentos     |
| des_observaciones            | VARCHAR                     | NULL                                                       | Observaciones          |
| usr_insert                   | DECIMAL(10)                 | **NOT NULL**                                               | Usuario creación       |
| fec_insert                   | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL**                                               | Fecha creación         |
| usr_update                   | DECIMAL(10)                 | NULL                                                       | Usuario actualización  |
| fec_update                   | TIMESTAMP WITHOUT TIME ZONE | NULL                                                       | Fecha actualización    |


- **Restricciones**:
  - **CK** `chk_totales_orden`: `val_total_pedido = val_total_productos - val_total_descuentos`

---

### Tabla: `tab_orden_productos`

Detalle de orden por `variant_id` (subtotal calculable y validado).


| Atributo              | Tipo de dato                | Restricción                                               | Descripción              |
| --------------------- | --------------------------- | --------------------------------------------------------- | ------------------------ |
| id_orden_producto     | DECIMAL(10)                 | **PK**                                                    | Identificador item orden |
| id_orden              | DECIMAL(10)                 | **NOT NULL, FK** → `tab_ordenes(id_orden)`                | Orden                    |
| variant_id            | DECIMAL(10)                 | **NOT NULL, FK** → `tab_product_variant_combinations(id)` | Variante                 |
| cant_producto         | INT                         | **NOT NULL, CK > 0**                                      | Cantidad                 |
| precio_unitario_orden | DECIMAL(10,0)               | **NOT NULL, CK >= 0**                                     | Precio unitario          |
| subtotal              | DECIMAL(10,0)               | **NOT NULL, CK >= 0**                                     | Subtotal                 |
| opciones_elegidas     | JSONB                       | **NOT NULL, DF '{}'::JSONB**                              | Opciones                 |
| usr_insert            | DECIMAL(10)                 | **NOT NULL**                                              | Usuario creación         |
| fec_insert            | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL**                                              | Fecha creación           |
| usr_update            | DECIMAL(10)                 | NULL                                                      | Usuario actualización    |
| fec_update            | TIMESTAMP WITHOUT TIME ZONE | NULL                                                      | Fecha actualización      |


- **Restricciones**:
  - **UQ** `uq_orden_producto`: `(id_orden, variant_id)`
  - **CK** `chk_subtotal_orden_producto`: `subtotal = cant_producto * precio_unitario_orden`
- **Índices**:
  - `idx_orden_productos_orden` en `(id_orden)`
  - `idx_orden_productos_variant_id` en `(variant_id)`

---

### Tabla: `tab_pagos`

Pagos/transacciones Wompi por orden (con tracking de reintentos).


| Atributo                | Tipo de dato                | Restricción                                                             | Descripción                  |
| ----------------------- | --------------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| id_pago                 | SERIAL                      | **PK**                                                                  | Identificador pago           |
| id_orden                | DECIMAL(10)                 | **NOT NULL, FK** → `tab_ordenes(id_orden)`                              | Orden                        |
| reference               | VARCHAR(255)                | NULL                                                                    | Referencia única (si aplica) |
| provider_transaction_id | VARCHAR(255)                | NULL                                                                    | ID transacción proveedor     |
| provider_name           | VARCHAR(50)                 | **NOT NULL, DF 'wompi'**                                                | Proveedor                    |
| status                  | VARCHAR(50)                 | **NOT NULL**                                                            | Estado proveedor             |
| status_detail           | VARCHAR(100)                | NULL                                                                    | Detalle                      |
| amount                  | DECIMAL(12,2)               | **NOT NULL, CK amount > 0**                                             | Monto                        |
| currency_id             | VARCHAR(10)                 | **NOT NULL, DF 'COP'**                                                  | Moneda                       |
| installments            | INTEGER                     | NULL                                                                    | Cuotas                       |
| payment_method_type     | VARCHAR(50)                 | NULL                                                                    | Tipo método                  |
| payment_method_extra    | JSONB                       | NULL                                                                    | Extra                        |
| fee_amount              | DECIMAL(10,2)               | **DF 0.00**                                                             | Comisión                     |
| net_received_amount     | DECIMAL(12,2)               | NULL                                                                    | Neto recibido                |
| provider_date_created   | TIMESTAMP                   | NULL                                                                    | Creación en proveedor        |
| provider_date_approved  | TIMESTAMP                   | NULL                                                                    | Aprobación                   |
| raw_response            | JSONB                       | NULL                                                                    | Respuesta cruda (legacy)     |
| raw_last_event          | JSONB                       | NULL                                                                    | Último evento/webhook        |
| parent_payment_id       | INTEGER                     | NULL, FK → `tab_pagos(id_pago)` *(ON DELETE SET NULL)*                  | Pago padre (reintentos)      |
| estado_procesamiento    | VARCHAR(20)                 | **DF 'pendiente', CK IN ('pendiente','procesado','error','cancelado')** | Estado interno               |
| usr_insert              | DECIMAL(10)                 | **NOT NULL**                                                            | Usuario creación             |
| fec_insert              | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL, DF NOW()**                                                  | Fecha creación               |
| usr_update              | DECIMAL(10)                 | NULL                                                                    | Usuario actualización        |
| fec_update              | TIMESTAMP WITHOUT TIME ZONE | NULL                                                                    | Fecha actualización          |


- **Índices**:
  - `idx_pagos_orden` en `(id_orden)`
  - `idx_pagos_provider_transaction_id` en `(provider_transaction_id)`
  - `idx_pagos_status` en `(status, estado_procesamiento)`
  - `idx_pagos_fecha_creacion` en `(provider_date_created DESC)`
  - `idx_pagos_reference` (**UNIQUE INDEX**) en `(reference)` **WHERE** `reference IS NOT NULL`
  - `idx_pagos_provider_transaction_unique` (**UNIQUE INDEX**) en `(provider_transaction_id, provider_name)` **WHERE** `provider_transaction_id IS NOT NULL`

---

## Proveedores, marcas, compras e inventario

### Tabla: `tab_proveedores`

Proveedores.


| Atributo      | Tipo de dato                | Restricción      | Descripción           |
| ------------- | --------------------------- | ---------------- | --------------------- |
| id_proveedor  | DECIMAL(10)                 | **PK**           | Identificador         |
| nom_proveedor | VARCHAR                     | **NOT NULL**     | Nombre                |
| email         | VARCHAR                     | **NOT NULL, UQ** | Email                 |
| tel_proveedor | DECIMAL(15)                 | **NOT NULL**     | Teléfono              |
| ind_activo    | BOOLEAN                     | **DF TRUE**      | Activo                |
| usr_insert    | DECIMAL(10)                 | **NOT NULL**     | Usuario creación      |
| fec_insert    | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL**     | Fecha creación        |
| usr_update    | DECIMAL(10)                 | NULL             | Usuario actualización |
| fec_update    | TIMESTAMP WITHOUT TIME ZONE | NULL             | Fecha actualización   |


---

### Tabla: `tab_marcas`

Marcas.


| Atributo   | Tipo de dato                | Restricción      | Descripción           |
| ---------- | --------------------------- | ---------------- | --------------------- |
| id_marca   | DECIMAL(10)                 | **PK**           | Identificador         |
| nom_marca  | VARCHAR                     | **NOT NULL, UQ** | Nombre                |
| ind_activo | BOOLEAN                     | **DF TRUE**      | Activo                |
| usr_insert | DECIMAL(10)                 | **NOT NULL**     | Usuario creación      |
| fec_insert | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL**     | Fecha creación        |
| usr_update | DECIMAL(10)                 | NULL             | Usuario actualización |
| fec_update | TIMESTAMP WITHOUT TIME ZONE | NULL             | Fecha actualización   |


---

### Tabla: `tab_orden_compra_proveedor`

Orden de compra a proveedor (por producto y opcionalmente por variante).


| Atributo               | Tipo de dato                | Restricción                                                           | Descripción                |
| ---------------------- | --------------------------- | --------------------------------------------------------------------- | -------------------------- |
| id_orden_compra        | DECIMAL(10)                 | **PK**                                                                | Identificador orden compra |
| id_proveedor           | DECIMAL(10)                 | **NOT NULL, FK** → `tab_proveedores(id_proveedor)`                    | Proveedor                  |
| fec_orden_compra       | DATE                        | **NOT NULL, DF CURRENT_DATE**                                         | Fecha orden                |
| fec_esperada_entrega   | DATE                        | **NOT NULL, CK >= fec_orden_compra**                                  | Fecha esperada             |
| observaciones_orden    | VARCHAR                     | NULL                                                                  | Observaciones              |
| product_id             | DECIMAL(10)                 | **NOT NULL, FK** → `tab_products(id)`                                 | Producto                   |
| variant_id             | DECIMAL(10)                 | NULL, FK → `tab_product_variant_combinations(id)`                     | Variante (opcional)        |
| cantidad_solicitada    | INT                         | **NOT NULL, CK > 0**                                                  | Cantidad pedida            |
| cantidad_recibida      | INT                         | **NOT NULL, DF 0, CK >= 0**                                           | Cantidad recibida          |
| costo_unitario         | DECIMAL(10,2)               | **NOT NULL, CK >= 0**                                                 | Costo unitario             |
| subtotal_producto      | DECIMAL(12,2)               | **GENERATED ALWAYS AS (cantidad_solicitada * costo_unitario) STORED** | Subtotal                   |
| ind_estado_producto    | DECIMAL(1)                  | **NOT NULL, DF 1, CK 1..4**                                           | Estado                     |
| fec_recepcion_completa | TIMESTAMP WITHOUT TIME ZONE | NULL                                                                  | Recepción completa         |
| observaciones_producto | VARCHAR                     | NULL                                                                  | Observaciones producto     |
| usr_insert             | DECIMAL(10)                 | **NOT NULL**                                                          | Usuario creación           |
| fec_insert             | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL, DF NOW()**                                                | Fecha creación             |
| usr_update             | DECIMAL(10)                 | NULL                                                                  | Usuario actualización      |
| fec_update             | TIMESTAMP WITHOUT TIME ZONE | NULL                                                                  | Fecha actualización        |


- **Restricciones**:
  - **CK** `chk_cantidad_recibida_limite`: `cantidad_recibida <= cantidad_solicitada`
  - **CK** `chk_fec_esperada_futura`: `fec_esperada_entrega >= fec_orden_compra`
  - **CK** `chk_recepcion_completa_coherente`: si `ind_estado_producto = 3` entonces `fec_recepcion_completa IS NOT NULL`, si no, debe ser `NULL`
- **Índices**:
  - `idx_orden_compra_proveedor_orden` en `(id_orden_compra, id_proveedor)`
  - `idx_orden_compra_proveedor_producto` en `(product_id)`
  - `idx_orden_compra_proveedor_variant` en `(variant_id)` **WHERE** `variant_id IS NOT NULL`
  - `idx_orden_compra_proveedor_estado` en `(ind_estado_producto, fec_esperada_entrega)`
  - `idx_orden_compra_proveedor_proveedor_fecha` en `(id_proveedor, fec_orden_compra DESC)`

---

### Tabla: `tab_movimientos_inventario`

Movimientos de inventario por `variant_id`.


| Atributo                       | Tipo de dato                | Restricción                                               | Descripción                                |
| ------------------------------ | --------------------------- | --------------------------------------------------------- | ------------------------------------------ |
| id_movimiento                  | SERIAL                      | **PK**                                                    | Identificador movimiento                   |
| variant_id                     | DECIMAL(10)                 | **NOT NULL, FK** → `tab_product_variant_combinations(id)` | Variante                                   |
| tipo_movimiento                | VARCHAR(25)                 | **NOT NULL, CK IN (...)**                                 | Tipo movimiento (entrada/salida/ajustes/…) |
| cantidad                       | INT                         | **NOT NULL, CK >= 0**                                     | Cantidad                                   |
| costo_unitario_movimiento      | DECIMAL(10,2)               | NULL (DF NULL)                                            | Costo unitario                             |
| stock_anterior                 | INT                         | NULL                                                      | Stock anterior                             |
| saldo_costo_total_anterior_mov | DECIMAL(12,2)               | NULL                                                      | Saldo costo anterior                       |
| stock_actual                   | INT                         | NULL                                                      | Stock actual                               |
| saldo_costo_total_actual_mov   | DECIMAL(12,2)               | NULL                                                      | Saldo costo actual                         |
| costo_promedio_ponderado_mov   | DECIMAL(10,2)               | NULL                                                      | CPP                                        |
| id_orden_usuario_detalle       | DECIMAL(10)                 | NULL, FK → `tab_orden_productos(id_orden_producto)`       | Item orden                                 |
| id_orden_compra                | DECIMAL(10)                 | NULL, FK → `tab_orden_compra_proveedor(id_orden_compra)`  | Orden compra                               |
| descripcion                    | VARCHAR                     | NULL                                                      | Descripción                                |
| observaciones                  | VARCHAR                     | NULL                                                      | Observaciones                              |
| usr_insert                     | DECIMAL(10)                 | **NOT NULL**                                              | Usuario creación                           |
| fec_insert                     | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL**                                              | Fecha creación                             |
| usr_update                     | DECIMAL(10)                 | NULL                                                      | Usuario actualización                      |
| fec_update                     | TIMESTAMP WITHOUT TIME ZONE | NULL                                                      | Fecha actualización                        |


- **Restricciones**:
  - **CK** `tipo_movimiento IN ('entrada_compra', 'salida_venta', 'ajuste_incremento', 'ajuste_decremento', 'devolucion_usuario', 'devolucion_proveedor', 'inventario_inicial')`
- **Índices**:
  - `idx_movimientos_inventario_variant_id` en `(variant_id)`

---

## Descuentos y fidelización

### Tabla: `tab_descuentos`

Descuentos/cupones y plantillas canjeables por puntos (reglas avanzadas).


| Atributo                 | Tipo de dato                | Restricción                                              | Descripción                        |
| ------------------------ | --------------------------- | -------------------------------------------------------- | ---------------------------------- |
| id_descuento             | DECIMAL(10)                 | **PK**                                                   | Identificador                      |
| nom_descuento            | VARCHAR                     | **NOT NULL**                                             | Nombre                             |
| des_descuento            | VARCHAR                     | NULL                                                     | Descripción                        |
| tipo_calculo             | BOOLEAN                     | **NOT NULL**                                             | TRUE=% / FALSE=monto               |
| val_porce_descuento      | DECIMAL(10,2)               | **NOT NULL**                                             | % descuento                        |
| val_monto_descuento      | DECIMAL(10,0)               | **NOT NULL**                                             | Monto fijo                         |
| aplica_a                 | VARCHAR(30)                 | **NOT NULL, CK IN (...)**                                | Tipo aplicación                    |
| category_id_aplica       | DECIMAL(10)                 | NULL, FK → `tab_categories(id)` *(ON DELETE SET NULL)*   | Categoría objetivo                 |
| product_id_aplica        | DECIMAL(10)                 | NULL, FK → `tab_products(id)` *(ON DELETE SET NULL)*     | Producto objetivo                  |
| id_marca_aplica          | DECIMAL(10)                 | NULL, FK → `tab_marcas(id_marca)` *(ON DELETE SET NULL)* | Marca objetivo                     |
| min_valor_pedido         | DECIMAL(10,2)               | **DF 0, CK >= 0**                                        | Mínimo pedido                      |
| ind_es_para_cumpleanos   | BOOLEAN                     | **DF FALSE**                                             | Cumpleaños                         |
| fec_inicio               | DATE                        | NULL                                                     | Inicio (NULL=sin límite/plantilla) |
| fec_fin                  | DATE                        | NULL                                                     | Fin (NULL=sin límite/plantilla)    |
| ind_activo               | BOOLEAN                     | **DF TRUE**                                              | Activo                             |
| max_usos_total           | INT                         | NULL, **CK NULL OR > 0**                                 | Límite total                       |
| usos_actuales_total      | INT                         | **DF 0, CK >= 0**                                        | Usos actuales                      |
| costo_puntos_canje       | INT                         | NULL, **CK NULL OR > 0**                                 | Puntos requeridos (si canjeable)   |
| ind_canjeable_puntos     | BOOLEAN                     | **NOT NULL, DF FALSE**                                   | Canjeable por puntos               |
| codigo_descuento         | VARCHAR                     | NULL, **UQ**                                             | Código cupón                       |
| max_usos_por_usuario     | INT                         | NULL, **CK NULL OR > 0**                                 | Límite por usuario                 |
| dias_semana_aplica       | VARCHAR                     | NULL, **CK formato**                                     | Días (L,M,X,J,V,S,D)               |
| horas_inicio             | TIME                        | NULL                                                     | Hora inicio                        |
| horas_fin                | TIME                        | NULL                                                     | Hora fin                           |
| solo_primera_compra      | BOOLEAN                     | **DF FALSE**                                             | Solo primera compra                |
| monto_minimo_producto    | DECIMAL(10,2)               | **DF 0, CK >= 0**                                        | Mínimo productos                   |
| cantidad_minima_producto | INT                         | **DF 1, CK >= 1**                                        | Cantidad mínima                    |
| requiere_codigo          | BOOLEAN                     | **DF FALSE**                                             | Requiere código                    |
| usr_insert               | DECIMAL(10)                 | **NOT NULL**                                             | Usuario creación                   |
| fec_insert               | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL**                                             | Fecha creación                     |
| usr_update               | DECIMAL(10)                 | NULL                                                     | Usuario actualización              |
| fec_update               | TIMESTAMP WITHOUT TIME ZONE | NULL                                                     | Fecha actualización                |


- **Constraints (resumen)**:
  - Fechas: ambas NULL o ambas con valor y `fec_fin >= fec_inicio`
  - Coherencia valor: % entre 0..100 cuando `tipo_calculo=TRUE`, monto >= 0 cuando `FALSE`
  - `aplica_a` en set permitido
  - Coherencia puntos: si `ind_canjeable_puntos=TRUE` entonces `costo_puntos_canje` no puede ser NULL y > 0
- **Índices**:
  - `idx_descuentos_fechas_activo` en `(fec_inicio, fec_fin, ind_activo)`
  - `idx_descuentos_codigo` en `(codigo_descuento)` **WHERE** `codigo_descuento IS NOT NULL`
  - `idx_descuentos_aplica_a` en `(aplica_a, ind_activo)`
  - `idx_descuentos_cumpleanos` en `(ind_es_para_cumpleanos, ind_activo)` **WHERE** `ind_es_para_cumpleanos = TRUE`
  - `idx_descuentos_primera_compra` en `(solo_primera_compra, ind_activo)` **WHERE** `solo_primera_compra = TRUE`

---

### Tabla: `tab_descuentos_usuarios`

Uso de descuentos por usuario (control de “veces usado”).


| Atributo     | Tipo de dato                | Restricción                                       | Descripción           |
| ------------ | --------------------------- | ------------------------------------------------- | --------------------- |
| id_descuento | DECIMAL(10)                 | **NOT NULL, FK** → `tab_descuentos(id_descuento)` | Descuento             |
| id_usuario   | DECIMAL(10)                 | **NOT NULL, FK** → `tab_usuarios(id_usuario)`     | Usuario               |
| veces_usado  | INT                         | **DF 1, CK >= 1**                                 | Veces usado           |
| usr_insert   | DECIMAL(10)                 | **NOT NULL**                                      | Usuario creación      |
| fec_insert   | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL**                                      | Fecha creación        |
| usr_update   | DECIMAL(10)                 | NULL                                              | Usuario actualización |
| fec_update   | TIMESTAMP WITHOUT TIME ZONE | NULL                                              | Fecha actualización   |


- **Restricciones**:
  - **UQ** `(id_descuento, id_usuario)`
- **Índices**:
  - `idx_descuentos_usuarios_lookup` en `(id_descuento, id_usuario)`
  - `idx_descuentos_usuarios_fecha` en `(fec_insert)`

---

### Tabla: `tab_config_puntos_empresa`

Configuración vigente del sistema de puntos.


| Atributo            | Tipo de dato                | Restricción                                                   | Descripción            |
| ------------------- | --------------------------- | ------------------------------------------------------------- | ---------------------- |
| id_config_puntos    | SERIAL                      | **PK**                                                        | Identificador          |
| pesos_por_punto     | DECIMAL(10,2)               | **NOT NULL, CK > 0**                                          | Conversión pesos→punto |
| ind_activo          | BOOLEAN                     | **NOT NULL, DF TRUE**                                         | Activo                 |
| descripcion         | VARCHAR                     | **NOT NULL, DF 'Configuración de puntos por pesos gastados'** | Descripción            |
| fec_inicio_vigencia | DATE                        | **NOT NULL, DF CURRENT_DATE**                                 | Inicio vigencia        |
| fec_fin_vigencia    | DATE                        | NULL                                                          | Fin vigencia           |
| usr_insert          | DECIMAL(10)                 | **NOT NULL**                                                  | Usuario creación       |
| fec_insert          | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL**                                                  | Fecha creación         |
| usr_update          | DECIMAL(10)                 | NULL                                                          | Usuario actualización  |
| fec_update          | TIMESTAMP WITHOUT TIME ZONE | NULL                                                          | Fecha actualización    |


- **Restricciones**:
  - **CK** `fec_fin_vigencia IS NULL OR fec_fin_vigencia >= fec_inicio_vigencia`
- **Índices**:
  - `idx_config_puntos_activa` en `(ind_activo, fec_inicio_vigencia, fec_fin_vigencia)` **WHERE** `ind_activo = TRUE`

---

### Tabla: `tab_puntos_usuario`

Saldo de puntos por usuario (consistencia validada por check).


| Atributo                 | Tipo de dato                | Restricción                             | Descripción           |
| ------------------------ | --------------------------- | --------------------------------------- | --------------------- |
| id_usuario               | DECIMAL(10)                 | **PK, FK** → `tab_usuarios(id_usuario)` | Usuario               |
| puntos_disponibles       | INT                         | **NOT NULL, DF 0, CK >= 0**             | Disponibles           |
| puntos_totales_ganados   | INT                         | **NOT NULL, DF 0, CK >= 0**             | Ganados               |
| puntos_totales_canjeados | INT                         | **NOT NULL, DF 0, CK >= 0**             | Canjeados             |
| fec_ultimo_canje         | TIMESTAMP WITHOUT TIME ZONE | NULL                                    | Último canje          |
| usr_insert               | DECIMAL(10)                 | **NOT NULL**                            | Usuario creación      |
| fec_insert               | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL**                            | Fecha creación        |
| usr_update               | DECIMAL(10)                 | NULL                                    | Usuario actualización |
| fec_update               | TIMESTAMP WITHOUT TIME ZONE | NULL                                    | Fecha actualización   |


- **Restricciones**:
  - **CK** `puntos_disponibles = (puntos_totales_ganados - puntos_totales_canjeados)`
- **Índices**:
  - `idx_puntos_usuario_lookup` en `(id_usuario, puntos_disponibles)`

---

### Tabla: `tab_movimientos_puntos`

Historial de movimientos de puntos (acumulación/canje/expiración).


| Atributo                    | Tipo de dato                | Restricción                                   | Descripción                        |
| --------------------------- | --------------------------- | --------------------------------------------- | ---------------------------------- |
| id_movimiento_puntos        | SERIAL                      | **PK**                                        | Identificador                      |
| id_usuario                  | DECIMAL(10)                 | **NOT NULL, FK** → `tab_usuarios(id_usuario)` | Usuario                            |
| tipo_movimiento             | DECIMAL(1)                  | **NOT NULL, CK IN (1,2,3)**                   | 1=acumulación,2=canje,3=expiración |
| cantidad_puntos             | INT                         | **NOT NULL, CK != 0**                         | Cantidad (+/-)                     |
| puntos_disponibles_anterior | INT                         | **NOT NULL, CK >= 0**                         | Antes                              |
| puntos_disponibles_actual   | INT                         | **NOT NULL, CK >= 0**                         | Después                            |
| id_orden_origen             | DECIMAL(10)                 | NULL, FK → `tab_ordenes(id_orden)`            | Orden origen (solo acumulación)    |
| id_descuento_canjeado       | DECIMAL(10)                 | NULL, FK → `tab_descuentos(id_descuento)`     | Descuento (solo canje)             |
| descripcion                 | VARCHAR                     | **NOT NULL**                                  | Descripción                        |
| usr_insert                  | DECIMAL(10)                 | **NOT NULL**                                  | Usuario creación                   |
| fec_insert                  | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL**                                  | Fecha creación                     |


- **Restricciones (según tipo)**:
  - Si `tipo_movimiento = 1` entonces `cantidad_puntos > 0`
  - Si `tipo_movimiento = 2` entonces `cantidad_puntos < 0`
  - `id_orden_origen` solo cuando acumulación
  - `id_descuento_canjeado` solo cuando canje
- **Índices**:
  - `idx_movimientos_puntos_usuario_fecha` en `(id_usuario, fec_insert DESC)`
  - `idx_movimientos_puntos_tipo` en `(tipo_movimiento, fec_insert DESC)`

---

### Tabla: `tab_canjes_puntos_descuentos`

Canjes de puntos por descuentos (y aplicación opcional a una orden).


| Atributo             | Tipo de dato                | Restricción                                       | Descripción           |
| -------------------- | --------------------------- | ------------------------------------------------- | --------------------- |
| id_canje             | SERIAL                      | **PK**                                            | Identificador         |
| id_usuario           | DECIMAL(10)                 | **NOT NULL, FK** → `tab_usuarios(id_usuario)`     | Usuario               |
| id_descuento         | DECIMAL(10)                 | **NOT NULL, FK** → `tab_descuentos(id_descuento)` | Descuento             |
| puntos_utilizados    | INT                         | **NOT NULL, CK > 0**                              | Puntos usados         |
| id_orden_aplicado    | DECIMAL(10)                 | NULL, FK → `tab_ordenes(id_orden)`                | Orden aplicada        |
| fec_expiracion_canje | TIMESTAMP WITHOUT TIME ZONE | NULL                                              | Expiración            |
| ind_utilizado        | BOOLEAN                     | **NOT NULL, DF FALSE**                            | Utilizado             |
| fec_utilizacion      | TIMESTAMP WITHOUT TIME ZONE | NULL                                              | Fecha utilización     |
| usr_insert           | DECIMAL(10)                 | **NOT NULL**                                      | Usuario creación      |
| fec_insert           | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL**                                      | Fecha creación        |
| usr_update           | DECIMAL(10)                 | NULL                                              | Usuario actualización |
| fec_update           | TIMESTAMP WITHOUT TIME ZONE | NULL                                              | Fecha actualización   |


- **Restricciones**:
  - **CK** utilización coherente:
    - si `ind_utilizado = FALSE` → `fec_utilizacion IS NULL AND id_orden_aplicado IS NULL`
    - si `ind_utilizado = TRUE` → `fec_utilizacion IS NOT NULL`
  - **CK** expiración: `fec_expiracion_canje IS NULL OR fec_expiracion_canje > fec_insert`
- **Índices**:
  - `idx_canjes_usuario_disponibles` en `(id_usuario, ind_utilizado, fec_expiracion_canje)` **WHERE** `ind_utilizado = FALSE`

---

## Contenido, reseñas y favoritos

### Tabla: `tab_cms_content`

Contenido CMS versionado (JSONB).


| Atributo        | Tipo de dato                | Restricción  | Descripción           |
| --------------- | --------------------------- | ------------ | --------------------- |
| id_cms_content  | SERIAL                      | **PK**       | Identificador         |
| nom_cms_content | VARCHAR                     | **NOT NULL** | Nombre                |
| des_cms_content | JSONB                       | **NOT NULL** | Contenido             |
| num_version     | INTEGER                     | **DF 1**     | Versión               |
| ind_publicado   | BOOLEAN                     | **DF false** | Publicado             |
| usr_insert      | DECIMAL(10)                 | **NOT NULL** | Usuario creación      |
| fec_insert      | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL** | Fecha creación        |
| usr_update      | DECIMAL(10)                 | NULL         | Usuario actualización |
| fec_update      | TIMESTAMP WITHOUT TIME ZONE | NULL         | Fecha actualización   |


---

### Tabla: `tab_favoritos`

Favoritos por usuario (producto base).


| Atributo   | Tipo de dato                | Restricción                                   | Descripción      |
| ---------- | --------------------------- | --------------------------------------------- | ---------------- |
| id_usuario | DECIMAL(10)                 | **NOT NULL, FK** → `tab_usuarios(id_usuario)` | Usuario          |
| product_id | DECIMAL(10)                 | **NOT NULL, FK** → `tab_products(id)`         | Producto         |
| usr_insert | DECIMAL(10)                 | **NOT NULL**                                  | Usuario creación |
| fec_insert | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL**                                  | Fecha creación   |


- **Restricciones**:
  - **PK compuesta** `(id_usuario, product_id)`
- **Índices**:
  - `idx_favoritos_usuario_fecha` en `(id_usuario, fec_insert DESC)`
  - `idx_favoritos_producto` en `(product_id)`
  - `idx_favoritos_fecha` en `(fec_insert DESC)`

---

### Tabla: `tab_comentarios`

Reseñas/comentarios de producto asociados a una orden.


| Atributo      | Tipo de dato                | Restricción                                                                | Descripción              |
| ------------- | --------------------------- | -------------------------------------------------------------------------- | ------------------------ |
| id_comentario | DECIMAL(10)                 | **NOT NULL**                                                               | Identificador comentario |
| product_id    | DECIMAL(10)                 | **NOT NULL, FK** → `tab_products(id)`                                      | Producto                 |
| id_usuario    | DECIMAL(10)                 | **NOT NULL, FK** → `tab_usuarios(id_usuario)`                              | Usuario                  |
| id_orden      | DECIMAL(10)                 | **NOT NULL, FK** → `tab_ordenes(id_orden)` *(se agrega vía `ALTER TABLE`)* | Orden                    |
| comentario    | VARCHAR                     | **NOT NULL, CK LENGTH(TRIM) >= 3**                                         | Texto                    |
| calificacion  | INT                         | **NOT NULL, CK 1..5**                                                      | Calificación             |
| ind_activo    | BOOLEAN                     | **NOT NULL, DF TRUE**                                                      | Activo                   |
| usr_insert    | DECIMAL(10)                 | **NOT NULL**                                                               | Usuario creación         |
| fec_insert    | TIMESTAMP WITHOUT TIME ZONE | **NOT NULL**                                                               | Fecha creación           |
| usr_update    | DECIMAL(10)                 | NULL                                                                       | Usuario actualización    |
| fec_update    | TIMESTAMP WITHOUT TIME ZONE | NULL                                                                       | Fecha actualización      |


- **Restricciones**:
  - **PK compuesta** `(id_comentario, product_id)`
  - **UQ** `uq_comentario_usuario_producto_orden`: `(id_usuario, id_orden, product_id)` (una reseña por producto por orden)

