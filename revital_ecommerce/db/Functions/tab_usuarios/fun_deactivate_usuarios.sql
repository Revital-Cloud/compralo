/*
 * FUNCIÓN: fun_deactivate_usuarios
 * 
 * DESCRIPCIÓN: Desactiva un usuario del sistema mediante eliminación lógica.
 *              No elimina físicamente el registro, solo cambia su estado a inactivo.
 * 
 * PARÁMETROS:
 *   - wid_usuario: ID del usuario a desactivar (obligatorio)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Buscar usuario activo por ID
 *   2. Cambiar estado a inactivo (FALSE)
 *   3. Actualizar timestamp de modificación
 *   4. Confirmar éxito de la operación
 * 
 * MANEJO DE ERRORES:
 *   - Captura cualquier excepción y realiza ROLLBACK
 *   - Retorna mensaje de error descriptivo
 * 
 * NOTA: Solo afecta usuarios que estén actualmente activos
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_deactivate_usuarios(
    wid_usuario tab_usuarios.id_usuario%TYPE,
    wusr_operacion tab_usuarios.usr_update%TYPE
) RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: ID de usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
            RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
        END IF;

        -- DESACTIVACIÓN: Cambiar estado del usuario a inactivo (eliminación lógica)
        UPDATE tab_usuarios SET 
            ind_activo = FALSE,             -- Marcar como inactivo
            usr_update = wusr_operacion,    -- ID del usuario que realiza la desactivación
            fec_update = NOW()              -- Actualizar timestamp
        WHERE id_usuario = wid_usuario AND ind_activo = TRUE;  -- Solo si está activo actualmente
        
        -- VERIFICACIÓN: Confirmar que la desactivación fue exitosa
        IF FOUND THEN
            RAISE NOTICE 'Usuario desactivado exitosamente - ID: % por usuario ID: %', wid_usuario, wusr_operacion;
            RETURN 'Usuario desactivado correctamente';
        ELSE
            RAISE NOTICE 'Usuario no encontrado o ya estaba inactivo - ID: %', wid_usuario;
            RETURN 'Error: Usuario no encontrado o ya estaba inactivo';
        END IF;

    -- MANEJO DE ERRORES: Capturar excepciones inesperadas
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 'Error inesperado: ' || SQLERRM;
            ROLLBACK;
    END;
$$
LANGUAGE plpgsql;

-- Ejemplo de uso corregido
SELECT fun_deactivate_usuarios(1, 1234567890);


