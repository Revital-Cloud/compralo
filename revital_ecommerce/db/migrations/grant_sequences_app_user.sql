/*
 * Migración: Permisos sobre secuencias para el usuario de la app
 *
 * Las tablas con columnas SERIAL/IDENTITY usan secuencias (ej. tab_carritos_id_carrito_seq).
 * Si la app hace INSERT (directo o vía función), el usuario necesita USAGE en esas secuencias.
 *
 * Error típico sin este grant:
 *   permission denied for sequence tab_carritos_id_carrito_seq
 *
 * Ejecutar como superusuario (postgres) o como propietario de la base.
 * Reemplazar revital_ecommerce_user por el usuario que usa tu DATABASE_URL si es distinto.
 */

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO revital_ecommerce_user;

-- Opcional: que futuras secuencias creadas también tengan el permiso por defecto
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO revital_ecommerce_user;
