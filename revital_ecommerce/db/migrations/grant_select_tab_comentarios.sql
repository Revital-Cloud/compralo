/*
 * Migración: Permisos en tab_comentarios (y tab_usuarios) para el usuario de la app
 *
 * - SELECT: para leer reseñas (testimonials, comentarios por producto).
 * - INSERT: para guardar nuevas reseñas desde POST /api/comentaries.
 *
 * fun_insert_comentarios hace INSERT INTO tab_comentarios; el usuario de la app
 * debe tener INSERT para que las reseñas se guarden.
 *
 * Ejecutar como superusuario (postgres) o como propietario del esquema.
 * Reemplazar revital_ecommerce_user por el usuario que usa tu DATABASE_URL
 * si es distinto.
 */

GRANT SELECT, INSERT ON tab_comentarios TO revital_ecommerce_user;
GRANT SELECT ON tab_usuarios TO revital_ecommerce_user;
