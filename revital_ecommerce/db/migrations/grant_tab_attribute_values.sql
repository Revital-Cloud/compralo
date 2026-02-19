/*
 * Permisos en tab_attribute_values para el usuario de la app.
 *
 * Sin estos GRANT, la app obtiene "permission denied for table tab_attribute_values"
 * al listar/crear/actualizar/eliminar valores predefinidos de atributos.
 *
 * Ejecutar como superusuario (postgres) o como propietario del esquema.
 * Reemplazar revital_ecommerce_user por el usuario que usa tu DATABASE_URL si es distinto.
 */

GRANT SELECT, INSERT, UPDATE, DELETE ON tab_attribute_values TO revital_ecommerce_user;
