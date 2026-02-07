/*
 * Migración: Opciones elegidas por el cliente (genérico)
 * Guarda en carrito y orden un JSON con las opciones que el usuario eligió
 * (ej. {"color": "rojo", "talla": "39"} para ropa, {"capacidad": "128GB"} para electrónica).
 *
 * Ejecutar: psql -U usuario -d nombre_bd -f add_cart_order_color_talla.sql
 *
 * DESPUÉS ejecutar estas funciones (misma BD) para que las opciones se guarden y se copien a la orden:
 *   psql -U usuario -d nombre_bd -f Functions/tab_carrito_productos/fun_agregar_producto_carrito.sql
 *   psql -U usuario -d nombre_bd -f Functions/tab_ordenes/fun_crear_orden_desde_carrito.sql
 * Sin la segunda, las órdenes nuevas no tendrán color/talla en el detalle.
 */

-- 1. tab_carrito_productos: columna opciones_elegidas JSONB
ALTER TABLE tab_carrito_productos
  ADD COLUMN IF NOT EXISTS opciones_elegidas JSONB NOT NULL DEFAULT '{}';

-- Quitar restricciones UNIQUE antiguas (antes de tocar columnas)
ALTER TABLE tab_carrito_productos DROP CONSTRAINT IF EXISTS uq_carrito_producto;
ALTER TABLE tab_carrito_productos DROP CONSTRAINT IF EXISTS uq_carrito_producto_opciones;

-- Migrar datos si existían columnas des_color/des_talla (compatibilidad)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tab_carrito_productos' AND column_name = 'des_color'
  ) THEN
    UPDATE tab_carrito_productos
    SET opciones_elegidas = jsonb_build_object(
      'color', COALESCE(TRIM(des_color), ''),
      'talla', COALESCE(TRIM(des_talla), '')
    );
    ALTER TABLE tab_carrito_productos DROP COLUMN IF EXISTS des_color;
    ALTER TABLE tab_carrito_productos DROP COLUMN IF EXISTS des_talla;
  END IF;
END $$;

-- Mismo producto con distintas opciones = líneas distintas
ALTER TABLE tab_carrito_productos
  ADD CONSTRAINT uq_carrito_producto_opciones UNIQUE (
    id_carrito,
    id_categoria_producto,
    id_linea_producto,
    id_sublinea_producto,
    id_producto,
    opciones_elegidas
  );

-- 2. tab_orden_productos: opciones_elegidas para historial de la orden
ALTER TABLE tab_orden_productos
  ADD COLUMN IF NOT EXISTS opciones_elegidas JSONB NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tab_orden_productos' AND column_name = 'des_color'
  ) THEN
    UPDATE tab_orden_productos
    SET opciones_elegidas = jsonb_build_object(
      'color', COALESCE(TRIM(des_color), ''),
      'talla', COALESCE(TRIM(des_talla), '')
    )
    WHERE opciones_elegidas = '{}' OR opciones_elegidas IS NULL;
    ALTER TABLE tab_orden_productos DROP COLUMN IF EXISTS des_color;
    ALTER TABLE tab_orden_productos DROP COLUMN IF EXISTS des_talla;
  END IF;
END $$;
