-- =============================================================================
-- Eliminar un usuario por email (y todos sus datos relacionados)
-- =============================================================================
-- Uso: Cambia el email abajo y ejecuta el script completo en psql.
-- Orden: se borran primero las tablas hijas para no violar FKs.
--
-- IMPORTANTE: NO ejecutar este script mientras un usuario tenga un pago en curso
-- con Wompi. Si el carrito se borra antes de que confirm-checkout cree la orden,
-- el pago quedará huérfano y no se generará la orden. Ejecutar solo cuando no
-- haya checkouts activos (antes de iniciar pruebas, no durante).
-- =============================================================================

-- Cambia este valor por el email del usuario a eliminar
\set email_usuario '''ahernandezlara030904@gmail.com'''

-- Opcional: ver el id_usuario que se va a borrar
-- SELECT id_usuario, nom_usuario, ape_usuario, email_usuario FROM tab_usuarios WHERE email_usuario = :email_usuario;

BEGIN;

-- 1. Direcciones del usuario (FK ON DELETE SET NULL pero columna NOT NULL → borrar antes)
DELETE FROM tab_direcciones_usuario
WHERE id_usuario = (SELECT id_usuario FROM tab_usuarios WHERE email_usuario = :email_usuario);

-- 2. Métodos de pago
DELETE FROM tab_metodos_pago_usuario
WHERE id_usuario = (SELECT id_usuario FROM tab_usuarios WHERE email_usuario = :email_usuario);

-- 3. Usos de descuentos por usuario
DELETE FROM tab_descuentos_usuarios
WHERE id_usuario = (SELECT id_usuario FROM tab_usuarios WHERE email_usuario = :email_usuario);

-- 4. Favoritos
DELETE FROM tab_favoritos
WHERE id_usuario = (SELECT id_usuario FROM tab_usuarios WHERE email_usuario = :email_usuario);

-- 5. Movimientos de puntos (referencia a tab_ordenes; borrar por usuario)
DELETE FROM tab_movimientos_puntos
WHERE id_usuario = (SELECT id_usuario FROM tab_usuarios WHERE email_usuario = :email_usuario);

-- 6. Canjes de puntos por descuentos
DELETE FROM tab_canjes_puntos_descuentos
WHERE id_usuario = (SELECT id_usuario FROM tab_usuarios WHERE email_usuario = :email_usuario);

-- 7. Comentarios/reseñas (referencia a tab_ordenes y tab_products)
DELETE FROM tab_comentarios
WHERE id_usuario = (SELECT id_usuario FROM tab_usuarios WHERE email_usuario = :email_usuario);

-- 8. Movimientos de inventario que apuntan a ítems de órdenes del usuario (suelta la FK para poder borrar tab_orden_productos)
UPDATE tab_movimientos_inventario
SET id_orden_usuario_detalle = NULL
WHERE id_orden_usuario_detalle IN (
  SELECT op.id_orden_producto
  FROM tab_orden_productos op
  JOIN tab_ordenes o ON o.id_orden = op.id_orden
  WHERE o.id_usuario = (SELECT id_usuario FROM tab_usuarios WHERE email_usuario = :email_usuario)
);

-- 9. Productos de las órdenes del usuario
DELETE FROM tab_orden_productos
WHERE id_orden IN (SELECT id_orden FROM tab_ordenes WHERE id_usuario = (SELECT id_usuario FROM tab_usuarios WHERE email_usuario = :email_usuario));

-- 10. Pagos de las órdenes del usuario
DELETE FROM tab_pagos
WHERE id_orden IN (SELECT id_orden FROM tab_ordenes WHERE id_usuario = (SELECT id_usuario FROM tab_usuarios WHERE email_usuario = :email_usuario));

-- 11. Órdenes del usuario
DELETE FROM tab_ordenes
WHERE id_usuario = (SELECT id_usuario FROM tab_usuarios WHERE email_usuario = :email_usuario);

-- 12. Ítems del carrito del usuario (tab_carrito_productos → tab_carritos)
DELETE FROM tab_carrito_productos
WHERE id_carrito IN (SELECT id_carrito FROM tab_carritos WHERE id_usuario = (SELECT id_usuario FROM tab_usuarios WHERE email_usuario = :email_usuario));

-- 13. Carritos del usuario
DELETE FROM tab_carritos
WHERE id_usuario = (SELECT id_usuario FROM tab_usuarios WHERE email_usuario = :email_usuario);

-- 14. Puntos del usuario
DELETE FROM tab_puntos_usuario
WHERE id_usuario = (SELECT id_usuario FROM tab_usuarios WHERE email_usuario = :email_usuario);

-- 15. Usuario
DELETE FROM tab_usuarios
WHERE email_usuario = :email_usuario;

COMMIT;

-- Resumen: si quieres ver cuántas filas se borraron, ejecuta antes/después con SELECT COUNT(*) en cada tabla,
-- o revisa con: SELECT * FROM tab_usuarios WHERE email_usuario = :email_usuario; (debe devolver 0 filas).
