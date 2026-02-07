/*
 * FUNCIÓN: fun_update_roles
 * 
 * DESCRIPCIÓN: Actualiza la información de un rol existente en el sistema.
 *              Permite modificar nombre y descripción del rol.
 * 
 * PARÁMETROS:
 *   - wid_rol: ID del rol a actualizar (obligatorio)
 *   - wnom_rol: Nuevo nombre del rol (obligatorio, mínimo 3 caracteres)
 *   - wdes_rol: Nueva descripción del rol (opcional)
 *   - wusr_operacion: Usuario que realiza la operación (obligatorio)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar nombre del rol
 *   2. Validar usuario operación para auditoría
 *   3. Actualizar rol existente
 *   4. Confirmar éxito de la actualización
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_update_roles(
    wid_rol tab_roles.id_rol%TYPE,
    wnom_rol tab_roles.nom_rol%TYPE,
    wdes_rol tab_roles.des_rol%TYPE,
    wusr_operacion tab_roles.usr_update%TYPE
) RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: Nombre del rol
        IF wnom_rol IS NULL OR wnom_rol = '' OR LENGTH(TRIM(wnom_rol)) < 3 THEN
            RETURN 'Error: El nombre del rol es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 2: Usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion = '' THEN
            RETURN 'Error: El usuario que realiza la operación es obligatorio para auditoría.';
        END IF;

        -- ACTUALIZACIÓN: Modificar rol existente
        UPDATE tab_roles SET 
            nom_rol = wnom_rol,             -- Nuevo nombre del rol
            des_rol = wdes_rol,             -- Nueva descripción del rol
            usr_update = wusr_operacion,    -- Usuario que actualiza
            fec_update = NOW()              -- Timestamp de actualización
        WHERE id_rol = wid_rol;

        -- VERIFICACIÓN: Confirmar que la actualización fue exitosa
        IF FOUND THEN
            RAISE NOTICE 'Rol actualizado exitosamente: %', wnom_rol;
            RETURN 'Rol actualizado correctamente';
        ELSE
            RAISE NOTICE 'Error: Rol no encontrado';
            RETURN 'Error: Rol no encontrado o no se pudo actualizar';
        END IF;
    END;
$$
LANGUAGE plpgsql;
