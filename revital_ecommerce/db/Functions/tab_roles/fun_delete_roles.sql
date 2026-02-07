/*
 * FUNCIÓN: fun_delete_roles
 * 
 * DESCRIPCIÓN: Elimina permanentemente un rol del sistema.
 *              Realiza eliminación física del registro.
 * 
 * PARÁMETROS:
 *   - wid_rol: ID del rol a eliminar (obligatorio, > 0)
 *   - wusr_operacion: Usuario que realiza la operación para auditoría
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar ID del rol
 *   2. Validar usuario operación para auditoría
 *   3. Eliminar rol por ID
 *   4. Confirmar éxito de la eliminación
 * 
 * NOTA: Eliminación física del registro, no lógica
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_delete_roles(
    wid_rol tab_roles.id_rol%TYPE,
    wusr_operacion VARCHAR
) RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: ID del rol
        IF wid_rol IS NULL OR wid_rol = 0 THEN
            RETURN 'Error: El ID del rol es obligatorio y debe ser mayor a 0.';
        END IF;

        -- VALIDACIÓN 2: Usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion = '' THEN
            RETURN 'Error: El usuario que realiza la operación es obligatorio para auditoría.';
        END IF;

        -- ELIMINACIÓN: Remover rol del sistema
        DELETE FROM tab_roles 
        WHERE id_rol = wid_rol;                     -- Eliminar por ID específico

        -- VERIFICACIÓN: Confirmar que se eliminó el rol
        IF FOUND THEN
            RAISE NOTICE 'Rol eliminado exitosamente por usuario %: %', wusr_operacion, wid_rol;
            RETURN 'Rol eliminado correctamente';
        ELSE
            RAISE NOTICE 'Error: Rol no encontrado';
            RETURN 'Error: Rol no encontrado o ya fue eliminado';
        END IF;
    END;
$$
LANGUAGE plpgsql;
