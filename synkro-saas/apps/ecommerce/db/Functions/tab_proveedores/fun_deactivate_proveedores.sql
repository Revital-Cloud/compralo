/*
 * FUNCIÓN: fun_deactivate_proveedores
 * 
 * DESCRIPCIÓN: Desactiva un proveedor del sistema mediante eliminación lógica.
 *              No elimina físicamente el registro, solo cambia su estado a inactivo.
 * 
 * PARÁMETROS:
 *   - wid_proveedor: ID del proveedor a desactivar (obligatorio)
 *   - wusr_operacion: Usuario que realiza la operación (obligatorio)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar usuario operación para auditoría
 *   2. Buscar proveedor activo por ID
 *   3. Cambiar estado a inactivo (FALSE)
 *   4. Actualizar timestamp de modificación
 *   5. Confirmar éxito de la operación
 * 
 * MANEJO DE ERRORES:
 *   - Captura cualquier excepción y realiza ROLLBACK
 *   - Retorna mensaje de error descriptivo
 * 
 * NOTA: Solo afecta proveedores que estén actualmente activos
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_deactivate_proveedores(
    wid_proveedor tab_proveedores.id_proveedor%TYPE,
    wusr_operacion tab_proveedores.usr_update%TYPE
) RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: ID de usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
            RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
        END IF;

        -- DESACTIVACIÓN: Cambiar estado del proveedor a inactivo (eliminación lógica)
        UPDATE tab_proveedores SET 
            ind_activo = FALSE,             -- Marcar como inactivo
            usr_update = wusr_operacion    -- ID del usuario que realiza la desactivación
        WHERE id_proveedor = wid_proveedor AND ind_activo = TRUE;  -- Solo si está activo actualmente
        
        -- VERIFICACIÓN: Confirmar que la desactivación fue exitosa
        IF FOUND THEN
            RAISE NOTICE 'Proveedor desactivado exitosamente - ID: % por usuario ID: %', wid_proveedor, wusr_operacion;
            RETURN 'Proveedor desactivado correctamente';
        ELSE
            RAISE NOTICE 'Proveedor no encontrado o ya estaba inactivo - ID: %', wid_proveedor;
            RETURN 'Error: Proveedor no encontrado o ya estaba inactivo';
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
SELECT * FROM tab_proveedores;
SELECT fun_deactivate_proveedores(1, 1234567890);
