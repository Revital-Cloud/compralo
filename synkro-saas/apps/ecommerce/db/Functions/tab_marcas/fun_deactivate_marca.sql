/*
 * FUNCIÓN: fun_deactivate_marca
 * 
 * DESCRIPCIÓN: Desactiva una marca del sistema mediante eliminación lógica.
 *              No elimina físicamente el registro, solo cambia su estado a inactivo.
 * 
 * PARÁMETROS:
 *   - wid_marca: ID de la marca a desactivar (obligatorio)
 *   - wusr_operacion: ID del usuario que realiza la operación (obligatorio, DECIMAL)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar ID de usuario operación para auditoría
 *   2. Buscar marca activa por ID
 *   3. Cambiar estado a inactivo (FALSE)
 *   4. Actualizar timestamp de modificación
 *   5. Confirmar éxito de la operación
 * 
 * MANEJO DE ERRORES:
 *   - Captura cualquier excepción y realiza ROLLBACK
 *   - Retorna mensaje de error descriptivo
 * 
 * NOTA: Solo afecta marcas que estén actualmente activas
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_deactivate_marca(
    wid_marca tab_marcas.id_marca%TYPE,
    wusr_operacion tab_marcas.usr_update%TYPE  -- Ahora es DECIMAL(10)
) RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: ID de usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
            RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
        END IF;

        -- DESACTIVACIÓN: Cambiar estado de la marca a inactivo (eliminación lógica)
        UPDATE tab_marcas SET 
            ind_activo = FALSE,             -- Marcar como inactivo
            usr_update = wusr_operacion    -- ID del usuario que realiza la desactivación
        WHERE id_marca = wid_marca AND ind_activo = TRUE;  -- Solo si está activo actualmente
        
        -- VERIFICACIÓN: Confirmar que la desactivación fue exitosa
        IF FOUND THEN
            RAISE NOTICE 'Marca desactivada exitosamente - ID: % por usuario ID: %', wid_marca, wusr_operacion;
            RETURN 'Marca desactivada correctamente';
        ELSE
            RAISE NOTICE 'Marca no encontrada o ya estaba inactiva - ID: %', wid_marca;
            RETURN 'Error: Marca no encontrada o ya estaba inactiva';
        END IF;

    -- MANEJO DE ERRORES: Capturar excepciones inesperadas
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 'Error inesperado: ' || SQLERRM;
            ROLLBACK;
    END;
$$
LANGUAGE plpgsql;

-- Ejemplo de uso corregido (ahora con nombre de función y parámetros correctos)
SELECT fun_deactivate_marca(1, 1234567890);