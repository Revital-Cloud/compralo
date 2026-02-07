# DOCUMENTACIÓN COMPLETA DE LA BASE DE DATOS REVITAL

> **Guía didáctica para entender y trabajar con la base de datos Revital**
>
> _Hecho para que hasta el más despistado del equipo entienda cómo funciona cada parte._

---

![Logo de Revital](../img/logo_revital.jpg)

## Índice

1. [Introducción General](#introducción-general)
2. [Estructura de Carpetas y Archivos](#estructura-de-carpetas-y-archivos)
3. [Tablas y Estructura Base (`db_revital.sql`)](#tablas-y-estructura-base-db_revitalsql)
4. [Auditoría y Triggers de Auditoría (`audit.sql`)](#auditoría-y-triggers-de-auditoría-auditsql)
5. [Triggers Generales (`triggers.sql` y carpeta triggers/)](#triggers-generales-triggerssql-y-carpeta-triggers)
6. [Funciones por Carpeta](#funciones-por-carpeta)
   - [tab_carritos](#tab_carritos)
   - [tab_metodos_pago_usuario](#tab_metodos_pago_usuario)
   - [tab_ordenes](#tab_ordenes)
   - [tab_productos](#tab_productos)
   - [tab_puntos_usuario](#tab_puntos_usuario)
   - [tab_usuarios](#tab_usuarios)
   - [tab_pagos](#tab_pagos)
   - [tab_comentarios](#tab_comentarios)
   - [tab_config_puntos_empresa](#tab_config_puntos_empresa)
   - [tab_ordenes_compra_proveedor](#tab_ordenes_compra_proveedor)
   - [tab_estadisticas_productos](#tab_estadisticas_productos)
   - [tab_estadisticas_categorias](#tab_estadisticas_categorias)
   - [tab_carrito_productos](#tab_carrito_productos)
   - [tab_descuentos](#tab_descuentos)
   - [tab_favoritos](#tab_favoritos)
   - [tab_direcciones_usuarios](#tab_direcciones_usuarios)
   - [tab_movimientos_puntos](#tab_movimientos_puntos)
   - [tab_sublineas](#tab_sublineas)
   - [tab_descuentos_usuarios](#tab_descuentos_usuarios)
   - [tab_marcas](#tab_marcas)
   - [tab_roles](#tab_roles)
   - [tab_proveedores](#tab_proveedores)
   - [tab_lineas](#tab_lineas)
   - [tab_cms_content](#tab_cms_content)
   - [tab_categorias](#tab_categorias)
   - [tab_canjes_puntos_descuentos](#tab_canjes_puntos_descuentos)

---

## Introducción General

Esta documentación explica **toda la estructura y lógica** de la base de datos Revital, carpeta por carpeta, función por función, archivo por archivo (excepto KPIs y archivos de documentación interna). Está pensada para que cualquier miembro del equipo, sin importar su experiencia, pueda entender cómo funciona cada parte, cómo se relacionan y cómo usarlas correctamente.

---

## Estructura de Carpetas y Archivos

- **/Functions/**: Contiene funciones SQL organizadas por entidad o módulo.
- **/triggers/**: Triggers específicos para eventos importantes.
- **audit.sql**: Lógica de auditoría y triggers de auditoría.
- **db_revital.sql**: Script principal de creación de tablas, constraints, relaciones, índices, etc.
- **triggers.sql**: Script principal de definición de triggers globales.

---

## Tablas y Estructura Base (`db_revital.sql`)

Esta sección explica **todas las tablas** de la base de datos Revital, sus campos, relaciones, restricciones y comandos especiales usados. Si ves palabras como `SERIAL`, `CHECK`, `DEFAULT`, `FOREIGN KEY`, `UNIQUE`, `GENERATED ALWAYS AS STORED`, etc., aquí te explico qué significan y por qué se usan.

### ¿Cómo leer esta sección?

- **Nombre de la tabla**: Sección principal.
- **Campos**: Cada columna explicada.
- **Restricciones**: Validaciones automáticas que impiden datos erróneos.
- **Relaciones**: Cómo se conecta con otras tablas.
- **Índices**: Mejoran la velocidad de búsqueda.
- **Comandos especiales**: Palabras reservadas de SQL que cumplen funciones específicas.

---

### Tabla: `tab_reg_del`

[tab_reg_del](../db_revital.sql#L57)

**Propósito:** Registrar eliminaciones lógicas o logs de borrado. Cada vez que se borra un registro de otra tabla, aquí se guarda un registro con la información eliminada, quién la borró y cuándo.

- `id_del         SERIAL PRIMARY KEY`: Identificador único, se autoincrementa solo (por eso `SERIAL`).
- `tab_name       VARCHAR NOT NULL`: Nombre de la tabla de donde se borró el registro.
- `atributos      JSONB NOT NULL`: Aquí se guarda el registro borrado en formato JSON (estructura flexible, guarda todos los campos).
- `usr_delete     VARCHAR NOT NULL`: Usuario que realizó el borrado.
- `fec_delete     TIMESTAMP WITHOUT TIME ZONE NOT NULL`: Fecha y hora exacta del borrado.

**¿Por qué usar JSONB?** Permite guardar cualquier estructura de datos, ideal para logs de auditoría.

---

### Tabla: `tab_categorias` [tab_categorias](../db_revital.sql#L66)

**Propósito:** Almacena las categorías principales de productos (ejemplo: Electrónica, Ropa, etc.).

- `id_categoria       DECIMAL(10) PRIMARY KEY`: Identificador único de la categoría.
- `nom_categoria      VARCHAR NOT NULL UNIQUE`: Nombre de la categoría, no se puede repetir.
- `ind_activo         BOOLEAN DEFAULT TRUE`: Indica si la categoría está activa (TRUE) o no.
- `usr_insert         DECIMAL(10) NOT NULL`: Usuario que creó la categoría.
- `fec_insert         TIMESTAMP WITHOUT TIME ZONE NOT NULL`: Fecha de creación.
- `usr_update         DECIMAL(10)`: Usuario que la modificó por última vez.
- `fec_update         TIMESTAMP WITHOUT TIME ZONE`: Fecha de última modificación.

**Comandos especiales:**

- `UNIQUE`: No permite nombres repetidos.
- `DEFAULT TRUE`: Si no se especifica, la categoría se crea activa.

---

### Tabla: `tab_lineas` [tab_lineas](../db_revital.sql#L78)

**Propósito:** Subdivisión de las categorías, por ejemplo, dentro de Electrónica puede haber "Celulares", "Computadores", etc.

- `id_categoria DECIMAL(10)`: Relaciona la línea con su categoría (ver FOREIGN KEY).
- `id_linea DECIMAL(10)`: Identificador único de la línea dentro de la categoría.
- `nom_linea VARCHAR NOT NULL UNIQUE`: Nombre de la línea, único.
- `ind_activo BOOLEAN DEFAULT TRUE`: Si está activa.
- `usr_insert`, `fec_insert`, `usr_update`, `fec_update`: Auditoría.

**Relaciones:**

- `FOREIGN KEY (id_categoria) REFERENCES tab_categorias(id_categoria)`: Solo puedes crear líneas para categorías que existan.
- `PRIMARY KEY (id_linea, id_categoria)`: La combinación de ambos es única.

---

### Tabla: `tab_sublineas`

**Propósito:** Subdivisión de las líneas, por ejemplo, dentro de "Celulares" puede haber "Smartphones", "Teléfonos básicos", etc.

- `id_categoria`, `id_linea`, `id_sublinea`: Identificadores.
- `nom_sublinea VARCHAR NOT NULL`: Nombre de la sublínea.
- `ind_activo`, `usr_insert`, `fec_insert`, `usr_update`, `fec_update`: Auditoría.

**Relaciones:**

- `FOREIGN KEY (id_linea, id_categoria) REFERENCES tab_lineas(id_linea, id_categoria)`: Solo puedes crear sublíneas para líneas existentes.
- `PRIMARY KEY (id_sublinea, id_linea, id_categoria)`: Unicidad.

---

### Tabla: `tab_estadisticas_categorias`

**Propósito:** Guarda estadísticas agregadas de ventas y productos por categoría. Útil para dashboards y reportes.

- `id_categoria DECIMAL(10) PRIMARY KEY`: Relacionada con la categoría.
- Campos como `total_productos`, `productos_activos`, `total_ordenes`, `total_unidades_vendidas`, `total_ingresos`, etc.: Números agregados para análisis.
- `ultima_actualizacion TIMESTAMP`: Cuándo se actualizaron los datos.

**Relaciones:**

- `FOREIGN KEY (id_categoria) REFERENCES tab_categorias(id_categoria)`

---

### Tabla: `tab_roles`

**Propósito:** Define los roles de usuario (ejemplo: admin, cliente, etc.).

- `id_rol DECIMAL(1) PRIMARY KEY`: Identificador del rol.
- `nom_rol VARCHAR NOT NULL UNIQUE`: Nombre único del rol.
- `des_rol VARCHAR`: Descripción.
- Auditoría: `usr_insert`, `fec_insert`, `usr_update`, `fec_update`.

---

### Tabla: `tab_usuarios`

**Propósito:** Almacena los usuarios del sistema.

- `id_usuario DECIMAL(10) PRIMARY KEY`: Identificador único.
- `nom_usuario`, `ape_usuario`, `email_usuario`, `password_usuario`: Datos personales y de acceso.
- `id_rol DECIMAL(1) DEFAULT 2`: Rol del usuario (por defecto, cliente).
- `ind_genero BOOLEAN NOT NULL`: Género (puede ser TRUE/FALSE, depende de la lógica de la app).
- `cel_usuario`, `fec_nacimiento`, `ind_activo`, auditoría.

**Relaciones:**

- `FOREIGN KEY (id_rol) REFERENCES tab_roles(id_rol)`: Solo puedes asignar roles existentes.
- `UNIQUE (email_usuario)`: No se pueden repetir correos.

---

### Tabla: `tab_direcciones_usuario`

**Propósito:** Permite que cada usuario tenga varias direcciones (casa, trabajo, etc.).

- `id_direccion DECIMAL PRIMARY KEY`: Identificador único.
- `id_usuario DECIMAL(10) NOT NULL`: Usuario dueño de la dirección.
- `nombre_direccion`, `calle_direccion`, `ciudad`, `departamento`, `codigo_postal`, `barrio`, `referencias`, `complemento`: Datos de la dirección.
- `ind_principal BOOLEAN NOT NULL DEFAULT FALSE`: Solo una dirección puede ser principal por usuario.
- `ind_activa BOOLEAN NOT NULL DEFAULT TRUE`: Para "borrado lógico".
- Auditoría.

**Relaciones y restricciones:**

- `FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario) ON DELETE SET NULL`: Si se borra el usuario, la dirección queda huérfana.
- `CHECK (LENGTH(TRIM(nombre_direccion)) >= 2)`: No permite nombres vacíos.
- `UNIQUE INDEX` para asegurar solo una dirección principal activa por usuario.

**Comandos especiales:**

- `CHECK`: Valida condiciones al insertar/modificar.
- `UNIQUE INDEX ... WHERE ...`: Permite restricciones condicionales (solo una principal activa).

---

### Tabla: `tab_metodos_pago_usuario`

**Propósito:** Métodos de pago guardados por usuario (tarjetas, Nequi, etc.).

- `id_metodo_pago SERIAL PRIMARY KEY`: Identificador único, autoincremental.
- `id_usuario DECIMAL(10) NOT NULL`: Usuario dueño del método.
- `provider_name VARCHAR(50) NOT NULL DEFAULT 'wompi'`: Nombre del proveedor (por defecto, Wompi).
- `provider_source_id VARCHAR(255) NOT NULL`: ID de la fuente de pago en el proveedor.
- `brand`, `last_four_digits`, `expiration_month`, `expiration_year`, `card_holder`: Datos de la tarjeta (no sensibles).
- `is_default BOOLEAN NOT NULL DEFAULT FALSE`: Si es el método principal.
- Auditoría.

**Relaciones y restricciones:**

- `FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario)`
- `UNIQUE (id_usuario, provider_source_id, provider_name)`: No puedes guardar dos veces el mismo método para el mismo usuario.

---

### Tabla: `tab_carritos`

**Propósito:** Carritos de compra, pueden estar asociados a un usuario o a una sesión anónima.

- `id_carrito SERIAL PRIMARY KEY`: Identificador único.
- `id_usuario DECIMAL(10) DEFAULT NULL`: Usuario dueño (si está logueado).
- `session_id VARCHAR(255) DEFAULT NULL`: ID de sesión (si es anónimo, solo para ver carrito).
- Auditoría.

**Restricción especial:**

- `CHECK (id_usuario IS NOT NULL OR session_id IS NOT NULL)`: Un carrito debe tener al menos un dueño (usuario o sesión).

---

### Tabla: `tab_proveedores`

**Propósito:** Proveedores de productos.

- `id_proveedor DECIMAL(10) PRIMARY KEY`: Identificador único.
- `nom_proveedor`, `email`, `tel_proveedor`, `ind_activo`, auditoría.
- `UNIQUE (email)`: No se pueden repetir correos de proveedores.

---

### Tabla: `tab_marcas`

**Propósito:** Marcas de productos.

- `id_marca DECIMAL(10) PRIMARY KEY`: Identificador único.
- `nom_marca VARCHAR NOT NULL UNIQUE`: Nombre único.
- `ind_activo`, auditoría.

---

### Tabla: `tab_productos`

**Propósito:** Productos a la venta.

- `id_categoria`, `id_linea`, `id_sublinea`, `id_producto`: Identificadores compuestos.
- `nom_producto`, `spcf_producto` (especificaciones en JSONB), `img_producto`, `val_precio`, `id_proveedor`, `id_marca`, `num_stock`, `ind_activo`, auditoría.

**Relaciones:**

- `FOREIGN KEY (id_proveedor) REFERENCES tab_proveedores(id_proveedor)`
- `FOREIGN KEY (id_categoria, id_linea, id_sublinea) REFERENCES tab_sublineas(...)`
- `FOREIGN KEY (id_marca) REFERENCES tab_marcas(id_marca)`
- `PRIMARY KEY (id_categoria, id_linea, id_sublinea, id_producto)`

**Comandos especiales:**

- `CHECK (val_precio >= 0)`: No permite precios negativos.
- `JSONB`: Permite guardar especificaciones flexibles.

---

### Tabla: `tab_orden_compra_proveedor`

**Propósito:** Órdenes de compra a proveedores (para reabastecimiento de inventario).

- `id_orden_compra DECIMAL(10) PRIMARY KEY`: Identificador único.
- `id_proveedor`, `fec_orden_compra`, `fec_esperada_entrega`, `observaciones_orden`, identificadores de producto, cantidades, costos, estado, fechas, auditoría.
- `subtotal_producto DECIMAL(12,2) GENERATED ALWAYS AS (cantidad_solicitada * costo_unitario) STORED`: Este campo se calcula automáticamente (por eso el comando especial `GENERATED ALWAYS AS ... STORED`).

**¿Por qué usar `GENERATED ALWAYS AS ... STORED`?**

- Calcula el subtotal automáticamente y lo guarda en la tabla, evitando errores humanos y mejorando el rendimiento en consultas.

**Restricciones y relaciones:**

- `FOREIGN KEY` a proveedores y productos.
- `CHECK` para validar cantidades y fechas.

---

### Tabla: `tab_comentarios`

**Propósito:** Comentarios de usuarios sobre productos.

- Identificadores de producto y usuario, comentario, estado, auditoría.
- `CHECK (LENGTH(TRIM(comentario)) >= 3)`: No permite comentarios vacíos o muy cortos.
- `PRIMARY KEY` compuesta.

---

### Tabla: `tab_descuentos`

**Propósito:** Descuentos aplicables a productos, categorías, marcas, líneas, etc. Incluye lógica avanzada para cupones, puntos, límites, fechas, etc.

- `id_descuento DECIMAL(10) PRIMARY KEY`: Identificador único.
- `nom_descuento`, `des_descuento`, `tipo_calculo` (TRUE=porcentaje, FALSE=monto fijo), valores de descuento, a qué aplica, fechas, límites, si es canjeable por puntos, código de cupón, etc.
- Auditoría.

**Comandos y restricciones especiales:**

- `CHECK` para validar coherencia de fechas, valores, límites, etc.
- `FOREIGN KEY` condicionales: Solo se llenan si el descuento aplica a ese tipo de entidad.
- `UNIQUE (codigo_descuento)`: No se pueden repetir códigos de cupón.
- `DEFAULT`, `NULL`, `ON DELETE SET NULL`: Controlan valores por defecto y comportamiento ante borrados.

---

### Tabla: `tab_descuentos_usuarios`

**Propósito:** Relaciona descuentos con usuarios que los han usado.

- `id_descuento`, `id_usuario`, `veces_usado`, auditoría.
- `UNIQUE (id_descuento, id_usuario)`: Un usuario no puede tener el mismo descuento dos veces.

---

### Tabla: `tab_ordenes`

**Propósito:** Órdenes de compra de los usuarios.

- `id_orden DECIMAL(10) PRIMARY KEY`: Identificador único.
- `fec_pedido`, `id_usuario`, totales, estado, método de pago, descuento aplicado, detalle de descuentos (JSON), observaciones, auditoría.

**Restricciones:**

- `FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario)`
- `CHECK (val_total_pedido = val_total_productos - val_total_descuentos)`: Valida que los totales sean coherentes.

---

### Tabla: `tab_pagos`

**Propósito:** Pagos realizados por los usuarios para sus órdenes.

- `id_pago SERIAL PRIMARY KEY`: Identificador único.
- `id_orden`, datos del proveedor de pago, estado, montos, comisiones, fechas, respuesta cruda (JSONB), estado de procesamiento, auditoría.

**Comandos y restricciones:**

- `UNIQUE (provider_transaction_id, provider_name)`: No se puede registrar dos veces el mismo pago.
- `CHECK (amount > 0)`: No permite pagos de valor cero o negativo.
- `CHECK (estado_procesamiento IN (...))`: Solo permite ciertos estados.

---

### Tabla: `tab_orden_productos`

**Propósito:** Productos incluidos en cada orden.

- Identificadores de producto y orden, cantidad, precio, subtotal, auditoría.
- `CONSTRAINT uq_orden_producto UNIQUE (...)`: No puedes repetir el mismo producto en la misma orden.
- `CHECK (subtotal = cant_producto * precio_unitario_orden)`: Valida coherencia de totales.

---

### Tabla: `tab_carrito_productos`

**Propósito:** Productos incluidos en cada carrito.

- Identificadores de carrito y producto, cantidad, precio, auditoría.
- `CONSTRAINT uq_carrito_producto UNIQUE (...)`: No puedes repetir el mismo producto en el mismo carrito.

---

### Tabla: `tab_movimientos_inventario`

**Propósito:** Registra todos los movimientos de inventario (entradas, salidas, ajustes, devoluciones, etc.).

- Identificadores de producto, tipo de movimiento, cantidades, costos, stock antes y después, referencias a órdenes, auditoría.
- `CHECK (tipo_movimiento IN (...))`: Solo permite ciertos tipos de movimiento.

---

### Tabla: `tab_estadisticas_productos`

**Propósito:** Estadísticas de ventas y rotación de cada producto.

- Identificadores de producto, totales de ventas, ingresos, fechas, promedios, rotación, auditoría.

---

### Tabla: `tab_cms_content`

**Propósito:** Contenido CMS (gestión de contenido) para la web/app.

- `id_cms_content SERIAL PRIMARY KEY`, nombre, contenido (JSONB), versión, publicado, auditoría.

---

### Tabla: `tab_favoritos`

**Propósito:** Productos marcados como favoritos por los usuarios.

- Identificadores de usuario y producto, auditoría.
- `PRIMARY KEY` compuesta.

---

### Tablas del sistema de fidelización

#### `tab_config_puntos_empresa`

- Configuración de cuántos pesos equivalen a un punto, vigencia, descripción, auditoría.
- `CHECK (pesos_por_punto > 0)`: No permite configuraciones absurdas.

#### `tab_puntos_usuario`

- Puntos acumulados, canjeados, disponibles, fechas, auditoría.
- `CHECK (puntos_disponibles = puntos_totales_ganados - puntos_totales_canjeados)`: Garantiza consistencia.

#### `tab_movimientos_puntos`

- Historial de movimientos de puntos (acumulación, canje, expiración), cantidades, referencias, auditoría.
- `CHECK` para validar coherencia según tipo de movimiento.

#### `tab_canjes_puntos_descuentos`

- Canjes de puntos por descuentos, usuario, descuento, puntos usados, orden aplicada, expiración, estado, auditoría.
- `CHECK` para validar coherencia de uso y fechas.

---

### Índices

A lo largo del script verás muchos comandos `CREATE INDEX` y `CREATE UNIQUE INDEX`. Estos sirven para **acelerar las búsquedas** y garantizar unicidad en ciertos casos. Por ejemplo, buscar todos los favoritos de un usuario, o asegurar que solo haya una dirección principal activa por usuario.

---

**¿Dudas?** Si ves un comando raro, busca aquí o pregunta. ¡Sigue leyendo para entender la auditoría y los triggers!.

---

## Auditoría y Triggers de Auditoría (`audit.sql`)

La auditoría es fundamental para saber **quién hizo qué y cuándo** en la base de datos. Aquí te explico cómo funciona el sistema de auditoría de Revital.

### Función: `fun_audit_tablas()`

**Propósito:**

- Registrar automáticamente la fecha de inserción y actualización de cada registro.
- Guardar un log detallado de los registros eliminados (borrado lógico) en la tabla `tab_reg_del`.

**¿Cómo funciona?**

- Se ejecuta como trigger en cada tabla importante.
- Según la operación (`TG_OP`), hace lo siguiente:
  - **INSERT:** Actualiza el campo `fec_insert` con la fecha y hora actual (`CURRENT_TIMESTAMP`).
  - **UPDATE:** Actualiza el campo `fec_update` con la fecha y hora actual.
  - **DELETE:** Inserta un registro en `tab_reg_del` con:
    - El nombre de la tabla (`TG_TABLE_NAME`)
    - Todos los atributos del registro borrado, convertidos a JSON (`row_to_json(OLD)`).
    - El usuario que borró (`CURRENT_USER`).
    - La fecha y hora del borrado.

**Comandos especiales usados:**

- `TG_OP`: Variable especial de triggers en PostgreSQL que indica la operación (INSERT, UPDATE, DELETE).
- `TG_TABLE_NAME`: Nombre de la tabla donde se ejecuta el trigger.
- `row_to_json(OLD)`: Convierte el registro borrado a formato JSON, para guardar todos los datos de forma flexible.
- `CURRENT_USER`: Usuario de la base de datos que ejecutó la acción.
- `CURRENT_TIMESTAMP`: Fecha y hora actual.

### Triggers de auditoría

Para cada tabla importante, se crea un trigger que ejecuta la función `fun_audit_tablas()` **antes** de cada inserción, actualización o borrado. Ejemplo:

```sql
CREATE OR REPLACE TRIGGER tri_audit_categorias BEFORE INSERT OR UPDATE OR DELETE ON tab_categorias
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();
```

Esto asegura que **todas las acciones** sobre la tabla quedan registradas y auditadas.

**¿Por qué es importante?**

- Permite rastrear cambios y detectar errores o fraudes.
- Facilita la recuperación de información borrada accidentalmente.
- Es clave para cumplir normativas de seguridad y auditoría.

**¿Qué tablas están auditadas?**

- Prácticamente todas las tablas principales: categorías, líneas, sublíneas, roles, usuarios, carritos, proveedores, órdenes, productos, descuentos, pagos, favoritos, puntos, canjes, etc.

**Consejo:**

- Si agregas una tabla nueva y quieres que esté auditada, crea un trigger igual para esa tabla.

---

## Triggers Generales (`triggers.sql` y carpeta triggers/)

Los **triggers** (disparadores) son piezas clave que automatizan acciones en la base de datos cuando ocurre un evento (insertar, actualizar, borrar). Aquí te explico cada uno de los triggers generales, cuándo se disparan, qué función ejecutan y por qué existen.

### ¿Cómo leer esta sección?

- **Nombre del trigger**: Sección principal.
- **Evento**: ¿Cuándo se dispara? (ej: después de actualizar una orden)
- **Función ejecutada**: ¿Qué hace cuando se dispara?
- **Comandos especiales**: Explicación de palabras clave como `AFTER`, `BEFORE`, `WHEN`, etc.

---

### Trigger: `trg_orden_acumular_puntos`

- **Evento:** `AFTER UPDATE ON tab_ordenes` (después de actualizar una orden)
- **Condición:** `WHEN (OLD.ind_estado != 2 AND NEW.ind_estado = 2)` (solo si el estado cambia a PAGADA)
- **Función ejecutada:** `trg_acumular_puntos_orden()`

**¿Por qué?**
Cuando una orden se marca como pagada, automáticamente se acumulan los puntos de fidelización para el usuario.

**Comandos especiales:**

- `AFTER UPDATE`: El trigger se ejecuta después de la actualización.
- `WHEN`: Permite condicionar el trigger a un cambio específico (aquí, solo si la orden pasa a estado 2 = pagada).

---

### Trigger: `trg_actualizar_estadisticas_orden_pagada`

- **Evento:** `AFTER INSERT OR UPDATE OF ind_estado ON tab_ordenes`
- **Condición:** `WHEN (NEW.ind_estado = 2)` (solo si la orden está pagada)
- **Función ejecutada:** `fun_trigger_actualizar_estadisticas_orden()`

**¿Por qué?**
Actualiza las estadísticas de ventas y productos cada vez que una orden se paga.

**Comandos especiales:**

- `AFTER INSERT OR UPDATE OF ind_estado`: Se dispara después de insertar o actualizar el campo `ind_estado`.
- `WHEN`: Solo si el nuevo estado es 2 (pagada).

---

### Trigger: `trg_actualizar_estadisticas_cambio_producto_orden`

- **Evento:** `AFTER INSERT OR UPDATE OR DELETE ON tab_orden_productos`
- **Función ejecutada:** `fun_trigger_actualizar_estadisticas_producto_orden()`

**¿Por qué?**
Cada vez que se agregan, modifican o eliminan productos de una orden, se actualizan las estadísticas de productos.

**Comandos especiales:**

- `AFTER INSERT OR UPDATE OR DELETE`: Se dispara después de cualquiera de estos eventos.

---

### Trigger: `trg_actualizar_stock_orden_pagada`

- **Evento:** `AFTER UPDATE ON tab_ordenes`
- **Condición:** `WHEN (OLD.ind_estado != 2 AND NEW.ind_estado = 2)`
- **Función ejecutada:** `fun_actualizar_stock_automatico()`

**¿Por qué?**
Cuando una orden se paga, se descuenta automáticamente el stock de los productos vendidos.

---

### Trigger: `trg_marcar_orden_pagada_mercadopago`

- **Evento:** `AFTER UPDATE OF status ON tab_pagos`
- **Condición:** `WHEN (NEW.status = 'approved')`
- **Función ejecutada:** `fun_trigger_marcar_orden_pagada_auto()`

**¿Por qué?**
Cuando un pago es aprobado por el proveedor (ej: Wompi), la orden se marca automáticamente como pagada.

---

### Trigger: `trg_limpiar_carrito_pagado`

- **Evento:** `AFTER UPDATE ON tab_ordenes`
- **Condición:** `WHEN (OLD.ind_estado != 2 AND NEW.ind_estado = 2)`
- **Función ejecutada:** `fun_limpiar_carrito_pagado()`

**¿Por qué?**
Cuando una orden se paga, se limpia el carrito del usuario para evitar duplicidades.

---

### Trigger: `trg_restaurar_stock_cancelacion`

- **Evento:** `AFTER UPDATE ON tab_ordenes`
- **Condición:** `WHEN (OLD.ind_estado != 4 AND NEW.ind_estado = 4)` (cambio a cancelada)
- **Función ejecutada:** `fun_restaurar_stock_cancelacion()`

**¿Por qué?**
Si una orden se cancela, se devuelve el stock de los productos al inventario.

---

### Trigger: `trg_validar_producto_compra_proveedor`

- **Evento:** `BEFORE INSERT ON tab_orden_compra_proveedor`
- **Función ejecutada:** `fun_trigger_validar_producto_compra_proveedor()`

**¿Por qué?**
Antes de crear una orden de compra a proveedor, valida que el producto exista y sea válido.

**Comandos especiales:**

- `BEFORE INSERT`: El trigger se ejecuta antes de insertar el registro, permitiendo cancelar la operación si hay un error.

---

### Trigger: `trg_actualizar_stock_compra_proveedor`

- **Evento:** `AFTER UPDATE OF ind_estado_producto ON tab_orden_compra_proveedor`
- **Condición:** `WHEN (NEW.ind_estado_producto = 3)` (producto recibido)
- **Función ejecutada:** `fun_trigger_actualizar_stock_compra_proveedor()`

**¿Por qué?**
Cuando se recibe un producto de una orden de compra a proveedor, se actualiza el stock automáticamente.

---

**¿Qué es importante entender?**

- Los triggers automatizan procesos críticos y evitan errores humanos.
- El uso de `WHEN` permite que solo se ejecuten en condiciones específicas, optimizando el rendimiento y evitando acciones innecesarias.
- Los triggers `BEFORE` pueden cancelar operaciones si detectan errores, los `AFTER` solo actúan después de que el cambio ya ocurrió.

**Consejo:**

- Si ves un trigger nuevo, revisa bien la condición `WHEN` y la función que ejecuta para entender su impacto.

---

### tab_carritos

#### fun_calcular_total_carrito.sql

**Propósito:**
Calcula el total del carrito de compras, aplicando automáticamente todos los descuentos de empresa disponibles y, si corresponde, un descuento canjeado por puntos. Soporta tanto usuarios registrados como anónimos.

**Parámetros:**

- `p_id_usuario`: ID del usuario registrado (opcional).
- `p_session_id`: ID de sesión para usuarios anónimos (opcional).
- `p_id_canje_aplicar`: ID del canje de puntos a aplicar (opcional).

**Retorna:**
Un JSON con:

- `total_productos`: Total sin descuentos.
- `total_descuentos`: Suma de todos los descuentos aplicados.
- `total_final`: Total a pagar (productos - descuentos).
- `descuentos_aplicados`, `descuentos_automaticos`, `descuento_canjeado`, `es_primera_compra`, `mensaje`.

**Lógica paso a paso:**

1. **Validación de entrada:** Al menos uno de los parámetros (`p_id_usuario` o `p_session_id`) debe estar presente. Si no, lanza un error con `RAISE EXCEPTION`.
2. **Obtención del carrito:** Llama a la función `fun_obtener_carrito_usuario` para obtener el ID del carrito activo.
3. **Cálculo del total de productos:** Suma la cantidad por el precio de cada producto en el carrito. Usa `COALESCE(SUM(...), 0)` para evitar NULL si el carrito está vacío.
4. **Validación de carrito vacío:** Si el total es 0, retorna un JSON indicando que el carrito está vacío y no sigue procesando.
5. **Verificación de primera compra:** Si es usuario registrado, verifica con `NOT EXISTS` si ya tiene órdenes previas.
6. **Aplicación de descuentos automáticos:** Itera con un `FOR ... IN` sobre todos los descuentos automáticos activos y aplicables. Usa `CASE`, `LEAST`, `COALESCE`, `json_agg`, `json_array_elements`, `json_build_object`, `UNION ALL` para calcular y agregar descuentos.
7. **Aplicación de descuento canjeado por puntos:** Si se pasa un ID de canje y el usuario es registrado, busca el canje y el descuento asociado, verifica que no esté usado ni expirado y calcula el descuento.

**Comandos y buenas prácticas:**

- `COALESCE`: Evita errores con NULL en sumas.
- `LEAST`: Limita descuentos fijos al valor real.
- `json_build_object`, `json_agg`, `json_array_elements`: Construcción de respuestas JSON.
- `RAISE EXCEPTION`: Lanza errores personalizados.
- `CASE ... WHEN ... THEN ... END`: Lógica condicional en SQL.

---

#### fun_limpiar_carrito_pagado.sql

**Propósito:**
Función TRIGGER que limpia automáticamente el carrito del usuario cuando una orden cambia a estado PAGADA (`ind_estado = 2`).

**Parámetros:**

- Ninguno (función TRIGGER, usa `NEW` y `OLD`).

**Retorna:**

- `NULL` (estándar para triggers AFTER).

**Lógica paso a paso:**

1. Verifica que el cambio sea específicamente a estado PAGADA.
2. Busca todos los carritos del usuario de la orden.
3. Elimina todos los productos de esos carritos.
4. Actualiza la fecha de modificación del carrito.
5. Si el usuario no tenía carritos, crea uno vacío para futuras compras.
6. Registra logs con `RAISE NOTICE` para auditoría y depuración.

**Comandos y buenas prácticas:**

- `RAISE NOTICE`: Mensajes informativos para logs (no afectan la ejecución, pero ayudan a depurar).
- `EXCEPTION ... WHEN OTHERS THEN ...`: Captura cualquier error y lanza un mensaje personalizado.
- `FOR ... IN ... LOOP`: Itera sobre todos los carritos del usuario.
- `DELETE FROM ...`: Elimina todos los productos del carrito.
- `UPDATE ... SET ...`: Actualiza la fecha de modificación.
- `INSERT INTO ...`: Crea un carrito vacío si no existía.

**Beneficios:**

- Evita que el usuario modifique el carrito después de pagar.
- Previene duplicidad de productos y confusión post-pago.
- Mantiene la experiencia limpia para futuras compras.

---

#### fun_obtener_carrito_detalle.sql

**Propósito:**
Obtiene el detalle completo del carrito de un usuario en formato JSON, incluyendo productos, cantidades, precios, stock y metadatos del carrito. Soporta tanto usuarios registrados como anónimos.

**Parámetros:**

- `p_id_usuario`: ID del usuario registrado (opcional).
- `p_session_id`: ID de sesión para usuarios anónimos (opcional).

**Retorna:**
Un JSON con:

- `id_carrito`: ID del carrito.
- `total_productos`: Número de productos en el carrito.
- `subtotal_carrito`: Suma total de los productos (sin descuentos).
- `productos`: Array con detalles de cada producto (ID, nombre, cantidad, precio, subtotal, stock, imagen).

**Lógica paso a paso:**

1. Llama a `fun_obtener_carrito_usuario` para obtener el ID del carrito (crea uno nuevo si no existe).
2. Hace un JOIN entre `tab_carrito_productos` y `tab_productos` para obtener información actualizada de cada producto.
3. Usa `json_build_object` y `json_agg` para construir la respuesta en formato JSON.
4. Usa `COALESCE` para evitar valores NULL en conteos y sumas.

**Comandos y buenas prácticas:**

- `json_build_object`: Construye objetos JSON clave-valor.
- `json_agg`: Agrega varios objetos JSON en un array.
- `COALESCE`: Evita NULL en sumas y conteos.
- `ORDER BY cp.fec_insert DESC`: Ordena los productos por fecha de agregado al carrito.

---

#### fun_obtener_carrito_usuario.sql

**Propósito:**
Obtiene el carrito existente de un usuario o crea uno nuevo si no existe. Maneja tanto usuarios registrados como anónimos mediante `session_id`.

**Parámetros:**

- `p_id_usuario`: ID del usuario registrado (opcional).
- `p_session_id`: ID de sesión para usuarios anónimos (opcional).

**Retorna:**

- `INTEGER`: ID del carrito (existente o recién creado).

**Lógica paso a paso:**

1. Valida que al menos uno de los parámetros no sea NULL. Si ambos son NULL, lanza un error con `RAISE EXCEPTION`.
2. Determina el usuario para auditoría (`v_usr_insert`).
3. Si es usuario registrado, busca el carrito por ID de usuario, ordenando por fecha de actualización.
4. Si es usuario anónimo, busca el carrito por `session_id`.
5. Si no existe carrito, crea uno nuevo con los datos proporcionados.
6. Retorna el ID del carrito encontrado o creado.

**Comandos y buenas prácticas:**

- `RAISE EXCEPTION`: Lanza error si los parámetros son inválidos.
- `ORDER BY ... LIMIT 1`: Obtiene el carrito más reciente.
- `INSERT INTO ... RETURNING`: Crea un nuevo carrito y retorna su ID.

---

### tab_metodos_pago_usuario

#### fun_actualizar_metodo_pago_default.sql

**Propósito:**
Establece un método de pago como predeterminado para un usuario, quitando la marca de predeterminado de cualquier otro método.

**Parámetros:**

- `p_id_usuario`: ID del usuario (obligatorio).
- `p_id_metodo_pago`: ID del método de pago a marcar como predeterminado (obligatorio).
- `p_usr_operacion`: Usuario que realiza la operación (para auditoría).

**Retorna:**

- JSON con el resultado de la operación (`success`, `message`).

**Lógica paso a paso:**

1. Quita la marca `is_default` de todos los métodos de pago del usuario.
2. Establece la marca `is_default` en el método seleccionado.
3. Valida que el método pertenezca al usuario.
4. Usa `GET DIAGNOSTICS ... = ROW_COUNT` para saber cuántas filas se actualizaron.
5. Devuelve un JSON indicando éxito o error.

**Comandos y buenas prácticas:**

- `UPDATE ... SET ... WHERE ...`: Actualiza registros.
- `GET DIAGNOSTICS ... = ROW_COUNT`: Obtiene el número de filas afectadas por la última operación DML.
- `EXCEPTION ... WHEN OTHERS THEN ...`: Captura cualquier error y devuelve un mensaje personalizado.

---

#### fun_agregar_metodo_pago.sql

**Propósito:**
Agrega un nuevo método de pago (tarjeta tokenizada) a un usuario. Guarda tarjetas para futuras compras.

**Parámetros:**

- `p_id_usuario`: ID del usuario (obligatorio).
- `p_provider_name`: Nombre del proveedor de pago (ej. 'wompi').
- `p_provider_source_id`: ID de la fuente de pago en el proveedor (token).
- `p_brand`: Marca de la tarjeta.
- `p_last_four_digits`: Últimos 4 dígitos de la tarjeta.
- `p_expiration_month`: Mes de expiración.
- `p_expiration_year`: Año de expiración.
- `p_card_holder`: Titular de la tarjeta.
- `p_usr_operacion`: Usuario que realiza la operación (para auditoría).

**Retorna:**

- JSON con el resultado de la operación y los datos del método agregado.

**Lógica paso a paso:**

1. Valida que los parámetros obligatorios no sean NULL.
2. Inserta el nuevo método de pago, usando `ON CONFLICT ... DO NOTHING` para evitar duplicados.
3. Si ya existe, devuelve un mensaje de error.
4. Si se inserta, devuelve los datos del método agregado en JSON.

**Comandos y buenas prácticas:**

- `ON CONFLICT (id_usuario, provider_source_id, provider_name) DO NOTHING`: Evita duplicados.
- `INSERT INTO ... RETURNING`: Inserta y retorna el ID generado.
- `EXCEPTION ... WHEN OTHERS THEN ...`: Captura cualquier error y devuelve un mensaje personalizado.

---

#### fun_listar_metodos_pago.sql

**Propósito:**
Lista todos los métodos de pago guardados por un usuario.

**Parámetros:**

- `p_id_usuario`: ID del usuario (obligatorio).

**Retorna:**

- Tabla con los detalles de los métodos de pago (ID, proveedor, marca, últimos dígitos, expiración, si es predeterminado).

**Lógica paso a paso:**

1. Busca todos los métodos de pago asociados al usuario.
2. Ordena los resultados para mostrar el método por defecto primero.

**Comandos y buenas prácticas:**

- `ORDER BY is_default DESC, fec_insert DESC`: Prioriza el método predeterminado y los más recientes.
- `RETURNS TABLE (...)`: Devuelve una tabla estructurada.

---

#### fun_eliminar_metodo_pago.sql

**Propósito:**
Elimina un método de pago guardado por un usuario.

**Parámetros:**

- `p_id_usuario`: ID del usuario (obligatorio).
- `p_id_metodo_pago`: ID del método de pago a eliminar (obligatorio).

**Retorna:**

- JSON con el resultado de la operación (`success`, `message`).

**Lógica paso a paso:**

1. Valida que los parámetros no sean nulos.
2. Elimina el método de pago si coincide el ID y pertenece al usuario.
3. Usa `GET DIAGNOSTICS ... = ROW_COUNT` para saber cuántas filas se eliminaron.
4. Devuelve un JSON indicando éxito o error.

**Comandos y buenas prácticas:**

- `DELETE FROM ... WHERE ...`: Elimina registros.
- `GET DIAGNOSTICS ... = ROW_COUNT`: Obtiene el número de filas afectadas.
- `EXCEPTION ... WHEN OTHERS THEN ...`: Captura cualquier error y devuelve un mensaje personalizado.

---

**¡Ahora sigue la documentación de cada carpeta de funciones!**

### tab_ordenes

#### fun_crear_orden_desde_carrito.sql

**Propósito:**
Convierte el carrito del usuario en una orden de compra definitiva, aplicando descuentos automáticos, códigos y canjes de puntos según corresponda. Trabaja directamente con el carrito especificado.

**Parámetros:**

- `p_id_carrito`: ID del carrito a convertir en orden.
- `p_id_direccion`: ID de la dirección de entrega.
- `p_codigo_descuento`: Código de descuento a aplicar (opcional).
- `p_observaciones`: Observaciones adicionales de la orden (opcional).
- `p_usr_operacion`: Usuario que realiza la operación.
- `p_id_canje`: ID del canje de puntos a aplicar (opcional).

**Retorna:**

- JSON con: `success`, `message`, `id_orden`, `total_productos`, `total_descuentos`, `total_final`, `descuentos_aplicados`.

**Lógica paso a paso:**

1. Valida que el carrito existe y obtiene información del usuario.
2. Valida la dirección de entrega (solo para usuarios registrados).
3. Verifica stock disponible de todos los productos.
4. Calcula descuentos automáticos, código de descuento y canje de puntos.
5. Crea la orden principal (estado 'pendiente').
6. Transfiere productos del carrito a la orden.
7. Marca el canje como utilizado (si aplica).
8. Limpia el carrito después de crear la orden.

**Comandos y buenas prácticas:**

- `LEAST`: Limita descuentos fijos al valor real.
- `COALESCE`: Evita NULL en sumas y conteos.
- `CASE ... WHEN ... THEN ... END`: Lógica condicional para aplicar descuentos.
- `json_build_object`, `json_agg`, `json_array_elements`: Construcción de respuestas JSON.
- `EXCEPTION ... WHEN OTHERS THEN ...`: Captura cualquier error y devuelve un mensaje personalizado.
- `STORED PROCEDURE` (comentario): Indica que la función implementa lógica de negocio compleja y persistente, aunque en PostgreSQL se usa `FUNCTION`.

---

#### fun_marcar_orden_completada.sql

**Propósito:**
Marca una orden como completada cuando la empresa de envíos confirma la entrega. Solo cambia el estado y ejecuta triggers mínimos necesarios.

**Parámetros:**

- `p_id_orden`: ID de la orden a marcar como completada.
- `p_observaciones`: Observaciones de la confirmación (opcional).
- `p_usr_operacion`: Usuario que confirma la entrega.

**Retorna:**

- JSON con: `success`, `message`, `id_orden`, `estado_anterior`, `estado_actual`, información de la orden y nota sobre procesos críticos.

**Lógica paso a paso:**

1. Valida que la orden existe y está en estado pagada (2).
2. Verifica que no esté ya completada.
3. Marca la orden como completada (estado 3).
4. Los triggers mínimos se ejecutan automáticamente.

**Comandos y buenas prácticas:**

- `COALESCE`: Usa el valor nuevo si se proporciona, o mantiene el anterior.
- `EXCEPTION ... WHEN OTHERS THEN ...`: Captura cualquier error y devuelve un mensaje personalizado.

---

#### fun_obtener_ordenes_usuario.sql

**Propósito:**
Obtiene el historial de órdenes de un usuario específico con información detallada, incluyendo estados, métodos de pago, descuentos y cantidad de productos.

**Parámetros:**

- `p_id_usuario`: ID del usuario (obligatorio).
- `p_limite`: Límite de registros a retornar (opcional, por defecto 10).

**Retorna:**

- Tabla con: `id_orden`, `fecha_pedido`, `total_productos`, `total_descuentos`, `total_pedido`, `estado_orden`, `metodo_pago`, `cantidad_productos`, `descuentos_aplicados`.

**Lógica paso a paso:**

1. Consulta órdenes del usuario específico.
2. Convierte códigos de estado e indicadores a texto legible usando `CASE`.
3. Cuenta productos por orden.
4. Incluye información de descuentos aplicados.
5. Ordena por fecha descendente (más recientes primero).
6. Limita resultados según parámetro.

**Comandos y buenas prácticas:**

- `COALESCE`: Compatibilidad con datos legacy y evita NULL.
- `CASE`: Traduce códigos de estado a texto.
- `ORDER BY ... LIMIT ...`: Ordena y limita resultados.
- `RETURNS TABLE (...)`: Devuelve una tabla estructurada.

---

### tab_productos

#### fun_actualizar_stock_automatico.sql

**Propósito:**
Función TRIGGER que reduce automáticamente el stock de productos cuando una orden es marcada como PAGADA. Procesa todos los productos de la orden y reduce su stock, registrando movimientos de inventario.

**Parámetros:**

- Ninguno (función TRIGGER, usa `NEW` y `OLD`).

**Retorna:**

- `NULL` (estándar para triggers AFTER).

**Lógica paso a paso:**

1. Solo se ejecuta cuando la orden cambia a estado PAGADA (`ind_estado = 2`).
2. Procesa cada producto de la orden pagada.
3. Valida que el producto existe y que hay stock suficiente.
4. Actualiza el stock del producto.
5. Registra el movimiento en `tab_movimientos_inventario`.
6. Usa `RAISE NOTICE` para logs y auditoría.

**Comandos y buenas prácticas:**

- `COALESCE`: Usa un valor por defecto si `usr_update` es NULL.
- `RAISE EXCEPTION`: Lanza error si hay problemas de stock o producto inexistente.
- `FOR ... IN ... LOOP`: Itera sobre todos los productos de la orden.
- `EXCEPTION ... WHEN OTHERS THEN ...`: Captura cualquier error y hace rollback automático.

---

#### fun_insert_producto.sql

**Propósito:**
Inserta un nuevo producto en el catálogo del sistema con todas las validaciones necesarias y generación automática de ID secuencial.

**Parámetros:**

- IDs de categoría, línea, sublínea, proveedor, marca.
- Nombre, especificaciones (JSON), imagen, precio, stock inicial, usuario operación.

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica paso a paso:**

1. Valida todos los campos obligatorios.
2. Verifica que el producto no exista previamente (nombre único por categoría/línea/sublínea).
3. Genera el ID secuencial automáticamente usando `COALESCE(MAX(id_producto), 0) + 1`.
4. Inserta el producto en la base de datos.
5. Confirma éxito de la operación.

**Comandos y buenas prácticas:**

- `COALESCE`: Genera el siguiente ID secuencial.
- `RAISE NOTICE`: Mensajes informativos para logs.
- Validaciones estrictas para evitar datos inconsistentes.

---

#### fun_restaurar_stock_cancelacion.sql

**Propósito:**
Función TRIGGER que restaura automáticamente el stock de productos cuando una orden cambia a estado cancelado (`ind_estado = 4`).

**Parámetros:**

- Ninguno (función TRIGGER, usa `NEW` y `OLD`).

**Retorna:**

- `NULL` (estándar para triggers AFTER).

**Lógica paso a paso:**

1. Solo procesa si el cambio es específicamente a cancelado.
2. Obtiene todos los productos de la orden cancelada.
3. Para cada producto: restaura stock y registra movimiento de inventario (`devolucion_usuario`).
4. Usa `RAISE NOTICE` para logs y auditoría.

**Comandos y buenas prácticas:**

- `RAISE NOTICE`: Mensajes informativos para logs.
- `EXCEPTION ... WHEN OTHERS THEN ...`: Captura cualquier error y hace rollback automático.

---

#### fun_deactivate_producto.sql

**Propósito:**
Desactiva un producto del catálogo mediante eliminación lógica (no borra físicamente, solo cambia su estado a inactivo).

**Parámetros:**

- IDs de categoría, línea, sublínea, producto.
- Usuario que realiza la operación (auditoría).

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica paso a paso:**

1. Valida el ID de usuario operación.
2. Busca el producto activo con los IDs proporcionados.
3. Cambia el estado a inactivo (`ind_activo = FALSE`).
4. Actualiza el timestamp de modificación.
5. Desactiva comentarios asociados al producto.
6. Usa `GET DIAGNOSTICS ... = ROW_COUNT` para saber cuántos registros se actualizaron.
7. Usa `RAISE NOTICE` para logs.

**Comandos y buenas prácticas:**

- `GET DIAGNOSTICS ... = ROW_COUNT`: Obtiene el número de filas afectadas.
- `EXCEPTION ... WHEN OTHERS THEN ...`: Captura cualquier error inesperado.

---

#### fun_update_producto.sql

**Propósito:**
Actualiza la información de un producto existente en el catálogo con validaciones completas de todos los campos modificables.

**Parámetros:**

- IDs de categoría, línea, sublínea, producto.
- Nuevos datos: nombre, especificaciones (JSON), imagen, precio, proveedor, marca, stock, estado activo, usuario operación.

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica paso a paso:**

1. Valida identificadores y nuevos datos del producto.
2. Actualiza el registro existente.
3. Usa `RAISE NOTICE` para logs.
4. Confirma éxito de la operación.

**Comandos y buenas prácticas:**

- Validaciones estrictas para evitar datos inconsistentes.
- `RAISE NOTICE`: Mensajes informativos para logs.

---

### tab_puntos_usuario

#### fun_obtener_historial_puntos.sql

**Propósito:**
Obtiene el historial completo de movimientos de puntos de un usuario, incluyendo acumulaciones, canjes y detalles de descuentos aplicados. Retorna un objeto JSON con el resultado.

**Parámetros:**

- `p_id_usuario`: ID del usuario (obligatorio).

**Retorna:**

- JSON con: `success`, `id_usuario`, `historial` (array de movimientos con detalles).

**Lógica paso a paso:**

1. Consulta movimientos de puntos del usuario específico.
2. Construye un array JSON con los resultados, usando `json_agg` y `json_build_object`.
3. Traduce el tipo de movimiento a texto legible usando `CASE`.
4. Enlaza nombre de descuento si aplica (LEFT JOIN).
5. Envuélvelo todo en un objeto JSON de respuesta.

**Comandos y buenas prácticas:**

- `json_agg`, `json_build_object`: Construcción de respuestas JSON.
- `CASE`: Traduce códigos a texto.
- `COALESCE`: Evita NULL en arrays.
- `EXCEPTION ... WHEN OTHERS THEN ...`: Captura cualquier error y devuelve un mensaje personalizado.

---

#### fun_obtener_resumen_puntos_usuario.sql

**Propósito:**
Obtiene un resumen completo del estado de puntos de un usuario específico, incluyendo saldos, configuración y canjes disponibles.

**Parámetros:**

- `p_id_usuario`: ID del usuario (obligatorio).

**Retorna:**

- JSON con: información básica del usuario, puntos, fechas, canjes disponibles, configuración.

**Lógica paso a paso:**

1. Obtiene información de puntos del usuario (JOIN con usuarios para nombre).
2. Si no existe registro, lo crea automáticamente.
3. Cuenta canjes disponibles (no utilizados y no vencidos).
4. Obtiene configuración actual de puntos (`pesos_por_punto`).
5. Construye respuesta JSON estructurada.

**Comandos y buenas prácticas:**

- `ON CONFLICT ... DO NOTHING`: Evita duplicados al crear registro.
- `COALESCE`: Evita NULL en valores.
- `json_build_object`: Construcción de respuestas JSON.

---

#### fun_acumular_puntos_por_compra.sql

**Propósito:**
Acumula puntos automáticamente cuando un usuario realiza una compra. Se ejecuta automáticamente vía trigger cuando una orden cambia a estado PAGADA.

**Parámetros:**

- `p_id_usuario`: ID del usuario que realizó la compra (obligatorio).
- `p_id_orden`: ID de la orden que genera los puntos (obligatorio).
- `p_val_total_pedido`: Valor ANTES de descuentos para calcular puntos (obligatorio).
- `p_usr_operacion`: Usuario que realiza la operación para auditoría (obligatorio).

**Retorna:**

- JSON con: `success`, `message`, `puntos_acumulados`, `saldo_anterior`, `saldo_nuevo`.

**Lógica paso a paso:**

1. Valida parámetros de entrada.
2. Calcula puntos usando configuración activa (`fun_calcular_puntos_por_compra`).
3. Crea o verifica registro de puntos del usuario.
4. Actualiza saldo de puntos del usuario.
5. Registra movimiento en historial de puntos.
6. Retorna resultado de la operación.

**Comandos y buenas prácticas:**

- `EXISTS`: Verifica que la orden no haya acumulado puntos previamente.
- `COALESCE`: Evita NULL en saldos.
- `EXCEPTION ... WHEN OTHERS THEN ...`: Captura cualquier error y devuelve un mensaje personalizado.

---

#### fun_calcular_puntos_por_compra.sql

**Propósito:**
Calcula la cantidad de puntos que debe recibir un usuario basado en el valor total de su compra y la configuración activa de puntos.

**Parámetros:**

- `p_valor_compra`: Valor total de la compra realizada.

**Retorna:**

- `INTEGER`: Cantidad de puntos ganados (número entero).

**Lógica paso a paso:**

1. Obtiene configuración activa de puntos de la empresa (`pesos_por_punto`).
2. Aplica fórmula: puntos = FLOOR(valor_compra / pesos_por_punto).
3. Retorna cantidad de puntos (división entera, sin decimales).

**Comandos y buenas prácticas:**

- `FLOOR`: Redondea hacia abajo para obtener solo puntos completos.
- `EXCEPTION ... WHEN OTHERS THEN ...`: Lanza error si no hay configuración activa.

---

### tab_usuarios

#### fun_update_usuarios.sql

**Propósito:**
Actualiza la información de un usuario existente en el sistema con validaciones completas de todos los campos modificables.

**Parámetros:**

- `wid_usuario`: ID del usuario a actualizar (obligatorio, > 0).
- `wnom_usuario`: Nuevo nombre del usuario (obligatorio, mínimo 3 caracteres).
- `wape_usuario`: Nuevo apellido del usuario (obligatorio, mínimo 3 caracteres).
- `wemail_usuario`: Nuevo email del usuario (obligatorio, mínimo 3 caracteres).
- `wpassword_usuario`: Nueva contraseña (obligatorio, no vacío).
- `wind_genero`: Nuevo indicador de género (obligatorio).
- `wcel_usuario`: Nuevo número de celular (obligatorio, mínimo 3 caracteres).
- `wfec_nacimiento`: Nueva fecha de nacimiento (obligatorio).
- `wusr_operacion`: ID del usuario que realiza la operación (obligatorio, > 0).

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica paso a paso:**

1. Valida existencia del usuario por ID y todos los campos obligatorios.
2. Actualiza registro con nueva información y timestamp de modificación.
3. Usa `FOUND` para verificar si la actualización fue exitosa.
4. Usa `RAISE NOTICE` para logs.

**Comandos y buenas prácticas:**

- `FOUND`: Indica si la última operación DML afectó alguna fila.
- `RAISE NOTICE`: Mensajes informativos para logs.

---

#### fun_update_password.sql

**Propósito:**
Actualiza la contraseña de un usuario si existe y está activo.

**Parámetros:**

- `p_id_usuario`: ID del usuario.
- `p_nueva_password`: Nueva contraseña.
- `p_usr_operacion`: Usuario que realiza la operación.

**Retorna:**

- `BOOLEAN`: `TRUE` si se actualizó, `FALSE` si no.

**Lógica paso a paso:**

1. Actualiza la contraseña solo si el usuario existe y está activo.
2. Usa `FOUND` para verificar si la actualización fue exitosa.

---

#### fun_insert_usuarios.sql

**Propósito:**
Inserta un nuevo usuario en el sistema con validaciones completas de todos los campos requeridos.

**Parámetros:**

- `wid_usuario`: Identificación única del usuario (cédula, pasaporte, etc.).
- `wnom_usuario`: Nombre del usuario (mínimo 3 caracteres).
- `wape_usuario`: Apellido del usuario (mínimo 3 caracteres).
- `wemail_usuario`: Correo electrónico del usuario.
- `wpassword_usuario`: Contraseña del usuario (mínimo 3 caracteres).
- `wind_genero`: Indicador de género (boolean: true/false).
- `wcel_usuario`: Número de celular (mínimo 3 caracteres).
- `wfec_nacimiento`: Fecha de nacimiento.
- `usr_insert`: Usuario que realiza la inserción.

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica paso a paso:**

1. Valida todos los campos obligatorios y sus restricciones.
2. Inserta el nuevo usuario en la base de datos.
3. Usa `FOUND` para verificar si la inserción fue exitosa.
4. Usa `RAISE NOTICE` para logs.

---

#### fun_deactivate_usuarios.sql

**Propósito:**
Desactiva un usuario del sistema mediante eliminación lógica (no borra físicamente, solo cambia su estado a inactivo).

**Parámetros:**

- `wid_usuario`: ID del usuario a desactivar (obligatorio).
- `wusr_operacion`: ID del usuario que realiza la operación (obligatorio).

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica paso a paso:**

1. Valida el ID de usuario operación.
2. Cambia el estado del usuario a inactivo (`ind_activo = FALSE`).
3. Actualiza el timestamp de modificación.
4. Usa `FOUND` para verificar si la desactivación fue exitosa.
5. Usa `RAISE NOTICE` para logs.
6. Maneja errores inesperados con `EXCEPTION ... WHEN OTHERS THEN ...` y `ROLLBACK`.

---

### tab_pagos

#### fun_marcar_orden_pagada.sql

**Propósito:**
Función centralizada para marcar una orden como pagada y ejecutar todas las operaciones necesarias de sincronización. Trabaja con cualquier método de pago (MercadoPago, transferencia, efectivo, etc.).

**Parámetros:**

- `p_id_orden`: ID de la orden a marcar como pagada.
- `p_metodo_pago`: Método de pago utilizado.
- `p_referencia_pago`: Referencia del pago (ID transacción, comprobante, etc.).
- `p_monto_pagado`: Monto efectivamente pagado.
- `p_usr_operacion`: Usuario que registra el pago.
- `p_observaciones`: Observaciones del pago (opcional).

**Retorna:**

- JSON con: `success`, `message`, `id_orden`, `estado_anterior`, `estado_actual`, `procesos_ejecutados` (array de detalles).

**Lógica paso a paso:**

1. Valida que la orden existe y está en estado válido.
2. Verifica que el monto pagado coincida con el total de la orden (tolerancia de 1 centavo).
3. Marca la orden como pagada (estado 2) usando función centralizada.
4. Registra información del pago (gestionado por el sistema de pagos).
5. Procesa descuentos usados automáticamente.
6. Activa acumulación de puntos.
7. Actualiza estadísticas de ventas (por trigger).
8. Devuelve resultado detallado en JSON.

**Comandos y buenas prácticas:**

- `ABS`: Calcula diferencia absoluta de montos.
- `COALESCE`: Usa valores por defecto si son NULL.
- `array_to_json`: Convierte arrays a JSON.
- `EXCEPTION ... WHEN OTHERS THEN ...`: Captura cualquier error y devuelve un mensaje personalizado.

---

#### fun_crear_pago.sql

**Propósito:**
Crea un registro inicial para una transacción de pago. Guarda la referencia a la orden y los datos iniciales del proveedor.

**Parámetros:**

- `p_id_orden`: ID de la orden (obligatorio).
- `p_provider_name`: Nombre del proveedor (ej. 'mercadopago').
- `p_provider_transaction_id`: ID de la transacción en el proveedor.
- `p_amount`: Monto total de la transacción.
- `p_status`: Estado inicial del pago (generalmente 'pending').
- `p_usr_operacion`: ID del usuario que inicia la operación.

**Retorna:**

- JSON con el resultado de la operación, incluyendo el ID del pago creado.

**Lógica paso a paso:**

1. Valida que el ID de la orden y el monto sean válidos.
2. Inserta el registro en `tab_pagos`.
3. Usa `RETURNING` para obtener el ID generado.
4. Maneja errores de clave foránea y otros con `EXCEPTION`.

**Comandos y buenas prácticas:**

- `EXCEPTION ... WHEN foreign_key_violation THEN ...`: Maneja errores de integridad referencial.
- `EXCEPTION ... WHEN OTHERS THEN ...`: Captura cualquier error inesperado.

---

#### fun_actualizar_pago.sql

**Propósito:**
Actualiza un registro de pago existente. Se usa típicamente al recibir una notificación (webhook) del proveedor de pagos.

**Parámetros:**

- `p_provider_transaction_id`: ID de la transacción en el proveedor (obligatorio).
- `p_status`: Nuevo estado del pago (approved, rejected, etc.).
- `p_status_detail`: Detalle del nuevo estado.
- `p_payment_method_type`: Método de pago usado (visa, master, etc.).
- `p_payment_method_extra`: Información extra del método de pago (JSONB).
- `p_fee_amount`: Comisión del proveedor.
- `p_net_received_amount`: Monto neto recibido.
- `p_provider_date_approved`: Fecha de aprobación del proveedor.
- `p_raw_response`: Respuesta JSON completa del proveedor (para auditoría).
- `p_usr_operacion`: ID del usuario que procesa la actualización.

**Retorna:**

- JSON con el resultado de la operación.

**Lógica paso a paso:**

1. Valida que el ID de la transacción sea válido.
2. Actualiza el registro de pago con los nuevos datos.
3. Usa `GET DIAGNOSTICS ... = ROW_COUNT` para saber si se actualizó algún registro.
4. Devuelve un JSON indicando éxito o error.

**Comandos y buenas prácticas:**

- `GET DIAGNOSTICS ... = ROW_COUNT`: Obtiene el número de filas afectadas.
- `EXCEPTION ... WHEN OTHERS THEN ...`: Captura cualquier error inesperado.

---

#### fun_obtener_pago.sql

**Propósito:**
Obtiene la información de un pago a partir del ID de la orden.

**Parámetros:**

- `p_id_orden`: ID de la orden en nuestro sistema.

**Retorna:**

- JSON con los detalles del pago o un mensaje de error.

**Lógica paso a paso:**

1. Valida que el ID de la orden no sea NULL.
2. Busca el pago asociado a la orden (el más reciente).
3. Usa `row_to_json` para devolver todos los campos del pago en formato JSON.
4. Devuelve un JSON indicando éxito o error.

**Comandos y buenas prácticas:**

- `row_to_json`: Convierte un registro completo a JSON.
- `EXCEPTION ... WHEN OTHERS THEN ...`: Captura cualquier error inesperado.

---

## Carpeta: tab_comentarios

### Función: fun_deactivate_comentarios

**Propósito:**
Desactiva lógicamente (no elimina físicamente) un comentario específico realizado sobre un producto. Esto permite mantener el historial de comentarios, pero ocultando aquellos que ya no deben estar activos.

**Parámetros:**

- `wid_categoria`: ID de la categoría del producto.
- `wid_linea`: ID de la línea del producto.
- `wid_sublinea`: ID de la sublínea del producto.
- `wid_producto`: ID del producto.
- `wid_usuario`: ID del usuario que hizo el comentario.
- `wid_comentario`: ID del comentario a desactivar.
- `wusr_operacion`: Usuario que realiza la operación (para auditoría).

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica y validaciones:**

1. **Validación de usuario de operación:**
   - Si el usuario que realiza la operación no está definido o es <= 0, retorna un error. Esto es fundamental para auditoría y trazabilidad.
2. **Validación de IDs:**
   - Se valida que todos los IDs (categoría, línea, sublínea, producto, usuario, comentario) sean mayores a 0 y no nulos. Si alguno falla, retorna un mensaje de error específico.
3. **Desactivación lógica:**
   - Se actualiza el registro en `tab_comentarios` poniendo `ind_activo = FALSE`, actualizando el usuario y la fecha de modificación.
   - Solo se afecta el comentario si está actualmente activo (`ind_activo = TRUE`).
4. **Verificación de éxito:**
   - Se utiliza el comando especial `FOUND` para saber si la actualización afectó alguna fila. Si es así, se lanza un aviso con `RAISE NOTICE` y se retorna éxito. Si no, se retorna un error indicando que no se encontró el comentario activo.
5. **Manejo de errores:**
   - Si ocurre cualquier otro error inesperado, se captura con `WHEN OTHERS` y se retorna el mensaje de error concatenando el texto de `SQLERRM`.

**Comandos especiales explicados:**

- `FOUND`: Variable especial de PL/pgSQL que indica si la última operación DML (UPDATE, INSERT, DELETE) afectó al menos una fila.
- `RAISE NOTICE`: Permite mostrar mensajes informativos en la consola/log, útil para depuración y auditoría.
- `WHEN OTHERS`: Captura cualquier excepción no manejada previamente.
- `SQLERRM`: Devuelve el mensaje de error de la última excepción.

**Buenas prácticas:**

- Uso de desactivación lógica en vez de borrado físico para mantener trazabilidad.
- Validaciones exhaustivas de parámetros para evitar operaciones inconsistentes.
- Auditoría de usuario y fecha de modificación.

---

### Función: fun_insert_comentarios

**Propósito:**
Inserta un nuevo comentario sobre un producto específico, asociando el comentario a un usuario y generando un ID secuencial para el comentario dentro de la tabla.

**Parámetros:**

- `wid_categoria`: ID de la categoría del producto (obligatorio, > 0).
- `wid_linea`: ID de la línea del producto (obligatorio, > 0).
- `wid_sublinea`: ID de la sublínea del producto (obligatorio, > 0).
- `wid_producto`: ID del producto (obligatorio, > 0).
- `wid_usuario`: ID del usuario que comenta (obligatorio, > 0).
- `wcomentario`: Texto del comentario (obligatorio, mínimo 3 caracteres).
- `wusr_operacion`: ID del usuario que realiza la operación (auditoría).

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica y validaciones:**

1. **Validación de parámetros:**
   - Se valida que todos los IDs sean mayores a 0 y no nulos.
   - El comentario debe tener al menos 3 caracteres.
2. **Inserción:**
   - Se inserta el comentario en la tabla `tab_comentarios`, generando el `id_comentario` como el máximo actual + 1 (uso de `COALESCE(MAX(id_comentario),0) + 1`).
   - Se registra el usuario que realiza la operación para auditoría.
3. **Verificación de éxito:**
   - Se utiliza `FOUND` para verificar si la inserción fue exitosa. Si es así, se lanza un aviso con `RAISE NOTICE` y se retorna éxito. Si no, se retorna un error genérico.
4. **Manejo de errores:**
   - Se capturan errores de integridad referencial (`foreign_key_violation`), de unicidad (`unique_violation`) y cualquier otro error inesperado (`WHEN OTHERS`).

**Comandos especiales explicados:**

- `COALESCE`: Devuelve el primer valor no nulo de la lista. Aquí se usa para asegurar que si no hay comentarios previos, el ID inicie en 1.
- `FOUND`: Indica si la última operación DML afectó filas.
- `RAISE NOTICE`: Muestra mensajes informativos en consola/log.
- `WHEN foreign_key_violation`: Captura errores cuando se intenta insertar un comentario para un producto o usuario inexistente.
- `WHEN unique_violation`: Captura errores cuando ya existe un comentario con ese ID para ese producto.
- `WHEN OTHERS` y `SQLERRM`: Captura y muestra cualquier otro error inesperado.

**Buenas prácticas:**

- Validaciones exhaustivas para evitar datos inconsistentes.
- Generación de IDs secuenciales de forma segura.
- Manejo explícito de errores para facilitar el diagnóstico.
- Auditoría de usuario que realiza la operación.

---

## Carpeta: tab_config_puntos_empresa

### Función: fun_actualizar_config_puntos_empresa

**Propósito:**
Actualiza la configuración activa del sistema de puntos de la empresa, permitiendo modificar la relación pesos-punto y su descripción. Es fundamental para ajustar la política de acumulación de puntos según necesidades del negocio.

**Parámetros:**

- `p_id_config_puntos`: ID de la configuración a actualizar (obligatorio, > 0).
- `p_nuevo_pesos_por_punto`: Nuevo valor en pesos por punto (obligatorio, > 0).
- `p_descripcion`: Nueva descripción de la configuración (opcional).
- `p_usr_operacion`: Usuario que realiza la operación (obligatorio, para auditoría).

**Retorna:**

- `JSON`: Objeto con el resultado de la operación, incluyendo:
  - `success`: Booleano indicando éxito.
  - `message`: Mensaje descriptivo.
  - `nuevo_valor`: Valor actualizado (si aplica).
  - `descripcion_actualizada`: Descripción final aplicada.

**Lógica y validaciones:**

1. **Validación de parámetros:**
   - Se valida que el ID de configuración y el valor de pesos por punto sean mayores a 0 y no nulos.
   - El usuario de operación debe ser válido (> 0).
2. **Verificación de existencia:**
   - Se verifica que exista una configuración activa con el ID especificado. Si no existe, retorna un mensaje de error y una sugerencia para crear una nueva configuración.
3. **Actualización:**
   - Se actualiza la configuración con el nuevo valor de pesos por punto y la descripción (si no se proporciona, se genera automáticamente usando `COALESCE`).
   - Se actualizan los campos de usuario y fecha de modificación.
4. **Verificación de éxito:**
   - Si la actualización no afecta ninguna fila (`NOT FOUND`), retorna un error.
   - Si es exitosa, retorna un JSON con los datos actualizados.
5. **Manejo de errores:**
   - Cualquier error inesperado se captura con `WHEN OTHERS` y se retorna el mensaje de error usando `SQLERRM`.

**Comandos especiales explicados:**

- `json_build_object`: Construye un objeto JSON en PostgreSQL, útil para respuestas estructuradas.
- `COALESCE`: Devuelve el primer valor no nulo, usado para asignar una descripción por defecto si no se proporciona.
- `FOUND`/`NOT FOUND`: Indica si la última operación DML afectó filas.
- `WHEN OTHERS` y `SQLERRM`: Captura y muestra cualquier error inesperado.

**Buenas prácticas:**

- Validaciones exhaustivas para evitar inconsistencias.
- Respuestas estructuradas en JSON para facilitar integración con aplicaciones.
- Auditoría de usuario y fecha de modificación.

---

### Función: fun_crear_config_puntos_empresa

**Propósito:**
Crea la configuración inicial del sistema de puntos de la empresa. Debe ejecutarse al configurar el sistema por primera vez, asegurando que solo exista una configuración activa a la vez.

**Parámetros:**

- `p_pesos_por_punto`: Valor en pesos por punto (obligatorio, > 0).
- `p_descripcion`: Descripción de la configuración (opcional).
- `p_usr_operacion`: Usuario que realiza la operación (obligatorio, para auditoría).

**Retorna:**

- `JSON`: Objeto con el resultado de la operación, incluyendo:
  - `success`: Booleano indicando éxito.
  - `message`: Mensaje descriptivo.
  - `config_id`: ID de la configuración creada.
  - `valor_configurado`: Valor configurado.
  - `descripcion`: Descripción final aplicada.
  - `fecha_vigencia`: Fecha de inicio de vigencia.

**Lógica y validaciones:**

1. **Verificación de existencia:**
   - Se valida que no exista ya una configuración activa. Si existe, retorna un error y sugiere usar la función de actualización.
2. **Validación de parámetros:**
   - El valor de pesos por punto debe ser mayor a 0 y no nulo.
   - El usuario de operación debe ser válido (> 0).
3. **Preparación de descripción:**
   - Si no se proporciona descripción, se genera una por defecto usando `COALESCE`.
4. **Inserción:**
   - Se inserta la nueva configuración como activa, registrando usuario y fecha de inicio de vigencia.
   - Se utiliza `RETURNING` para obtener el ID generado.
5. **Verificación de éxito:**
   - Si no se genera un ID, retorna un error.
   - Si es exitosa, retorna un JSON con los datos de la configuración creada.
6. **Manejo de errores:**
   - Cualquier error inesperado se captura con `WHEN OTHERS` y se retorna el mensaje de error usando `SQLERRM`.

**Comandos especiales explicados:**

- `json_build_object`: Construye un objeto JSON para la respuesta.
- `COALESCE`: Devuelve el primer valor no nulo, útil para asignar descripciones por defecto.
- `RETURNING ... INTO`: Permite capturar el ID generado automáticamente al insertar.
- `WHEN OTHERS` y `SQLERRM`: Captura y muestra cualquier error inesperado.

**Buenas prácticas:**

- Garantizar unicidad de la configuración activa.
- Validaciones estrictas para evitar duplicidad o datos inconsistentes.
- Auditoría de usuario y fecha de creación.
- Respuestas estructuradas para facilitar integración y diagnóstico.

---

## Carpeta: tab_ordenes_compra_proveedor

### Estructura: tab_orden_compra_proveedor_unificada

**Propósito:**
Tabla unificada que centraliza la información de órdenes de compra a proveedores y los detalles de productos asociados. Simplifica la gestión y control de compras, reemplazando la relación 1:N tradicional entre órdenes y detalles.

**Características principales:**

- Una fila por cada producto en cada orden de compra.
- Incluye información de la orden y del producto.
- Control de estados individuales por producto (solicitado, parcial, recibido, cancelado).
- Trigger automático para actualizar stock al confirmar recepción.
- Auditoría de usuario y fechas de creación/modificación.

**Campos relevantes:**

- `id_orden_compra_producto`: Clave primaria única del registro.
- `id_orden_compra`: ID de la orden de compra (puede agrupar varios productos).
- `id_proveedor`: Proveedor asociado.
- `fec_orden_compra`, `fec_esperada_entrega`: Fechas de la orden y de entrega esperada.
- `id_categoria`, `id_linea`, `id_sublinea`, `id_producto`: Identificadores del producto.
- `cantidad_solicitada`, `cantidad_recibida`: Control de cantidades.
- `costo_unitario`, `subtotal_producto`: Costo y subtotal calculado automáticamente (`STORED`).
- `ind_estado_producto`: Estado del producto (1=Solicitado, 2=Parcial, 3=Recibido, 4=Cancelado).
- `fec_recepcion_completa`: Fecha de recepción total (solo si estado=3).
- `usr_insert`, `usr_update`, `fec_insert`, `fec_update`: Auditoría.

**Restricciones y buenas prácticas:**

- `chk_cantidad_recibida_limite`: No se puede recibir más de lo solicitado.
- `chk_fec_esperada_futura`: La fecha esperada debe ser igual o posterior a la de la orden.
- `chk_recepcion_completa_coherente`: Solo hay fecha de recepción si el estado es recibido.
- `uq_orden_producto_proveedor`: Evita duplicados de producto en la misma orden.
- Índices para optimización de consultas por orden, producto, estado y proveedor.
- Uso de `STORED` para campos calculados garantiza integridad y eficiencia.

**Comandos especiales explicados:**

- `STORED`: Indica que el valor de la columna se calcula y almacena automáticamente en la base de datos.
- `CHECK`: Restricciones para validar reglas de negocio a nivel de base de datos.
- `FOREIGN KEY`: Garantiza integridad referencial con proveedores y productos.

---

### Función: fun_insert_orden_compra_proveedor

**Propósito:**
Inserta un nuevo registro de orden de compra a proveedor en la tabla unificada. Genera automáticamente el ID de orden si no se proporciona y valida la existencia del producto antes de crear la orden.

**Parámetros:**

- `p_id_orden_compra`: ID de la orden de compra (opcional, se genera si es NULL).
- `p_id_proveedor`: ID del proveedor.
- `p_fec_esperada_entrega`: Fecha esperada de entrega.
- `p_observaciones_orden`: Observaciones generales de la orden (opcional).
- `p_id_categoria`, `p_id_linea`, `p_id_sublinea`, `p_id_producto`: Identificadores del producto.
- `p_cantidad_solicitada`: Cantidad solicitada.
- `p_cantidad_recibida`: Cantidad recibida (usualmente 0 al crear).
- `p_costo_unitario`: Costo unitario del producto.
- `p_ind_estado_producto`: Estado inicial del producto.
- `p_observaciones_producto`: Observaciones específicas del producto (opcional).
- `p_usr_operacion`: Usuario que realiza la operación.

**Retorna:**

- `JSON` con:
  - `success`: Booleano de éxito.
  - `message`: Mensaje descriptivo.
  - `id_orden_compra`: ID generado o proporcionado.
  - `producto_existe`: Booleano.
  - `accion_requerida`: Instrucción si el producto no existe.
  - `producto_info`: Detalles del producto y subtotal.
  - `tiempo_procesamiento`, `timestamp`: Métricas de auditoría.

**Lógica y validaciones:**

1. Genera el ID de orden automáticamente si no se proporciona (usando `COALESCE(MAX(id_orden_compra), 0) + 1`).
2. Valida todos los parámetros obligatorios (IDs, cantidades, costos, usuario).
3. Verifica que el proveedor exista y esté activo.
4. Verifica que el producto exista; si no, retorna instrucciones para crearlo.
5. Evita duplicados de orden.
6. Inserta la orden si todo es válido.
7. Retorna resultado detallado en JSON.
8. Manejo de errores con captura de excepciones (`WHEN OTHERS`).

**Comandos especiales explicados:**

- `json_build_object`: Construye objetos JSON para respuestas estructuradas.
- `COALESCE`: Devuelve el primer valor no nulo, útil para generación de IDs y validaciones.
- `CASE`: Permite lógica condicional en la respuesta JSON.
- `WHEN OTHERS`, `SQLERRM`, `SQLSTATE`: Captura y describe errores inesperados.

**Buenas prácticas:**

- Validaciones exhaustivas y mensajes claros para el usuario.
- Auditoría de tiempos y usuario de operación.
- Respuestas estructuradas para integración con sistemas externos.

---

### Función: fun_update_orden_compra_proveedor

**Propósito:**
Actualiza un registro existente de orden de compra a proveedor, permitiendo modificar cantidades, costos, fechas, observaciones y estados. Controla los cambios de estado que afectan el stock.

**Parámetros:**

- `p_id_orden_compra`: ID de la orden de compra a actualizar.
- `p_id_proveedor`: ID del proveedor.
- `p_fec_esperada_entrega`: Nueva fecha esperada de entrega (opcional).
- `p_observaciones_orden`: Nuevas observaciones de la orden (opcional).
- `p_id_categoria`, `p_id_linea`, `p_id_sublinea`, `p_id_producto`: Identificadores del producto.
- `p_cantidad_solicitada`: Nueva cantidad solicitada (opcional).
- `p_cantidad_recibida`: Nueva cantidad recibida (opcional).
- `p_costo_unitario`: Nuevo costo unitario (opcional).
- `p_ind_estado_producto`: Nuevo estado del producto (opcional).
- `p_observaciones_producto`: Nuevas observaciones del producto (opcional).
- `p_usr_operacion`: Usuario que realiza la actualización.

**Retorna:**

- `JSON` con:
  - `success`: Booleano de éxito.
  - `message`: Mensaje descriptivo.
  - `cambios_realizados`: Objeto con los cambios aplicados.
  - `estado_anterior`, `estado_nuevo`: Estados antes y después de la actualización.
  - `stock_actualizado`: Booleano si se actualizó el stock.

**Lógica y validaciones:**

1. Valida que el usuario de operación sea válido.
2. Verifica que el registro de orden exista.
3. Obtiene valores actuales y compara con los nuevos para aplicar solo los cambios necesarios.
4. Valida coherencia de datos (fechas, cantidades, costos, estados).
5. Aplica los cambios usando `COALESCE` para mantener valores anteriores si no se especifican nuevos.
6. Si el estado cambia a "Recibido" (3), se actualiza la fecha de recepción y se activa el trigger de actualización de stock.
7. Retorna un JSON detallando los cambios y el resultado.
8. Manejo de errores con captura de excepciones (`WHEN OTHERS`).

**Comandos especiales explicados:**

- `json_build_object`: Construye objetos JSON para respuestas estructuradas.
- `COALESCE`: Mantiene valores anteriores si no se especifican nuevos.
- `FOUND`: Indica si la última operación DML afectó filas.
- `WHEN OTHERS`, `SQLERRM`: Captura y describe errores inesperados.

**Buenas prácticas:**

- Validaciones estrictas para evitar inconsistencias.
- Control de estados y lógica de negocio clara.
- Auditoría de usuario y tiempos de operación.
- Respuestas estructuradas para integración y diagnóstico.

---

## Carpeta: tab_estadisticas_productos

### Función: fun_actualizar_resumen_ventas

**Propósito:**
Actualiza automáticamente las estadísticas de ventas por producto en la tabla `tab_estadisticas_productos`. Calcula métricas históricas, mensuales, tendencias y rotación de inventario, permitiendo un análisis integral del desempeño de cada producto.

**Parámetros:**

- `p_id_categoria`: ID de la categoría del producto (opcional).
- `p_id_linea`: ID de la línea del producto (opcional).
- `p_id_sublinea`: ID de la sublínea del producto (opcional).
- `p_id_producto`: ID del producto específico (opcional).
- `p_recalcular_todo`: Si es TRUE, recalcula todas las estadísticas (por defecto: FALSE).

**Retorna:**

- `JSON` con:
  - `success`: Booleano de éxito.
  - `productos_actualizados`: Número de productos procesados.
  - `tiempo_procesamiento`: Intervalo de tiempo de ejecución.
  - `periodo_calculo`: Periodo de cálculo (mes actual).

**Lógica y métricas calculadas:**

1. Si se especifica producto, actualiza solo ese producto; si `p_recalcular_todo` es TRUE, actualiza todos.
2. Calcula para cada producto:
   - **Totales históricos:** Órdenes, unidades vendidas, ingresos.
   - **Estadísticas mensuales:** Ventas e ingresos del mes actual y anterior.
   - **Fechas clave:** Primera y última venta.
   - **Promedios:** Precio promedio de venta, ventas e ingresos mensuales promedios.
   - **Rotación de inventario:** Ventas anuales/stock promedio, nivel de rotación (ALTA, MEDIA, BAJA, SIN_VENTAS).
   - **Mejor mes de ventas:** Mes con mayor cantidad vendida.
   - **Días desde última venta.**
3. Inserta o actualiza (`ON CONFLICT ... DO UPDATE`) el registro de estadísticas del producto.
4. Retorna un resumen en JSON con el resultado.

**Comandos especiales explicados:**

- `COALESCE`: Devuelve el primer valor no nulo, útil para evitar nulos en sumas y divisiones.
- `ROUND`: Redondea valores numéricos, usado para promedios y rotación.
- `GREATEST`: Devuelve el mayor valor de una lista, útil para evitar divisiones por cero.
- `ON CONFLICT ... DO UPDATE`: Permite actualizar el registro si ya existe, garantizando que siempre haya una sola fila por producto.
- `EXCLUDED`: Hace referencia a los valores propuestos en la inserción durante un `ON CONFLICT`.
- `CASE`: Permite lógica condicional en cálculos y asignaciones.
- `TO_CHAR`, `EXTRACT`, `AGE`: Funciones de fecha para agrupar y calcular periodos.

**Buenas prácticas:**

- Cálculo eficiente de métricas usando agregaciones y funciones de ventana.
- Uso de desnormalización para mejorar el rendimiento de consultas analíticas.
- Respuestas estructuradas en JSON para integración y monitoreo.
- Auditoría de tiempos y cantidad de productos procesados.

**Aplicaciones y uso:**

- Se llama desde triggers al completar órdenes, procesos batch y tareas de mantenimiento.
- Permite monitorear tendencias, identificar productos de alta/baja rotación y tomar decisiones de inventario y ventas.

---

## Carpeta: tab_estadisticas_categorias

### Función: fun_actualizar_resumen_categoria

**Propósito:**
Actualiza automáticamente las estadísticas agregadas de ventas por categoría en la tabla `tab_estadisticas_categorias`. Consolida métricas de todos los productos de la categoría y calcula análisis de participación, crecimiento y tendencias.

**Parámetros:**

- `p_id_categoria`: ID de la categoría específica (opcional).
- `p_recalcular_todo`: Si es TRUE, recalcula todas las categorías (por defecto: FALSE).

**Retorna:**

- `JSON` con:
  - `success`: Booleano de éxito.
  - `categorias_actualizadas`: Número de categorías procesadas.
  - `tiempo_procesamiento`: Intervalo de tiempo de ejecución.
  - `periodo_calculo`: Periodo de cálculo (mes actual).

**Lógica y métricas calculadas:**

1. Si se especifica categoría, actualiza solo esa; si `p_recalcular_todo` es TRUE, actualiza todas.
2. Para cada categoría:
   - **Agregación de productos:** Total, activos, con ventas.
   - **Suma de órdenes, unidades e ingresos:** Totales históricos y mensuales.
   - **Participación en ventas totales:** Porcentaje respecto al total del sistema.
   - **Productos destacados:** Más vendido por unidades y por ingresos.
   - **Crecimiento mensual:** Comparativo entre mes actual y anterior.
   - **Fechas clave:** Primera y última venta, mejor mes de ventas.
   - **Precio promedio de la categoría.**
3. Inserta o actualiza (`ON CONFLICT ... DO UPDATE`) el registro de estadísticas de la categoría.
4. Retorna un resumen en JSON con el resultado.

**Dependencias:**

- Requiere que la tabla `tab_estadisticas_productos` esté actualizada (idealmente ejecutando antes `fun_actualizar_resumen_ventas`).

**Comandos especiales explicados:**

- `COALESCE`: Devuelve el primer valor no nulo, útil para evitar nulos en sumas y divisiones.
- `ROUND`: Redondea valores numéricos, usado para promedios y porcentajes.
- `ON CONFLICT ... DO UPDATE`: Permite actualizar el registro si ya existe, garantizando que siempre haya una sola fila por categoría.
- `EXCLUDED`: Hace referencia a los valores propuestos en la inserción durante un `ON CONFLICT`.
- `CASE`: Permite lógica condicional en cálculos y asignaciones.

**Buenas prácticas:**

- Cálculo eficiente de métricas usando agregaciones y funciones de ventana.
- Uso de desnormalización para mejorar el rendimiento de consultas analíticas.
- Respuestas estructuradas en JSON para integración y monitoreo.
- Auditoría de tiempos y cantidad de categorías procesadas.

**Aplicaciones y uso:**

- Se llama desde triggers al completar órdenes, procesos batch y tareas de mantenimiento.
- Permite monitorear tendencias, identificar categorías de alto/bajo rendimiento y tomar decisiones estratégicas.

---

## Carpeta: tab_carrito_productos

### Función: fun_agregar_producto_carrito

**Propósito:**
Agrega un producto al carrito del usuario (registrado o anónimo) o actualiza la cantidad si ya existe. Realiza validaciones de existencia, stock y estado del producto.

**Parámetros:**

- `p_id_usuario`: ID del usuario registrado (opcional para usuarios anónimos).
- `p_session_id`: ID de sesión para usuarios anónimos (opcional).
- `p_id_categoria`, `p_id_linea`, `p_id_sublinea`, `p_id_producto`: Identificadores del producto.
- `p_cantidad`: Cantidad del producto a agregar.
- `p_usr_operacion`: Usuario que realiza la operación (opcional, usa p_id_usuario por defecto).

**Retorna:**

- `JSON` con:
  - `success`: Booleano de éxito.
  - `message`: Mensaje descriptivo.
  - `id_carrito`: ID del carrito (en caso de éxito).

**Lógica y validaciones:**

1. Valida que se proporcione al menos un identificador de usuario o sesión.
2. Determina el usuario para auditoría.
3. Valida que el producto existe, está activo y obtiene precio y stock.
4. Obtiene o crea el carrito del usuario.
5. Verifica si el producto ya está en el carrito y la cantidad actual.
6. Valida que haya stock suficiente (cantidad actual + nueva <= stock disponible).
7. Inserta el producto o actualiza la cantidad si ya existe (`ON CONFLICT ... DO UPDATE`).
8. Actualiza la fecha de modificación del carrito principal.
9. Retorna resultado exitoso o mensaje de error.

**Comandos especiales explicados:**

- `ON CONFLICT ... DO UPDATE`: Permite actualizar la cantidad y precio si el producto ya existe en el carrito.
- `COALESCE`: Devuelve el primer valor no nulo, útil para sumar cantidades y validar stock.
- `json_build_object`: Construye objetos JSON para respuestas estructuradas.

**Buenas prácticas:**

- Validaciones exhaustivas para evitar inconsistencias.
- Auditoría de usuario y fecha de modificación.
- Respuestas estructuradas para integración con frontend.

---

### Función: fun_eliminar_producto_carrito

**Propósito:**
Elimina productos del carrito de un usuario (registrado o anónimo). Permite eliminar una cantidad específica o eliminar completamente el producto del carrito.

**Parámetros:**

- `p_id_usuario`: ID del usuario registrado (opcional para usuarios anónimos).
- `p_session_id`: ID de sesión para usuarios anónimos (opcional).
- `p_id_categoria`, `p_id_linea`, `p_id_sublinea`, `p_id_producto`: Identificadores del producto (obligatorios, > 0).
- `p_cantidad`: Cantidad a eliminar (opcional, si NULL elimina todo el producto).
- `p_usr_operacion`: Usuario que realiza la operación (opcional, usa p_id_usuario por defecto).

**Retorna:**

- `JSON` con:
  - `success`: Indicador de éxito.
  - `message`: Mensaje descriptivo.
  - `id_carrito`: ID del carrito afectado.
  - `cantidad_eliminada`: Cantidad realmente eliminada.
  - `cantidad_restante`: Cantidad que queda en el carrito (0 si se eliminó completamente).

**Lógica y validaciones:**

1. Valida que se proporcione al menos un identificador de usuario o sesión.
2. Determina el usuario para auditoría.
3. Valida que los identificadores del producto sean válidos (> 0).
4. Si se especifica cantidad, debe ser positiva.
5. Obtiene el carrito del usuario.
6. Verifica que el producto esté en el carrito y obtiene la cantidad actual.
7. Determina la cantidad a eliminar (total o parcial).
8. Actualiza o elimina el registro según corresponda.
9. Actualiza la fecha de modificación del carrito principal.
10. Retorna resultado exitoso con detalles o mensaje de error.

**Comandos especiales explicados:**

- `COALESCE`: Devuelve el primer valor no nulo, útil para cálculos de cantidades.
- `json_build_object`: Construye objetos JSON para respuestas estructuradas.
- `CASE`: Permite lógica condicional en el mensaje de respuesta.

**Buenas prácticas:**

- Validaciones estrictas para evitar inconsistencias.
- Auditoría de usuario y fecha de modificación.
- Respuestas estructuradas para integración con frontend.

---

### Función: fun_migrar_carrito_anonimo_a_usuario

**Propósito:**
Migra todos los productos de un carrito anónimo al carrito de un usuario registrado. Se ejecuta cuando un usuario anónimo se registra o inicia sesión.

**Parámetros:**

- `p_id_carrito_anonimo`: ID del carrito anónimo (origen).
- `p_id_usuario`: ID del usuario registrado (destino).
- `p_usr_operacion`: Usuario que realiza la operación (para auditoría).

**Retorna:**

- `JSON` con:
  - `success`: Booleano de éxito.
  - `message`: Mensaje descriptivo.

**Lógica y validaciones:**

1. Obtiene o crea el carrito del usuario registrado.
2. Itera sobre los productos del carrito anónimo.
3. Actualiza los precios a valores actuales (si el producto sigue activo).
4. Transfiere productos al carrito del usuario, sumando cantidades si ya existen (`ON CONFLICT ... DO UPDATE`).
5. Elimina el carrito anónimo y sus productos.
6. Retorna resultado exitoso.

**Comandos especiales explicados:**

- `ON CONFLICT ... DO UPDATE`: Permite sumar cantidades y actualizar precios si el producto ya existe en el carrito destino.
- `COALESCE`: Devuelve el primer valor no nulo, útil para mantener el precio si el producto ya no está activo.
- `json_build_object`: Construye objetos JSON para respuestas estructuradas.

**Buenas prácticas:**

- Garantiza que los usuarios no pierdan productos al registrarse o iniciar sesión.
- Actualiza precios a valores actuales para coherencia comercial.
- Auditoría de usuario y operación.
- Limpieza de carritos anónimos tras la migración.

---

## Carpeta: tab_categorias

### Función: fun_deactivate_categoria

**Propósito:**
Desactiva una categoría del sistema mediante eliminación lógica y, en cascada, desactiva todas las líneas, sublíneas, productos y comentarios que dependen de esa categoría.

**Parámetros:**

- `wid_categoria`: ID de la categoría a desactivar (obligatorio).
- `wusr_operacion`: Usuario que realiza la operación (obligatorio, para auditoría).

**Retorna:**

- `VARCHAR`: Mensaje detallado con la cantidad de elementos desactivados en cascada.

**Lógica y validaciones:**

1. Desactiva la categoría principal (cambia `ind_activo` a FALSE y registra usuario).
2. Desactiva todas las líneas, sublíneas, productos y comentarios asociados a la categoría.
3. Usa `GET DIAGNOSTICS ... = ROW_COUNT;` para contar cuántos elementos se desactivan en cada paso.
4. Si la categoría no existe o ya estaba inactiva, retorna error.
5. Retorna un mensaje detallado con el resumen de la cascada.
6. Maneja errores inesperados con `EXCEPTION` y `SQLERRM`.

**Comandos especiales explicados:**

- `GET DIAGNOSTICS ... = ROW_COUNT;`: Obtiene el número de filas afectadas por la última operación DML.
- `FORMAT`: Permite construir mensajes de texto con variables de forma segura.
- `EXCEPTION ... SQLERRM`: Captura y muestra errores inesperados.

**Buenas prácticas:**

- Eliminación lógica en cascada para mantener integridad y trazabilidad.
- Auditoría de usuario y operación.
- Mensajes claros y detallados para el usuario.

---

### Función: fun_insert_categoria

**Propósito:**
Inserta una nueva categoría en el sistema de clasificación de productos. Las categorías son el primer nivel de organización.

**Parámetros:**

- `wnom_categoria`: Nombre de la categoría (obligatorio, mínimo 3 caracteres).
- `wusr_operacion`: ID del usuario que realiza la operación (obligatorio).

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica y validaciones:**

1. Valida que el nombre de la categoría tenga al menos 3 caracteres.
2. Valida que el usuario de operación sea válido (> 0).
3. Genera el ID secuencial automáticamente usando `COALESCE(MAX(id_categoria),0) + 1`.
4. Inserta la categoría en la base de datos.
5. Usa `FOUND` para verificar si la inserción fue exitosa y lanza un aviso con `RAISE NOTICE`.
6. Maneja errores de integridad referencial (`SQLSTATE '23503'`) y otros errores genéricos con `EXCEPTION` y `SQLERRM`.

**Comandos especiales explicados:**

- `COALESCE`: Devuelve el primer valor no nulo, útil para generación de IDs.
- `FOUND`: Indica si la última operación DML afectó filas.
- `RAISE NOTICE`: Muestra mensajes informativos en consola/log.
- `EXCEPTION ... SQLERRM`: Captura y muestra errores inesperados.
- `ROLLBACK`: Revierte la transacción en caso de error grave.

**Buenas prácticas:**

- Validaciones estrictas para evitar datos inconsistentes.
- Auditoría de usuario y operación.
- Manejo explícito de errores para facilitar el diagnóstico.

---

### Función: fun_update_categoria

**Propósito:**
Actualiza la información de una categoría existente, permitiendo cambiar el nombre y el estado activo.

**Parámetros:**

- `wid_categoria`: ID de la categoría a actualizar (obligatorio).
- `wnom_categoria`: Nuevo nombre de la categoría (obligatorio, mínimo 3 caracteres).
- `wind_activo`: Nuevo estado activo (opcional, mantiene el actual si es NULL).
- `wusr_operacion`: ID del usuario que realiza la operación (obligatorio).

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica y validaciones:**

1. Valida que el nombre de la categoría sea válido.
2. Valida que el usuario de operación sea válido (> 0).
3. Actualiza la información de la categoría, usando `COALESCE` para mantener el estado actual si no se especifica uno nuevo.
4. Actualiza el timestamp de modificación.
5. Usa `FOUND` para verificar si la actualización fue exitosa y lanza un aviso con `RAISE NOTICE`.
6. Retorna mensaje de éxito o error según corresponda.

**Comandos especiales explicados:**

- `COALESCE`: Mantiene el valor anterior si no se especifica uno nuevo.
- `FOUND`: Indica si la última operación DML afectó filas.
- `RAISE NOTICE`: Muestra mensajes informativos en consola/log.

**Buenas prácticas:**

- Validaciones estrictas para evitar inconsistencias.
- Auditoría de usuario y operación.
- Respuestas claras y detalladas para el usuario.

---

## Carpeta: tab_canjes_puntos_descuentos

### Función: fun_aplicar_canje_orden

**Propósito:**
Aplica un canje de puntos por descuento a una orden específica, marcando el canje como utilizado y actualizando los totales de la orden. Los puntos ya fueron descontados previamente.

**Parámetros:**

- `p_id_canje`: ID del canje a aplicar.
- `p_id_orden`: ID de la orden donde se aplica el canje.
- `p_id_usuario`: ID del usuario (para validación).
- `p_usr_operacion`: Usuario que realiza la operación (auditoría).

**Retorna:**

- `JSON` con:
  - `success`: Booleano de éxito.
  - `message`: Mensaje descriptivo.
  - Información adicional sobre el canje, orden y descuento aplicado.

**Lógica y validaciones:**

1. Valida que el canje existe, pertenece al usuario, no está utilizado ni expirado.
2. Valida que la orden existe, pertenece al usuario y no está completada.
3. Calcula el valor del descuento según el tipo de aplicación (total del pedido, producto específico, categoría, marca, etc.), usando lógica condicional (`CASE`).
4. Si el descuento no aplica, retorna mensaje explicativo.
5. Actualiza los totales de la orden, asegurando que el total final no sea negativo.
6. Agrega el nuevo descuento al detalle de descuentos aplicados (JSON).
7. Marca el canje como utilizado y lo asocia a la orden.
8. Retorna resultado detallado en JSON.
9. Maneja errores inesperados con `EXCEPTION` y `SQLERRM`.

**Comandos especiales explicados:**

- `json_build_object`: Construye objetos JSON para respuestas estructuradas.
- `COALESCE`: Devuelve el primer valor no nulo, útil para sumas y validaciones.
- `CASE`: Permite lógica condicional en cálculos y asignaciones.
- `LEAST`: Devuelve el menor valor, útil para limitar descuentos.
- `EXCEPTION ... SQLERRM`: Captura y muestra errores inesperados.

**Buenas prácticas:**

- Validaciones exhaustivas para evitar fraudes o inconsistencias.
- Auditoría de usuario y operación.
- Respuestas estructuradas para integración y trazabilidad.

---

### Función: fun_canjear_puntos_descuento

**Propósito:**
Permite a un usuario canjear sus puntos acumulados por un descuento específico, descontando los puntos y creando un canje disponible. Si el usuario tiene un carrito activo que cumple los criterios, lo aplica automáticamente.

**Parámetros:**

- `p_id_usuario`: ID del usuario que realiza el canje (obligatorio).
- `p_id_descuento`: ID del descuento que se desea canjear (obligatorio).
- `p_usr_operacion`: Usuario que realiza la operación (auditoría).

**Retorna:**

- `JSON` con:
  - `success`: Booleano de éxito.
  - `message`: Mensaje descriptivo.
  - `id_canje`: ID del canje creado (si es exitoso).
  - `descuento`: Nombre del descuento canjeado.
  - `puntos_utilizados`: Cantidad de puntos descontados.
  - `puntos_restantes`: Puntos que le quedan al usuario.
  - `aplicado_automaticamente`: Booleano si se aplicó al carrito actual.
  - `valor_descuento_aplicado`: Monto del descuento si se aplicó automáticamente.
  - `total_carrito_anterior`: Total del carrito antes del descuento.
  - `total_carrito_final`: Total del carrito después del descuento.
  - `id_carrito_aplicado`: ID del carrito si se aplicó automáticamente.

**Lógica y validaciones:**

1. Valida que el descuento existe, es canjeable por puntos y está vigente.
2. Verifica que el usuario tenga puntos suficientes.
3. Descuenta los puntos y actualiza los totales del usuario.
4. Crea el registro de canje con expiración (30 días).
5. Registra el movimiento de puntos para auditoría.
6. Busca carrito activo del usuario y, si cumple criterios, aplica el descuento automáticamente usando la función de cálculo de carrito.
7. Si se aplica automáticamente, marca el canje como utilizado.
8. Retorna confirmación con detalles del canje y aplicación automática.
9. Maneja errores inesperados con `EXCEPTION` y `SQLERRM`.

**Comandos especiales explicados:**

- `json_build_object`: Construye objetos JSON para respuestas estructuradas.
- `COALESCE`: Devuelve el primer valor no nulo, útil para evitar nulos en sumas y cálculos.
- `ON CONFLICT ... DO NOTHING`: Evita duplicados al insertar registros de puntos.
- `CASE`: Permite lógica condicional en mensajes y cálculos.
- `EXCEPTION ... SQLERRM`: Captura y muestra errores inesperados.

**Buenas prácticas:**

- Validaciones estrictas para evitar fraudes o inconsistencias.
- Auditoría de usuario y operación.
- Aplicación automática para mejorar experiencia de usuario.
- Respuestas estructuradas para integración y trazabilidad.

---

## Carpeta: tab_cms_content

### Función: fun_insert_content

**Propósito:**
Inserta nuevo contenido en el sistema de gestión de contenidos (CMS), permitiendo versionado y control de publicación.

**Parámetros:**

- `wnom_cms_content`: Nombre del contenido (obligatorio, no vacío).
- `wdes_cms_content`: Descripción del contenido (opcional).
- `wnum_version`: Número de versión del contenido (opcional).
- `wind_publicado`: Indicador si está publicado (opcional, boolean).
- `wusr_operacion`: Usuario que realiza la operación (obligatorio, no vacío).

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica y validaciones:**

1. Valida que el nombre del contenido no sea nulo ni vacío.
2. Valida que el usuario de operación no sea nulo ni vacío.
3. Inserta el contenido en la tabla CMS.
4. Usa `FOUND` para verificar si la inserción fue exitosa.
5. Maneja errores de campos obligatorios (`SQLSTATE '23502'`) y otros errores con `EXCEPTION`, mostrando el mensaje con `SQLERRM` y realizando `ROLLBACK` si es necesario.

**Comandos especiales explicados:**

- `FOUND`: Indica si la última operación DML afectó filas.
- `EXCEPTION ... SQLERRM`: Captura y muestra errores inesperados.
- `ROLLBACK`: Revierte la transacción en caso de error grave.

**Buenas prácticas:**

- Validaciones estrictas para evitar datos inconsistentes.
- Auditoría de usuario y operación.
- Manejo explícito de errores para facilitar el diagnóstico.

---

### Función: fun_update_content

**Propósito:**
Actualiza el contenido existente en el sistema CMS, permitiendo modificar descripción, versión y estado de publicación.

**Parámetros:**

- `wnom_cms_content`: Nombre del contenido a actualizar (obligatorio, identificador único).
- `wdes_cms_content`: Nueva descripción del contenido (opcional).
- `wnum_version`: Nuevo número de versión (opcional).
- `wind_publicado`: Nuevo estado de publicación (opcional, boolean).
- `wusr_operacion`: Usuario que realiza la operación (obligatorio).

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica y validaciones:**

1. Valida que el nombre del contenido no sea nulo ni vacío.
2. Valida que el usuario de operación no sea nulo ni vacío.
3. Actualiza el contenido por nombre, modificando los campos proporcionados.
4. Actualiza el timestamp de modificación.
5. Usa `FOUND` para verificar si la actualización fue exitosa.
6. Maneja errores de campos obligatorios (`SQLSTATE '23502'`) y otros errores con `EXCEPTION`, mostrando el mensaje con `SQLERRM` y realizando `ROLLBACK` si es necesario.

**Comandos especiales explicados:**

- `FOUND`: Indica si la última operación DML afectó filas.
- `EXCEPTION ... SQLERRM`: Captura y muestra errores inesperados.
- `ROLLBACK`: Revierte la transacción en caso de error grave.

**Buenas prácticas:**

- Validaciones estrictas para evitar datos inconsistentes.
- Auditoría de usuario y operación.
- Manejo explícito de errores para facilitar el diagnóstico.

---

### Función: fun_delete_content

**Propósito:**
Elimina permanentemente contenido del sistema CMS. Realiza eliminación física del registro por nombre.

**Parámetros:**

- `wnom_cms_content`: Nombre del contenido a eliminar (obligatorio, usado como identificador).
- `wusr_operacion`: Usuario que realiza la operación (obligatorio para auditoría).

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica y validaciones:**

1. Valida que el nombre del contenido no sea nulo ni vacío.
2. Valida que el usuario de operación no sea nulo ni vacío.
3. Elimina el contenido por nombre.
4. Usa `FOUND` para verificar si la eliminación fue exitosa y lanza un aviso con `RAISE NOTICE`.
5. Retorna mensaje de éxito o error según corresponda.

**Comandos especiales explicados:**

- `FOUND`: Indica si la última operación DML afectó filas.
- `RAISE NOTICE`: Muestra mensajes informativos en consola/log.

**Buenas prácticas:**

- Validaciones estrictas para evitar inconsistencias.
- Auditoría de usuario y operación.
- Respuestas claras y detalladas para el usuario.

---

### Función: fun_get_content

**Propósito:**
Obtiene el contenido publicado del CMS por nombre. Solo retorna contenido que esté marcado como publicado.

**Parámetros:**

- `wnom_cms_content`: Nombre del contenido a obtener (obligatorio).

**Retorna:**

- `JSONB`: Descripción del contenido en formato JSON, NULL si no existe o no está publicado.

**Lógica y validaciones:**

1. Busca el contenido por nombre.
2. Filtra solo contenido publicado (`ind_publicado = true`).
3. Retorna la descripción del contenido si existe y está publicado, o NULL en caso contrario.

**Buenas prácticas:**

- Permite exponer solo contenido aprobado/publicado.
- Respuestas estructuradas para integración con frontend o APIs.

---

## Carpeta: tab_descuentos

### Función: fun_insert_descuento

**Propósito:**
Inserta un nuevo descuento en el sistema con todas las configuraciones posibles: porcentaje/monto, fechas, horarios, productos, categorías, marcas, restricciones de uso, etc.

**Parámetros:**

- Obligatorios: nombre, descripción, tipo de cálculo, valor, aplicación, fechas de vigencia.
- Opcionales: producto/categoría/marca/linea/sublinea específica, código, máximos de uso, horarios, restricciones, etc.

**Retorna:**

- `JSON` con:
  - `success`: Booleano de éxito.
  - `message`: Mensaje descriptivo.
  - `id_descuento`: ID generado.

**Lógica y validaciones:**

1. Valida nombre, fechas, unicidad de código, coherencia de horarios y campos según tipo de aplicación.
2. Genera ID secuencial automáticamente.
3. Inserta el descuento con todas las configuraciones.
4. Maneja errores de integridad referencial, restricciones y otros con `EXCEPTION` y `SQLERRM`.

**Comandos especiales explicados:**

- `json_build_object`: Construye objetos JSON para respuestas estructuradas.
- `CASE`: Lógica condicional para validaciones y asignaciones.
- `COALESCE`: Generación de IDs y validaciones.

---

### Función: fun_update_descuento

**Propósito:**
Actualiza un descuento existente con validaciones completas de negocio y todas las configuraciones avanzadas.

**Parámetros:**

- Obligatorios: ID, nombre, descripción, tipo de cálculo, valor, aplicación, fechas de vigencia.
- Opcionales: producto/categoría/marca/linea/sublinea específica, código, máximos de uso, horarios, restricciones, etc.

**Retorna:**

- `JSON` con:
  - `success`: Booleano de éxito.
  - `message`: Mensaje descriptivo.
  - `id_descuento`: ID actualizado.

**Lógica y validaciones:**

1. Valida existencia del descuento, nombre, fechas, unicidad de código, coherencia de horarios y campos según tipo de aplicación.
2. Actualiza el descuento con todas las configuraciones.
3. Maneja errores de integridad referencial, restricciones y otros con `EXCEPTION` y `SQLERRM`.

**Comandos especiales explicados:**

- `json_build_object`: Construye objetos JSON para respuestas estructuradas.
- `CASE`: Lógica condicional para validaciones y asignaciones.

---

### Función: fun_listar_descuentos

**Propósito:**
Lista descuentos del sistema con filtros avanzados y datos calculados como estado, porcentaje de uso y valor formateado.

**Parámetros:**

- Filtros: solo activos/inactivos, incluir vencidos, búsqueda por texto, tipo de aplicación, límite de registros.

**Retorna:**

- `TABLE` con información detallada de cada descuento, incluyendo:
  - Estado calculado (Activo, Programado, Vencido, Agotado, Inactivo).
  - Porcentaje de uso.
  - Valor formateado y configuraciones.

**Lógica y validaciones:**

1. Aplica filtros opcionales de búsqueda.
2. Calcula estado dinámico y porcentaje de uso.
3. Formatea valores y ordena por prioridad de estado y fecha.
4. Aplica paginación.

**Comandos especiales explicados:**

- `CASE`: Lógica condicional para estado, valor y porcentaje de uso.
- `CONCAT`, `ROUND`: Formateo de valores y porcentajes.

---

### Función: fun_listar_descuentos_canjeables

**Propósito:**
Lista descuentos que pueden ser canjeados por puntos, verificando si el usuario tiene suficientes puntos para cada uno.

**Parámetros:**

- `p_id_usuario`: ID del usuario para verificar puntos (opcional).
- `p_limit`: Límite de registros.

**Retorna:**

- `TABLE` con información de descuentos canjeables, costo en puntos, si el usuario puede canjearlo y puntos disponibles.

**Lógica y validaciones:**

1. Obtiene puntos disponibles del usuario (si se especifica).
2. Filtra descuentos canjeables, activos y vigentes.
3. Calcula si el usuario puede canjear cada descuento.
4. Ordena por costo de puntos y aplica paginación.

**Comandos especiales explicados:**

- `COALESCE`: Manejo de nulos para puntos de usuario.
- `CASE`: Lógica condicional para tipo de cálculo y validación de puntos.

---

### Función: fun_obtener_descuento

**Propósito:**
Obtiene información completa de un descuento específico, con datos calculados, nombres resueltos y configuración detallada.

**Parámetros:**

- `p_id_descuento`: ID del descuento a obtener (obligatorio).

**Retorna:**

- `JSON` con:
  - `success`: Booleano de éxito.
  - `message`: Mensaje de error (si aplica).
  - `descuento`: Objeto con toda la información del descuento.

**Lógica y validaciones:**

1. Busca descuento por ID.
2. Calcula información adicional (estado, porcentaje de uso, valor formateado).
3. Resuelve nombres de productos, categorías y marcas relacionadas.
4. Construye respuesta JSON completa.
5. Maneja caso de descuento no encontrado y errores inesperados.

**Comandos especiales explicados:**

- `json_build_object`: Construye objetos JSON para respuestas estructuradas.
- `CASE`: Lógica condicional para estado, valor y nombres relacionados.
- `CONCAT`, `ROUND`: Formateo de valores y porcentajes.

---

### Función: fun_activar_desactivar_descuento

**Propósito:**
Activa o desactiva un descuento específico del sistema, manteniendo auditoría del usuario que realiza el cambio.

**Parámetros:**

- `p_id_descuento`: ID del descuento a modificar (obligatorio).
- `p_activar`: TRUE para activar, FALSE para desactivar (obligatorio).
- `p_usr_update`: Usuario que realiza la modificación (obligatorio).

**Retorna:**

- `JSON` con:
  - `success`: Booleano de éxito.
  - `message`: Mensaje descriptivo.
  - `descuento`: Información del descuento (si aplica).

**Lógica y validaciones:**

1. Verifica existencia del descuento y estado actual.
2. Valida si ya tiene el estado deseado.
3. Actualiza estado y auditoría.
4. Retorna resultado detallado.
5. Maneja errores SQL con `EXCEPTION` y `SQLERRM`.

**Comandos especiales explicados:**

- `json_build_object`: Construye objetos JSON para respuestas estructuradas.
- `CASE`: Lógica condicional para mensajes y estados.

---

## Carpeta: tab_descuentos_usuarios

### Función: fun_validar_descuento_aplicable

**Propósito:**
Valida si un descuento específico puede ser aplicado a un usuario, considerando todas las restricciones y condiciones configuradas. Soporta tanto usuarios registrados como anónimos.

**Parámetros:**

- `p_id_descuento`: ID del descuento a validar.
- `p_id_usuario`: ID del usuario que intenta usar el descuento (NULL para usuarios anónimos).
- `p_codigo_ingresado`: Código de cupón ingresado (opcional).
- `p_usr_insert`: Usuario que realiza la validación (auditoría, opcional).

**Retorna:**

- `BOOLEAN`:
  - `TRUE`: El descuento es aplicable.
  - `FALSE`: El descuento NO es aplicable por alguna restricción.

**Lógica y validaciones:**

1. Verifica existencia y estado activo del descuento.
2. Valida vigencia de fechas.
3. Valida código de cupón si es requerido.
4. Valida límites de uso total y por usuario (solo para usuarios registrados).
5. Valida restricciones de días de la semana y horarios.
6. Valida si es solo para primera compra o cumpleaños (solo usuarios registrados).
7. Para usuarios anónimos, omite validaciones que requieren historial de usuario.
8. Si pasa todas las validaciones, retorna `TRUE`.

**Comandos especiales explicados:**

- `CASE`: Lógica condicional para días de la semana.
- `COALESCE`: Manejo de nulos para contadores y validaciones.
- `EXISTS`: Verifica existencia de registros relacionados.
- `POSITION`: Busca si un carácter está en una cadena (días permitidos).

**Buenas prácticas:**

- Validaciones exhaustivas para evitar fraudes o mal uso.
- Soporte para múltiples escenarios de negocio.
- Respuestas booleanas simples para integración rápida.

---

### Función: fun_registrar_uso_descuento

**Propósito:**
Registra el uso de un descuento por un usuario específico, manteniendo contadores individuales y totales.

**Parámetros:**

- `p_id_descuento`: ID del descuento utilizado (obligatorio).
- `p_id_usuario`: ID del usuario que usa el descuento (obligatorio).
- `p_usr_operacion`: Usuario que realiza la operación (auditoría).

**Retorna:**

- `BOOLEAN`:
  - `TRUE`: Se registró exitosamente.
  - `FALSE`: En caso de error.

**Lógica y validaciones:**

1. Verifica si ya existe registro de uso del usuario para ese descuento.
2. Si existe, incrementa el contador y actualiza la fecha.
3. Si no existe, crea un nuevo registro de uso.
4. Actualiza el contador total de usos del descuento y la fecha de modificación.
5. Maneja cualquier excepción SQL retornando `FALSE`.

**Comandos especiales explicados:**

- `EXISTS`: Verifica existencia de registros previos.
- `COALESCE`: Manejo de nulos para contadores.
- `EXCEPTION`: Captura cualquier error SQL y retorna `FALSE`.

**Buenas prácticas:**

- Mantener trazabilidad de usos individuales y totales.
- Auditoría de usuario y operación.
- Manejo robusto de errores para evitar inconsistencias.

---

## Carpeta: tab_direcciones_usuarios

### Función: fun_insert_direcciones

**Propósito:**
Inserta una nueva dirección de usuario en el sistema, permitiendo registrar múltiples direcciones por usuario y marcar una como principal.

**Parámetros:**

- `wid_usuario`: ID del usuario al que se le asignará la dirección.
- `wnom_direccion`: Nombre descriptivo de la dirección (ej: "Casa", "Trabajo").
- `wcalle_direccion`: Dirección completa de la calle.
- `wciudad`: Ciudad de la dirección.
- `wdepartamento`: Departamento/Estado de la dirección.
- `wcodigo_postal`: Código postal de la dirección.
- `wbarrio`: Barrio/Sector de la dirección.
- `wreferencias`: Referencias para el domiciliario (opcional).
- `wcomplemento`: Información adicional (opcional).
- `wind_principal`: Indica si la dirección es principal (opcional, default: FALSE).
- `wind_activa`: Indica si la dirección está activa (opcional, default: TRUE).
- `wusr_operacion`: ID del usuario que realiza la operación.

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica y validaciones:**

1. Valida todos los campos obligatorios (usuario, nombre, calle, ciudad, departamento, código postal, barrio, usuario operación).
2. Genera el ID secuencial automáticamente usando `COALESCE(MAX(id_direccion), 0) + 1`.
3. Inserta la dirección en la base de datos.
4. Usa `FOUND` para verificar si la inserción fue exitosa y lanza un aviso con `RAISE NOTICE`.
5. Maneja errores de integridad referencial y otros con `EXCEPTION`, mostrando el mensaje con `SQLERRM` y realizando `ROLLBACK` si es necesario.

**Comandos especiales explicados:**

- `COALESCE`: Generación de IDs y validaciones.
- `FOUND`: Indica si la última operación DML afectó filas.
- `RAISE NOTICE`: Muestra mensajes informativos en consola/log.
- `EXCEPTION ... SQLERRM`: Captura y muestra errores inesperados.
- `ROLLBACK`: Revierte la transacción en caso de error grave.

**Buenas prácticas:**

- Validaciones estrictas para evitar datos inconsistentes.
- Auditoría de usuario y operación.
- Manejo explícito de errores para facilitar el diagnóstico.

---

### Función: fun_update_direcciones

**Propósito:**
Actualiza una dirección de usuario en el sistema, permitiendo modificar todos los campos relevantes y el estado principal/activo.

**Parámetros:**

- `wid_direccion`: ID de la dirección a actualizar.
- `wid_usuario`: ID del usuario al que pertenece la dirección.
- `wnom_direccion`: Nuevo nombre descriptivo de la dirección.
- `wcalle_direccion`: Nueva dirección completa de la calle.
- `wciudad`: Nueva ciudad de la dirección.
- `wdepartamento`: Nuevo departamento/estado de la dirección.
- `wcodigo_postal`: Nuevo código postal de la dirección.
- `wbarrio`: Nuevo barrio/sector de la dirección.
- `wreferencias`: Nueva referencia para el domiciliario.
- `wcomplemento`: Nuevo complemento para la dirección.
- `wind_principal`: Nuevo estado principal de la dirección.
- `wind_activa`: Nuevo estado activo de la dirección.
- `wusr_operacion`: ID del usuario que realiza la operación.

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica y validaciones:**

1. Valida todos los campos obligatorios (dirección, usuario, nombre, calle, ciudad, departamento, código postal, barrio, usuario operación).
2. Actualiza la dirección específica, usando `COALESCE` para mantener el valor anterior si no se especifica uno nuevo.
3. Usa `FOUND` para verificar si la actualización fue exitosa y lanza un aviso con `RAISE NOTICE`.
4. Maneja errores de integridad referencial y otros con `EXCEPTION`, mostrando el mensaje con `SQLERRM` y realizando `ROLLBACK` si es necesario.

**Comandos especiales explicados:**

- `COALESCE`: Mantiene el valor anterior si no se especifica uno nuevo.
- `FOUND`: Indica si la última operación DML afectó filas.
- `RAISE NOTICE`: Muestra mensajes informativos en consola/log.
- `EXCEPTION ... SQLERRM`: Captura y muestra errores inesperados.
- `ROLLBACK`: Revierte la transacción en caso de error grave.

**Buenas prácticas:**

- Validaciones estrictas para evitar datos inconsistentes.
- Auditoría de usuario y operación.
- Manejo explícito de errores para facilitar el diagnóstico.

---

### Función: fun_deactivate_direcciones

**Propósito:**
Desactiva lógicamente una dirección de usuario, cambiando su estado a inactiva sin eliminarla físicamente.

**Parámetros:**

- `wid_direccion`: ID de la dirección a desactivar.
- `wid_usuario`: ID del usuario propietario de la dirección.
- `wusr_operacion`: Usuario que realiza la operación.

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica y validaciones:**

1. Desactiva la dirección cambiando `ind_activa` a FALSE y registrando el usuario.
2. Usa `FOUND` para verificar si la desactivación fue exitosa y lanza un aviso con `RAISE NOTICE`.
3. Maneja errores inesperados con `EXCEPTION`, mostrando el mensaje con `SQLERRM` y realizando `ROLLBACK` si es necesario.

**Comandos especiales explicados:**

- `FOUND`: Indica si la última operación DML afectó filas.
- `RAISE NOTICE`: Muestra mensajes informativos en consola/log.
- `EXCEPTION ... SQLERRM`: Captura y muestra errores inesperados.
- `ROLLBACK`: Revierte la transacción en caso de error grave.

**Buenas prácticas:**

- Eliminación lógica para mantener trazabilidad.
- Auditoría de usuario y operación.
- Manejo explícito de errores para facilitar el diagnóstico.

---

## Carpeta: tab_favoritos

### Función: fun_insert_favorito

**Propósito:** Agrega un producto a la lista de favoritos de un usuario, usando la jerarquía completa de producto (categoría, línea, sublínea, producto).

- **Parámetros:**
  - `wid_usuario`: ID del usuario (obligatorio).
  - `wid_categoria_producto`: ID de la categoría del producto (obligatorio).
  - `wid_linea_producto`: ID de la línea del producto (obligatorio).
  - `wid_sublinea_producto`: ID de la sublínea del producto (obligatorio).
  - `wid_producto`: ID del producto (obligatorio).
  - `wusr_operacion`: Usuario que realiza la operación (auditoría).
- **Salida:** Mensaje de éxito o error.
- **Lógica:**
  1. Valida que todos los parámetros sean obligatorios.
  2. Inserta el producto en favoritos del usuario.
  3. Maneja duplicados y referencias inválidas.
- **Errores:**
  - `unique_violation`: El producto ya está en favoritos.
  - `foreign_key_violation`: Usuario o producto no existe.
- **Comandos especiales:**
  - `unique_violation`, `foreign_key_violation` en el bloque EXCEPTION.

### fun_delete_favorito

**Propósito:** Elimina un producto específico de la lista de favoritos de un usuario (eliminación física, no lógica).

- **Parámetros:**
  - `wid_usuario`: ID del usuario.
  - `wid_categoria_producto`: ID de la categoría del producto.
  - `wid_linea_producto`: ID de la línea del producto.
  - `wid_sublinea_producto`: ID de la sublínea del producto.
  - `wid_producto`: ID del producto.
- **Salida:** Mensaje de éxito o error.
- **Lógica:**
  1. Elimina el favorito usando todos los identificadores.
  2. Usa `FOUND` para verificar si se eliminó algún registro.
  3. Retorna mensaje de confirmación o error.
- **Comandos especiales:**
  - `FOUND`, `RAISE NOTICE`.

### fun_select_favoritos_usuario_con_detalles

**Propósito:** Obtiene la lista completa de productos favoritos de un usuario, con detalles del producto y ordenados por fecha de agregado más reciente.

- **Parámetros:**
  - `p_id_usuario`: ID del usuario (obligatorio).
- **Salida:** Tabla con los favoritos del usuario, incluyendo:
  - `id_usuario`, `id_categoria_producto`, `id_linea_producto`, `id_sublinea_producto`, `id_producto`, `fec_insert`, `nom_producto`, `img_producto`, `val_precio`.
- **Lógica:**
  1. Busca todos los favoritos del usuario.
  2. Une con la tabla de productos para obtener detalles.
  3. Ordena por fecha de agregado descendente.
- **Comandos especiales:**
  - Uso de `JOIN` para obtener detalles del producto.

---

## Carpeta: tab_lineas

### Función: fun_deactivate_linea

**Propósito:**
Desactiva una línea del sistema mediante eliminación lógica y, en cascada, desactiva todas las sublíneas, productos y comentarios que dependen de esa línea.

**Parámetros:**

- `wid_categoria`: ID de la categoría de la línea (obligatorio).
- `wid_linea`: ID de la línea a desactivar (obligatorio).
- `wusr_operacion`: Usuario que realiza la operación (obligatorio, para auditoría).

**Retorna:**

- `VARCHAR`: Mensaje detallado con la cantidad de elementos desactivados en cascada.

**Lógica y validaciones:**

1. Desactiva la línea principal (cambia `ind_activo` a FALSE y registra usuario).
2. Desactiva todas las sublíneas, productos y comentarios asociados a la línea.
3. Usa `GET DIAGNOSTICS ... = ROW_COUNT;` para contar cuántos elementos se desactivan en cada paso.
4. Si la línea no existe o ya estaba inactiva, retorna error.
5. Retorna un mensaje detallado con el resumen de la cascada.
6. Maneja errores inesperados con `EXCEPTION` y `SQLERRM`.

**Comandos especiales explicados:**

- `GET DIAGNOSTICS ... = ROW_COUNT;`: Obtiene el número de filas afectadas por la última operación DML.
- `FORMAT`: Permite construir mensajes de texto con variables de forma segura.
- `EXCEPTION ... SQLERRM`: Captura y muestra errores inesperados.

**Buenas prácticas:**

- Eliminación lógica en cascada para mantener integridad y trazabilidad.
- Auditoría de usuario y operación.
- Mensajes claros y detallados para el usuario.

---

### Función: fun_insert_linea

**Propósito:**
Inserta una nueva línea de productos en el sistema asociada a una categoría, generando automáticamente el ID secuencial de línea dentro de la categoría.

**Parámetros:**

- `wid_categoria`: ID de la categoría padre (obligatorio, > 0, debe existir y estar activa).
- `wnom_linea`: Nombre de la línea (obligatorio, mínimo 3 caracteres).
- `wusr_operacion`: ID del usuario que realiza la operación para auditoría (obligatorio).

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica y validaciones:**

1. Valida ID de categoría, nombre de línea y usuario de operación.
2. Verifica que la categoría existe y está activa.
3. Genera el ID secuencial de línea dentro de la categoría usando `COALESCE(MAX(id_linea), 0) + 1`.
4. Inserta la nueva línea.
5. Usa `FOUND` para verificar si la inserción fue exitosa y lanza un aviso con `RAISE NOTICE`.
6. Maneja errores de integridad referencial, unicidad, NOT NULL y otros con `EXCEPTION`, mostrando el mensaje con `SQLERRM` y realizando `ROLLBACK` si es necesario.

**Comandos especiales explicados:**

- `COALESCE`: Generación de IDs y validaciones.
- `FOUND`: Indica si la última operación DML afectó filas.
- `RAISE NOTICE`: Muestra mensajes informativos en consola/log.
- `EXCEPTION ... SQLERRM`: Captura y muestra errores inesperados.
- `ROLLBACK`: Revierte la transacción en caso de error grave.

**Buenas prácticas:**

- Validaciones estrictas para evitar datos inconsistentes.
- Auditoría de usuario y operación.
- Manejo explícito de errores para facilitar el diagnóstico.

---

### Función: fun_update_linea

**Propósito:**
Actualiza la información de una línea existente, permitiendo cambiar el nombre y el estado activo.

**Parámetros:**

- `wid_categoria`: ID de la categoría de la línea (obligatorio).
- `wid_linea`: ID de la línea a actualizar (obligatorio).
- `wnom_linea`: Nuevo nombre de la línea (obligatorio, mínimo 3 caracteres).
- `wind_activo`: Nuevo estado activo (opcional, mantiene el actual si es NULL).
- `wusr_operacion`: ID del usuario que realiza la operación (obligatorio).

**Retorna:**

- `VARCHAR`: Mensaje indicando éxito o error específico.

**Lógica y validaciones:**

1. Valida nombre de línea y usuario de operación.
2. Actualiza la información de la línea específica, usando `COALESCE` para mantener el estado actual si no se especifica uno nuevo.
3. Actualiza el timestamp de modificación.
4. Usa `FOUND` para verificar si la actualización fue exitosa y lanza un aviso con `RAISE NOTICE`.
5. Retorna mensaje de éxito o error según corresponda.

**Comandos especiales explicados:**

- `COALESCE`: Mantiene el valor anterior si no se especifica uno nuevo.
- `FOUND`: Indica si la última operación DML afectó filas.
- `RAISE NOTICE`: Muestra mensajes informativos en consola/log.

**Buenas prácticas:**

- Validaciones estrictas para evitar inconsistencias.
- Auditoría de usuario y operación.
- Respuestas claras y detalladas para el usuario.

---

## 17. Funciones de la carpeta `tab_proveedores`

### fun_insert_proveedores

**Propósito:** Inserta un nuevo proveedor en el sistema, generando automáticamente el ID y validando la información básica antes de la inserción.

- **Parámetros:**
  - `wnom_proveedor`: Nombre del proveedor (obligatorio, mínimo 3 caracteres).
  - `wemail`: Correo electrónico del proveedor (obligatorio, mínimo 3 caracteres, único).
  - `wtel_proveedor`: Teléfono del proveedor (obligatorio, > 0).
  - `wusr_operacion`: Usuario que realiza la operación (auditoría).
- **Salida:** Mensaje de éxito o error específico.
- **Lógica:**
  1. Valida nombre, email, teléfono y usuario.
  2. Genera el ID secuencial automáticamente usando `COALESCE(MAX(...), 0) + 1`.
  3. Inserta el proveedor.
  4. Usa `FOUND` para verificar éxito y `RAISE NOTICE` para logs.
- **Errores:**
  - SQLSTATE '23505': Email duplicado.
  - Otros: ROLLBACK y mensaje de error.
- **Comandos especiales:**
  - `COALESCE`: Para ID automático.
  - `FOUND`: Verifica si la inserción tuvo efecto.
  - `RAISE NOTICE`: Mensajes de log.
  - `ROLLBACK`: Revierte en caso de error.

### fun_update_proveedores

**Propósito:** Actualiza la información de un proveedor existente, validando todos los campos modificables.

- **Parámetros:**
  - `wid_proveedor`: ID del proveedor (obligatorio).
  - `wnom_proveedor`, `wemail`, `wtel_proveedor`: Nuevos valores (obligatorios).
  - `wind_activo`: Nuevo estado (opcional).
  - `wusr_operacion`: Usuario que realiza la operación.
- **Salida:** Mensaje de éxito o error.
- **Lógica:**
  1. Valida todos los campos.
  2. Actualiza usando `COALESCE` para mantener el estado si es NULL.
  3. Actualiza timestamp y usuario.
  4. Usa `FOUND` y `RAISE NOTICE`.
- **Errores:**
  - Cualquier excepción: ROLLBACK y mensaje descriptivo.
- **Comandos especiales:**
  - `COALESCE`, `FOUND`, `RAISE NOTICE`, `ROLLBACK`.

### fun_deactivate_proveedores

**Propósito:** Desactiva un proveedor (eliminación lógica, no física).

- **Parámetros:**
  - `wid_proveedor`: ID del proveedor.
  - `wusr_operacion`: Usuario que realiza la operación.
- **Salida:** Mensaje de éxito o error.
- **Lógica:**
  1. Valida usuario.
  2. Cambia estado a inactivo solo si está activo.
  3. Usa `FOUND` y `RAISE NOTICE`.
- **Errores:**
  - Cualquier excepción: ROLLBACK y mensaje descriptivo.
- **Comandos especiales:**
  - `FOUND`, `RAISE NOTICE`, `ROLLBACK`.

---

## 18. Funciones de la carpeta `tab_roles`

### fun_insert_roles

**Propósito:** Inserta un nuevo rol en el sistema, generando el ID automáticamente. Los roles definen niveles de acceso y permisos.

- **Parámetros:**
  - `wnom_rol`: Nombre del rol (obligatorio, mínimo 3 caracteres).
  - `wdes_rol`: Descripción (opcional).
  - `wusr_operacion`: Usuario que realiza la operación (auditoría).
- **Salida:** Mensaje de éxito o error.
- **Lógica:**
  1. Valida nombre y usuario.
  2. Genera ID con `COALESCE(MAX(...), 0) + 1`.
  3. Inserta el rol.
  4. Usa `FOUND` y `RAISE NOTICE`.
- **Errores:**
  - SQLSTATE '23503': Violación de integridad referencial.
  - Otros: ROLLBACK y mensaje descriptivo.
- **Comandos especiales:**
  - `COALESCE`, `FOUND`, `RAISE NOTICE`, `ROLLBACK`.

### fun_update_roles

**Propósito:** Actualiza la información de un rol existente (nombre y descripción).

- **Parámetros:**
  - `wid_rol`: ID del rol.
  - `wnom_rol`: Nuevo nombre (obligatorio).
  - `wdes_rol`: Nueva descripción (opcional).
  - `wusr_operacion`: Usuario que realiza la operación.
- **Salida:** Mensaje de éxito o error.
- **Lógica:**
  1. Valida nombre y usuario.
  2. Actualiza el rol y el timestamp.
  3. Usa `FOUND` y `RAISE NOTICE`.
- **Errores:**
  - Mensaje descriptivo si no se encuentra el rol.
- **Comandos especiales:**
  - `FOUND`, `RAISE NOTICE`.

### fun_delete_roles

**Propósito:** Elimina físicamente un rol del sistema.

- **Parámetros:**
  - `wid_rol`: ID del rol.
  - `wusr_operacion`: Usuario que realiza la operación.
- **Salida:** Mensaje de éxito o error.
- **Lógica:**
  1. Valida ID y usuario.
  2. Elimina el rol por ID.
  3. Usa `FOUND` y `RAISE NOTICE`.
- **Errores:**
  - Mensaje descriptivo si no se encuentra el rol.
- **Comandos especiales:**
  - `FOUND`, `RAISE NOTICE`.

---

## 19. Funciones de la carpeta `tab_sublineas`

### fun_insert_sublinea

**Propósito:** Inserta una nueva sublínea de productos asociada a una línea específica, generando el ID secuencial dentro de la línea.

- **Parámetros:**
  - `wid_categoria`: ID de la categoría padre (obligatorio).
  - `wid_linea`: ID de la línea padre (obligatorio, debe existir y estar activa).
  - `wnom_sublinea`: Nombre de la sublínea (obligatorio, mínimo 3 caracteres).
  - `wusr_operacion`: Usuario que realiza la operación (auditoría).
- **Salida:** Mensaje de éxito o error.
- **Lógica:**
  1. Valida IDs y nombre.
  2. Verifica existencia y estado de la línea.
  3. Genera ID secuencial con `COALESCE(MAX(...), 0) + 1`.
  4. Inserta la sublínea.
  5. Usa `FOUND` y `RAISE NOTICE`.
- **Errores:**
  - SQLSTATE '23503': Línea no existe.
  - Otros: ROLLBACK y mensaje descriptivo.
- **Comandos especiales:**
  - `COALESCE`, `FOUND`, `RAISE NOTICE`, `ROLLBACK`.

### fun_update_sublinea

**Propósito:** Actualiza la información de una sublínea existente, permitiendo cambiar nombre y estado activo.

- **Parámetros:**
  - `wid_categoria`, `wid_linea`, `wid_sublinea`: Identificadores (obligatorios).
  - `wnom_sublinea`: Nuevo nombre (obligatorio).
  - `wind_activo`: Nuevo estado (opcional).
  - `wusr_operacion`: Usuario que realiza la operación.
- **Salida:** Mensaje de éxito o error.
- **Lógica:**
  1. Valida todos los identificadores y nombre.
  2. Actualiza usando `COALESCE` para el estado.
  3. Usa `FOUND` y `RAISE NOTICE`.
- **Errores:**
  - Cualquier excepción: ROLLBACK y mensaje descriptivo.
- **Comandos especiales:**
  - `COALESCE`, `FOUND`, `RAISE NOTICE`, `ROLLBACK`.

### fun_deactivate_sublinea

**Propósito:** Desactiva una sublínea (eliminación lógica) y desactiva en cascada todos los productos y comentarios asociados.

- **Parámetros:**
  - `wid_categoria`, `wid_linea`, `wid_sublinea`: Identificadores.
  - `wusr_operacion`: Usuario que realiza la operación.
- **Salida:** Mensaje detallado con cantidad de elementos desactivados.
- **Lógica:**
  1. Desactiva la sublínea y obtiene cantidad con `GET DIAGNOSTICS`.
  2. Desactiva todos los productos y comentarios asociados, usando también `GET DIAGNOSTICS` para contar afectados.
  3. Retorna mensaje con totales.
- **Errores:**
  - Cualquier excepción: Mensaje descriptivo.
- **Comandos especiales:**
  - `GET DIAGNOSTICS`: Obtiene cantidad de filas afectadas.
  - `FORMAT`: Formatea el mensaje de salida.
  - `RAISE NOTICE` (si aplica), manejo de errores con `EXCEPTION`.

---

## 20. Funciones de la carpeta `tab_descuentos_usuarios`

### fun_validar_descuento_aplicable

**Propósito:** Valida si un descuento específico puede ser aplicado a un usuario, considerando todas las restricciones y condiciones configuradas. Soporta usuarios registrados y anónimos.

- **Parámetros:**
  - `p_id_descuento`: ID del descuento a validar.
  - `p_id_usuario`: ID del usuario (NULL para anónimos).
  - `p_codigo_ingresado`: Código de cupón ingresado (opcional).
  - `p_usr_insert`: Usuario que realiza la validación (opcional, auditoría).
- **Salida:** BOOLEAN (TRUE si es aplicable, FALSE si no lo es).
- **Lógica:**
  1. Verifica existencia y estado activo del descuento.
  2. Valida vigencia de fechas.
  3. Valida código de cupón si es requerido.
  4. Valida límites de uso total y por usuario (solo registrados).
  5. Valida restricciones de días y horarios.
  6. Valida condiciones de primera compra y cumpleaños (solo registrados).
  7. Para usuarios anónimos, omite validaciones que requieren historial.
- **Comandos especiales:**
  - `COALESCE`: Para valores por defecto.
  - `EXISTS`: Para verificar existencia de registros.
  - `CASE`, `POSITION`, `EXTRACT`: Para lógica de días y fechas.
- **Errores:**
  - Si alguna validación falla, retorna FALSE.

### fun_registrar_uso_descuento

**Propósito:** Registra el uso de un descuento por un usuario, manteniendo contadores individuales y totales.

- **Parámetros:**
  - `p_id_descuento`: ID del descuento utilizado.
  - `p_id_usuario`: ID del usuario.
  - `p_usr_operacion`: Usuario que realiza la operación.
- **Salida:** BOOLEAN (TRUE si se registró, FALSE si hubo error).
- **Lógica:**
  1. Verifica si ya existe registro de uso para el usuario y descuento.
  2. Si existe, incrementa el contador y actualiza fecha.
  3. Si no existe, crea nuevo registro con contador en 1.
  4. Actualiza contador total de usos del descuento.
  5. Actualiza timestamp de modificación.
- **Comandos especiales:**
  - `EXISTS`: Para verificar existencia de registro.
  - `COALESCE`: Para valores por defecto.
  - `NOW()`: Para timestamp.
- **Errores:**
  - Cualquier excepción: retorna FALSE.

---

## 21. Funciones de la carpeta `tab_marcas`

### fun_insert_marca

**Propósito:** Inserta una nueva marca en el sistema, generando el ID automáticamente.

- **Parámetros:**
  - `wnom_marca`: Nombre de la marca (obligatorio, mínimo 1 carácter).
  - `wusr_operacion`: Usuario que realiza la operación (auditoría).
- **Salida:** Mensaje de éxito o error.
- **Lógica:**
  1. Valida nombre y usuario.
  2. Genera ID con `COALESCE(MAX(...), 0) + 1`.
  3. Inserta la marca.
  4. Usa `FOUND` y `RAISE NOTICE`.
- **Errores:**
  - Cualquier excepción: ROLLBACK y mensaje descriptivo.
- **Comandos especiales:**
  - `COALESCE`, `FOUND`, `RAISE NOTICE`, `ROLLBACK`.

### fun_update_marca

**Propósito:** Actualiza la información de una marca existente, permitiendo cambiar nombre y estado activo.

- **Parámetros:**
  - `wid_marca`: ID de la marca.
  - `wnom_marca`: Nuevo nombre (obligatorio).
  - `wind_activo`: Nuevo estado (opcional).
  - `wusr_operacion`: Usuario que realiza la operación.
- **Salida:** Mensaje de éxito o error.
- **Lógica:**
  1. Valida nombre y usuario.
  2. Actualiza usando `COALESCE` para el estado.
  3. Usa `FOUND` y `RAISE NOTICE`.
- **Errores:**
  - Cualquier excepción: ROLLBACK y mensaje descriptivo.
- **Comandos especiales:**
  - `COALESCE`, `FOUND`, `RAISE NOTICE`, `ROLLBACK`.

### fun_deactivate_marca

**Propósito:** Desactiva una marca (eliminación lógica, no física).

- **Parámetros:**
  - `wid_marca`: ID de la marca.
  - `wusr_operacion`: Usuario que realiza la operación.
- **Salida:** Mensaje de éxito o error.
- **Lógica:**
  1. Valida usuario.
  2. Cambia estado a inactivo solo si está activa.
  3. Usa `FOUND` y `RAISE NOTICE`.
- **Errores:**
  - Cualquier excepción: ROLLBACK y mensaje descriptivo.
- **Comandos especiales:**
  - `FOUND`, `RAISE NOTICE`, `ROLLBACK`.

---

## 22. Funciones de la carpeta `tab_movimientos_puntos`

Actualmente, la carpeta no contiene funciones implementadas para documentar. Si en el futuro se agregan funciones, se deberá actualizar esta sección.

---

## 23. Funciones de la carpeta `tab_favoritos`

### fun_insert_favorito

**Propósito:** Agrega un producto a la lista de favoritos de un usuario, usando la jerarquía completa de producto (categoría, línea, sublínea, producto).

- **Parámetros:**
  - `wid_usuario`: ID del usuario (obligatorio).
  - `wid_categoria_producto`: ID de la categoría del producto (obligatorio).
  - `wid_linea_producto`: ID de la línea del producto (obligatorio).
  - `wid_sublinea_producto`: ID de la sublínea del producto (obligatorio).
  - `wid_producto`: ID del producto (obligatorio).
  - `wusr_operacion`: Usuario que realiza la operación (auditoría).
- **Salida:** Mensaje de éxito o error.
- **Lógica:**
  1. Valida que todos los parámetros sean obligatorios.
  2. Inserta el producto en favoritos del usuario.
  3. Maneja duplicados y referencias inválidas.
- **Errores:**
  - `unique_violation`: El producto ya está en favoritos.
  - `foreign_key_violation`: Usuario o producto no existe.
- **Comandos especiales:**
  - `unique_violation`, `foreign_key_violation` en el bloque EXCEPTION.

### fun_delete_favorito

**Propósito:** Elimina un producto específico de la lista de favoritos de un usuario (eliminación física, no lógica).

- **Parámetros:**
  - `wid_usuario`: ID del usuario.
  - `wid_categoria_producto`: ID de la categoría del producto.
  - `wid_linea_producto`: ID de la línea del producto.
  - `wid_sublinea_producto`: ID de la sublínea del producto.
  - `wid_producto`: ID del producto.
- **Salida:** Mensaje de éxito o error.
- **Lógica:**
  1. Elimina el favorito usando todos los identificadores.
  2. Usa `FOUND` para verificar si se eliminó algún registro.
  3. Retorna mensaje de confirmación o error.
- **Comandos especiales:**
  - `FOUND`, `RAISE NOTICE`.

### fun_select_favoritos_usuario_con_detalles

**Propósito:** Obtiene la lista completa de productos favoritos de un usuario, con detalles del producto y ordenados por fecha de agregado más reciente.

- **Parámetros:**
  - `p_id_usuario`: ID del usuario (obligatorio).
- **Salida:** Tabla con los favoritos del usuario, incluyendo:
  - `id_usuario`, `id_categoria_producto`, `id_linea_producto`, `id_sublinea_producto`, `id_producto`, `fec_insert`, `nom_producto`, `img_producto`, `val_precio`.
- **Lógica:**
  1. Busca todos los favoritos del usuario.
  2. Une con la tabla de productos para obtener detalles.
  3. Ordena por fecha de agregado descendente.
- **Comandos especiales:**
  - Uso de `JOIN` para obtener detalles del producto.

---

## Vistas del sistema

### `vw_descuentos_canjeables`

- **Propósito:** Exponer los descuentos canjeables por puntos, listos para consumo por UI/API.
- **Contenido clave:** `id_descuento`, `nom_descuento`, `costo_puntos`, `vigencia`, `estado`, `aplica_a`, `valor_descuento`, `tipo_calculo`.
- **Notas:** Optimiza consultas de frontend para catálogos de canje.

### `vw_resumen_puntos_usuario`

- **Propósito:** Resumen por usuario de puntos totales, canjeados, disponibles y métricas auxiliares.
- **Contenido clave:** `id_usuario`, `puntos_totales_ganados`, `puntos_totales_canjeados`, `puntos_disponibles`, `ultima_actualizacion`.
- **Notas:** Útil para paneles de fidelización y verificación rápida de saldo.

### `vw_resumen_ventas_categoria`

- **Propósito:** Agregados de ventas por categoría para reportes y dashboards.
- **Contenido clave:** `id_categoria`, `nom_categoria`, `total_ordenes`, `unidades_vendidas`, `ingresos`, `ventas_mes_actual`, `ventas_mes_anterior`, `participacion`, `mejor_mes`.
- **Notas:** Se nutre de `tab_estadisticas_productos` y tablas de órdenes.

### `vw_top_productos_vendidos`

- **Propósito:** Ranking de productos más vendidos para destacar en tienda y análisis.
- **Contenido clave:** Identificadores de producto, `nom_producto`, `unidades_vendidas`, `ingresos`, `ultima_venta`.
- **Notas:** Útil para listas destacadas y recomendaciones.

---

## Triggers en carpeta `triggers/`

### `trg_acumular_puntos_orden.sql`

- **Evento:** AFTER UPDATE ON `tab_ordenes` WHEN (OLD.ind_estado != 2 AND NEW.ind_estado = 2).
- **Acción:** Dispara acumulación de puntos del usuario por compra (flujo de fidelización).
- **Motivo:** Automatiza beneficios al confirmarse el pago.

### `trg_automatizar_pagos_descuentos.sql`

- **Evento:** AFTER UPDATE ON `tab_pagos` WHEN (NEW.status = 'approved').
- **Acción:** Marca orden como pagada y sincroniza procesos dependientes (stock, estadísticas, limpieza de carrito).
- **Motivo:** Integración reactiva con proveedor de pagos.

### `trg_actualizar_estadisticas_ventas.sql`

- **Evento:** AFTER INSERT/UPDATE/DELETE en tablas de órdenes/productos de orden.
- **Acción:** Actualiza métricas de `tab_estadisticas_productos` y agregados relacionados.
- **Motivo:** Mantener KPIs de ventas consistentes sin tareas manuales.

### `trg_actualizar_stock_compra_proveedor.sql`

- **Evento:** AFTER UPDATE OF `ind_estado_producto` ON `tab_orden_compra_proveedor` WHEN (NEW.ind_estado_producto = 3).
- **Acción:** Ajusta stock al recibir mercancía de proveedor y registra movimiento de inventario.
- **Motivo:** Sincronización de inventario con compras.

---

## Glosario (ampliación)

- **TG_OP / TG_TABLE_NAME:** Variables especiales de triggers. `TG_OP` indica la operación (INSERT/UPDATE/DELETE); `TG_TABLE_NAME` la tabla afectada.
- **json_agg(expresión):** Agrega filas en un array JSON.
- **json_array_elements(json):** Descompone un array JSON en filas individuales (set-returning function).
- **LEAST(a, b, ...):** Devuelve el menor valor, útil para limitar descuentos a un máximo.
- **AGE(fecha1, fecha2):** Diferencia entre fechas como intervalo (útil para periodos).
- **ARRAY[...] / array_to_json(array):** Construcción de arrays y conversión a JSON para respuestas estructuradas.

---
