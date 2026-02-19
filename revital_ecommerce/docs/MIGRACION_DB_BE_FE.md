# Migración DB, Backend y Frontend – Revital E-commerce

Este documento describe la migración de la base de datos al modelo actual (categorías jerárquicas, productos con variantes por grupos/combinaciones, atributos dinámicos) y los cambios realizados en backend (BE) y frontend (FE) para soportarlo.

---

## Índice

1. [Resumen del modelo actual](#1-resumen-del-modelo-actual)
2. [Categorías: padre, hijas y nietas](#2-categorías-padre-hijas-y-nietas)
3. [Productos, variantes, atributos](#3-productos-variantes-atributos)
4. [Cambios en la base de datos](#4-cambios-en-la-base-de-datos)
5. [Cambios en el backend](#5-cambios-en-el-backend)
6. [Cambios en el frontend](#6-cambios-en-el-frontend)
7. [Orden de migraciones y dependencias](#7-orden-de-migraciones-y-dependencias)

---

## 1. Resumen del modelo actual

- **Categorías:** Una sola tabla `tab_categories` con jerarquía por `parent_id` (padre → hijo → nieto). No hay tablas separadas “líneas” ni “sublíneas”.
- **Productos:** `tab_products` tiene `category_id` (siempre una categoría **hoja**, la “nieta”), `id_marca`, `id_proveedor`. **No** tiene precio ni stock.
- **Precio y stock:** Están en **variantes** (`tab_product_variant_combinations`), agrupadas por **grupos de variante** (`tab_product_variant_groups`). Cada grupo suele representar un “color” (atributo dominante) y tiene su propia galería de imágenes.
- **Atributos:** Maestro en `tab_attributes`; valores predefinidos (ej. colores con `hex_color`) en `tab_attribute_values`; relación categoría–atributo (filtrable/requerido) en `tab_category_attributes`. En cada variante vendible, los atributos no dominantes se guardan en JSONB en `tab_product_variant_combinations.attributes`.
- **Carrito y órdenes:** Referencian `variant_id` = ID de `tab_product_variant_combinations` (combinación vendible), no una “variante” antigua.

---

## 2. Categorías: padre, hijas y nietas

### 2.1 Concepto

- **Una sola tabla:** `tab_categories` con `id`, `name`, `slug`, `parent_id`, `is_active`, auditoría.
- **parent_id = NULL** → categoría **raíz** (en el catálogo suele llamarse “Categoría” o “padre”), ej. Tecnología, Hogar, Moda.
- **parent_id = ID de una raíz** → categoría **hija** (en el catálogo suele llamarse “Línea”), ej. Dispositivos Tecnológicos, Organización del Hogar.
- **parent_id = ID de una hija** → categoría **nieta** (en el catálogo “Sublínea”), ej. Smartphones, Neveras, Camisetas. Estas son las **hojas** donde se asignan los productos.

En resumen: **padre (raíz) → hijas (líneas) → nietas (sublíneas/hojas)**. Los productos usan siempre una categoría **hoja** (nieta).

### 2.2 Estructura en BD

```text
tab_categories
  id (DECIMAL PK)
  name, slug (UNIQUE)
  parent_id (FK → tab_categories.id, NULL = raíz)
  is_active
  usr_insert, fec_insert, usr_update, fec_update
```

- **Árbol:** Se recorre con CTE recursivo. La función `fun_get_categories_tree(p_root_id, p_active_only)` devuelve todas las categorías (o desde una raíz) con `level` (0 = raíz, 1 = hijo, 2 = nieto) y `path_ids` para orden.
- **Productos:** `tab_products.category_id` debe ser el `id` de una categoría **hoja** (nieta). No hay restricción a nivel de BD que impida asignar un producto a una categoría “padre” o “hija”; la convención de uso es que solo se usen hojas.

### 2.3 Filtro por categoría con subcategorías

- En tienda y admin, si el usuario elige una categoría (ej. “Tecnología”), se puede filtrar:
  - **Solo esa categoría:** productos con `category_id = id` de esa categoría.
  - **Incluir subcategorías:** productos cuya `category_id` sea esa categoría **o** cualquier descendiente en el árbol (todas las hijas y nietas).
- En la función `fun_filter_products`:
  - `p_category_id`: categoría seleccionada.
  - `p_include_subcategories`: si es `TRUE`, se usa un CTE recursivo para obtener todos los `id` del árbol bajo esa categoría; los productos se filtran por `category_id IN (esos ids)`.

### 2.4 Creación en Admin (FE/BE)

- **Crear categoría:** Se envía `name`, `parent_id` (opcional; `null` = raíz), `is_active`. El backend llama a `fun_insert_categoria`, que genera `id` y `slug` único.
- **Orden recomendado:** Primero todas las raíces (`parent_id` null), luego las hijas (con `parent_id` del padre), luego las nietas (con `parent_id` de la hija). Así al crear productos siempre hay una categoría hoja disponible para elegir.

---

## 3. Productos, variantes, atributos

### 3.1 Producto (cabecera)

| Tabla               | Rol                                                                 |
|---------------------|---------------------------------------------------------------------|
| `tab_products`      | Nombre, descripción, `category_id` (hoja), `id_marca`, `id_proveedor`, `is_active`. Sin precio ni stock. |

- Precio y stock **no** van en `tab_products`; van en las **combinaciones** de variantes.

### 3.2 Grupos de variante (galería por “color”)

| Tabla                          | Rol                                                                 |
|--------------------------------|---------------------------------------------------------------------|
| `tab_product_variant_groups`   | Agrupa variantes por un atributo **dominante** (típicamente “color”). Un grupo = una galería de imágenes. |

- Campos relevantes: `product_id`, `dominant_attribute` (ej. `'color'`), `dominant_value` (ej. `'Negro'`, `'Sin color'`), `is_active`.
- **Un producto** puede tener **varios grupos** (uno por valor dominante, ej. Negro, Blanco, Sin color).
- Las **imágenes** del producto van por grupo: `tab_product_variant_images(variant_group_id, image_url, is_primary, sort_order)`.

### 3.3 Combinaciones (variante vendible, SKU, precio, stock)

| Tabla                                | Rol                                                                 |
|--------------------------------------|---------------------------------------------------------------------|
| `tab_product_variant_combinations`   | Cada fila = una variante vendible: SKU, precio, stock, atributos en JSONB. |

- `group_id` → `tab_product_variant_groups.id`. Varias combinaciones pueden pertenecer al mismo grupo (ej. mismo color, distintas tallas).
- **price**, **stock**: solo aquí.
- **attributes** (JSONB): resto de atributos no dominantes, ej. `{"talla": "M", "almacenamiento": "128GB"}`. El atributo dominante (color) ya está en el grupo.
- Carrito, órdenes, movimientos de inventario y órdenes de compra a proveedor referencian **variant_id** = `tab_product_variant_combinations.id`.

### 3.4 Atributos dinámicos (maestro y por categoría)

| Tabla                        | Rol                                                                 |
|-----------------------------|---------------------------------------------------------------------|
| `tab_attributes`            | Maestro: nombre, `data_type` (text/number/boolean), `has_predefined_values`. |
| `tab_attribute_values`      | Valores predefinidos por atributo: `value`, `hex_color` (swatches), `sort_order`. |
| `tab_category_attributes`   | Qué atributos tiene una categoría; `is_required`, `is_filterable`.  |

- En las **combinaciones**, los atributos se guardan en JSONB (`attributes`). Pueden ser claves por nombre o por `attribute_id` según cómo los exponga el BE.
- En **filtros de tienda** se usan atributos con `is_filterable = true` y sus valores (desde `tab_attribute_values` o extraídos de `combinations.attributes`) para filtrar productos.

### 3.5 Flujo resumido

1. **Producto** → pertenece a una **categoría hoja** (nieta).
2. **Grupos de variante** → por producto, uno por valor del atributo dominante (ej. color).
3. **Imágenes** → por grupo (no por combinación).
4. **Combinaciones** → por grupo; cada una tiene precio, stock, SKU y `attributes` (JSONB).
5. **Carrito / orden** → guarda `variant_id` = ID de **combinación**.

---

## 4. Cambios en la base de datos

### 4.1 Categorías (modelo único)

- **Antes:** Existían o se usaban tablas/ideas separadas para “categorías”, “líneas” y “sublíneas”.
- **Ahora:** Una sola tabla `tab_categories` con `parent_id`. La jerarquía padre → hijo → nieto es solo por este campo. Funciones:
  - `fun_insert_categoria(name, parent_id, is_active, usr)` → genera `id` y `slug`.
  - `fun_update_categoria`, `fun_delete_categoria`, `fun_get_categories_tree(root_id, active_only)`.

### 4.2 Catálogo de productos: de variantes planas a grupos + combinaciones

- **Antes:**
  - `tab_product_variants`: cada fila era una variante con precio, stock, y a veces columnas `color`/`size`.
  - `tab_product_images`: imágenes por producto o por variante (`variant_id`).
  - `tab_product_variant_attributes`: relación variante–atributo–valor (color, talla, etc.).
- **Migración:** `migrate_to_variant_groups.sql`:
  - Crea `tab_product_variant_groups`, `tab_product_variant_combinations`, `tab_product_variant_images`.
  - Agrupa por atributo “color” (dominante): un grupo por (product_id, color). Si no hay color, grupo “Sin color”.
  - Copia cada fila de `tab_product_variants` a `tab_product_variant_combinations` (mismo `id`), asignando `group_id` según el grupo correspondiente. Atributos no color van a `attributes` JSONB.
  - Migra imágenes a `tab_product_variant_images` (por grupo); imágenes sin variante se asignan al primer grupo del producto.
  - Reasigna FKs de `tab_carrito_productos`, `tab_orden_productos`, `tab_movimientos_inventario`, `tab_orden_compra_proveedor` para que `variant_id` apunte a `tab_product_variant_combinations`.
  - Elimina `tab_product_variant_attributes`, `tab_product_images`, `tab_product_variants`.
- **Otras migraciones relacionadas:**
  - `drop_color_size_tab_product_variants.sql`: eliminaba columnas `color` y `size` de `tab_product_variants` (previo a la migración a grupos/combinaciones).
  - `add_attribute_predefined_values.sql`: añade `tab_attribute_values` y `has_predefined_values` en `tab_attributes` (atributos con valores fijos y opcionalmente `hex_color`).
  - `unique_variant_group_image_url.sql`: restricción única (variant_group_id, image_url) para no duplicar URLs por grupo.
  - `post_migrate_variant_groups_functions.sql`: funciones y ajustes posteriores al modelo de grupos/combinaciones.

### 4.3 Producto y proveedor

- **add_id_proveedor_tab_products.sql:** Añade `id_proveedor` (FK a `tab_proveedores`) en `tab_products`. Opcional.

### 4.4 Funciones de filtro de productos

- **fun_filter_products:** Filtra por `category_id` (y opcionalmente subcategorías con CTE recursivo), marca, nombre, rango de precio, stock. Precio y stock se calculan desde `tab_product_variant_combinations` + `tab_product_variant_groups`; imagen principal desde `tab_product_variant_images`.
- **fun_filter_admin_products:** Misma idea para listado admin; usa el mismo modelo de variantes (combinaciones/grupos).

### 4.5 Otras migraciones (lista breve)

- `add_opciones_elegidas_orden_productos.sql`: campo para opciones elegidas en ítems de orden (JSONB).
- `add_cart_order_color_talla.sql`, `add_variant_id_tab_product_images.sql`: ajustes de carrito/orden e imágenes (algunos quedaron obsoletos tras la migración a grupos).
- `allow_null_fechas_descuentos_canjeables.sql`, `add_payment_reference_fields.sql`, `grant_*`, etc.: descuentos, pagos, permisos.

---

## 5. Cambios en el backend

### 5.1 Categorías

- **Schemas:** `CategoryBase` con `parent_id` (opcional). `CategoryCreate` / `CategoryUpdate`; respuesta con `id`, `name`, `slug`, `parent_id`, `is_active` (y alias `ind_activo`), `productos_count`.
- **Service:** `create_category` llama a `fun_insert_categoria(name, parent_id, is_active, usr)`. `get_categories` devuelve todas con `productos_count`. No se construye el árbol en el servicio; el árbol se puede armar en FE o con un endpoint que use `fun_get_categories_tree`.
- **Router:** Endpoints CRUD; posible endpoint de árbol (tree) usando `fun_get_categories_tree`.
- **Atributos por categoría:** Endpoints para asignar/consultar atributos de una categoría (`tab_category_attributes`) y, si aplica, valores predefinidos (`tab_attribute_values`) para filtros y formularios.

### 5.2 Productos y variantes

- **Schemas:** `ProductBase` / `ProductCreate` con `category_id`, `id_marca`, `id_proveedor` (opcional). Sin precio/stock a nivel producto; el listado devuelve `price_min`, `stock_total`, `image_url` calculados desde variantes e imágenes. Para crear/editar compuesto: `ProductCreateComposite` con `product` (cabecera) y `variants` (lista de ítems con precio, stock, `attributes`, `image_urls` por variante).
- **Service:**
  - **Listado / detalle:** Consultas que hacen JOIN a `tab_product_variant_groups`, `tab_product_variant_combinations`, `tab_product_variant_images` para precio mínimo/máximo, stock total, imagen principal, y en detalle: `variant_groups` (con imágenes), `variants` (combinaciones con `attributes`), `images_by_variant` (imágenes del grupo de cada variante).
  - **Crear producto compuesto:** `create_product_composite`: inserta producto con `fun_insert_producto`, luego por cada “grupo” (agrupado por atributo dominante, ej. color) inserta grupo con `fun_insert_variant_group`, imágenes con `fun_insert_variant_group_image`, y combinaciones con `fun_insert_variant_combination` (SKU, price, stock, attributes JSONB).
  - **Edición:** Carga producto + grupos + combinaciones + imágenes; actualiza producto, grupos, combinaciones e imágenes según payload.
- **Filtros:** Parámetros `category_id`, `include_subcategories`, `id_marca`, rango de precio, stock, atributos. Se llama a `fun_filter_products` (o equivalente) que ya usa el árbol de categorías y las tablas de combinaciones/grupos.

### 5.3 Carrito y órdenes

- **variant_id** en carrito y en ítems de orden es siempre `tab_product_variant_combinations.id`. Servicios de carrito y orden leen precio/stock desde combinaciones y producto desde grupo/producto.

### 5.4 Descuentos y otros

- Descuentos pueden seguir referenciando categorías (`tab_categories`) o productos; si había referencias a “línea”/“sublínea” antiguas, pasan a ser un `category_id` del árbol actual. Cambios concretos dependen de tu implementación (discount_service, product_service con precios desde variantes).

---

## 6. Cambios en el frontend

### 6.1 Categorías (admin)

- **Listado:** Tabla con `id`, `name`, `parent_id` (se muestra el nombre del padre si existe), `is_active`, acciones.
- **Modal crear/editar:** Formulario con nombre y **selector de categoría padre** (`parent_id`). Opciones: “Ninguna” (raíz) o lista de categorías existentes (para construir padre → hija → nieta). Atributos de categoría (asignar atributos filtrables/requeridos a la categoría) si el backend lo expone.

### 6.2 Productos (admin)

- **Crear/editar producto:**
  - **Cabecera:** nombre, descripción, **categoría** (dropdown de categorías; en la práctica se suelen listar o marcar solo hojas para elegir), marca, proveedor, activo.
  - **Variantes:** Lista de ítems (filas) donde cada ítem puede representar un “grupo” (ej. un color) con sus imágenes y sus combinaciones (precio, stock, SKU, atributos). El BE agrupa por atributo dominante (ej. color) y escribe grupos + combinaciones + imágenes.
- **Tipos:** `ProductCreateComposite`, `VariantCreateItem` (price, stock, attributes, image_urls, main_index). Respuestas con `variant_groups`, `variants` (combinaciones), `images_by_variant` para el detalle y el selector en tienda.

### 6.3 Tienda (listado y detalle)

- **Listado:** Filtros por categoría (y “incluir subcategorías”), marca, precio, stock, atributos. Los filtros llaman al BE que usa `fun_filter_products` con `p_include_subcategories`. Precio/stock/imagen vienen de variantes.
- **Detalle (PDP):** Selector de variante por atributos (ej. color, talla). Datos del producto con `variants` (combinaciones) y `variant_groups` (para galería por color). Al añadir al carrito se envía `variant_id` = ID de combinación.

### 6.4 Tipos (FE)

- **Category:** `id`, `name`, `slug`, `parent_id`, `is_active` (y a veces `ind_activo`), `productos_count`.
- **CategoryTreeNode:** para árbol con `children` (usado en filtros o selectores).
- **ProductFilterParams:** `category_id`, `include_subcategories`, precio, marca, atributos, etc.
- **ProductDetail / Variant:** variante con `id` (combinación), `price`, `stock`, `attributes` (por nombre), `image`.
- **VariantCreateItem / ProductCreateComposite:** para formularios de crear/editar producto con variantes.

---

## 7. Orden de migraciones y dependencias

1. **Categorías:** Ya en `db_revital.sql` (tab_categories con parent_id). No hay migración separada “de líneas/sublíneas a árbol”; el modelo actual es el único.
2. **Atributos y valores predefinidos:** `add_attribute_predefined_values.sql` (tab_attributes.has_predefined_values, tab_attribute_values). Si en tu historia existió `tab_product_variant_attributes`, esta migración pudo haberse aplicado antes de la de grupos; luego `migrate_to_variant_groups.sql` elimina `tab_product_variant_attributes`.
3. **Variantes planas → grupos + combinaciones:**  
   - Hacer backup.  
   - Ejecutar `migrate_to_variant_groups.sql` (crea tablas, migra datos, reasigna FKs, elimina tablas antiguas y actualiza `fun_generate_sku` y funciones de grupos/combinaciones/imágenes).  
   - Aplicar `unique_variant_group_image_url.sql` si se requiere.  
   - `post_migrate_variant_groups_functions.sql` si existe.
4. **Productos:** `add_id_proveedor_tab_products.sql` cuando existan `tab_products` y `tab_proveedores`.
5. **Funciones de filtro:** Actualizar `fun_filter_products` y `fun_filter_admin_products` para que usen `tab_product_variant_combinations` y `tab_product_variant_groups` (ya reflejado en los archivos actuales).

En entornos nuevos, aplicar `db_revital.sql` (o el script principal que cree todo el esquema actual) evita tener que ejecutar migraciones antiguas; las migraciones listadas son para bases que partieron del modelo anterior.

---

## Resumen visual

```text
tab_categories (árbol)
  parent_id = NULL     → Padre (raíz)
  parent_id = padre    → Hija (línea)
  parent_id = hija     → Nieta (sublínea / hoja) ← tab_products.category_id

tab_products (1 por producto)
  category_id, id_marca, id_proveedor, name, description, is_active
  (sin precio ni stock)

tab_product_variant_groups (N por producto, ej. por color)
  product_id, dominant_attribute, dominant_value
  → tab_product_variant_images (imágenes por grupo)

tab_product_variant_combinations (N por grupo: SKU, precio, stock)
  group_id, sku, price, stock, attributes (JSONB)
  ← variant_id en carrito, orden, movimientos, orden compra

tab_attributes / tab_attribute_values / tab_category_attributes
  → Maestro de atributos, valores predefinidos, atributos por categoría (filtrable/requerido)
```

Con esto queda documentada la migración de la DB y los cambios en BE y FE para el modelo de categorías (padre/hijas/nietas), productos, variantes (grupos + combinaciones) y atributos.
