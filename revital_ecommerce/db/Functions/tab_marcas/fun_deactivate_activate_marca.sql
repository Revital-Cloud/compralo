/*
 * FUNCIÓN: fun_deactivate_activate_marca 
 * 
 * DESCRIPCIÓN: Activa o desactiva una marca del sistema mediante eliminación lógica.
 *              No elimina físicamente el registro, solo cambia su estado según el parámetro.
 * 
 * PARÁMETROS:
 *   - wid_marca: ID de la marca a activar/desactivar (obligatorio)
 *   - wusr_operacion: ID del usuario que realiza la operación (obligatorio, DECIMAL)
 *   - wactivar: BOOLEAN - TRUE para activar, FALSE para desactivar (obligatorio)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar ID de usuario operación para auditoría
 *   2. Buscar marca por ID
 *   3. Verificar que el estado actual es diferente al solicitado
 *   4. Cambiar estado según wactivar (TRUE/FALSE)
 *   5. Actualizar timestamp de modificación
 *   6. Confirmar éxito de la operación
 * 
 * MANEJO DE ERRORES:
 *   - Captura cualquier excepción y realiza ROLLBACK
 *   - Retorna mensaje de error descriptivo
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_deactivate_activate_marca(
    wid_marca tab_marcas.id_marca%TYPE,
    wusr_operacion tab_marcas.usr_update%TYPE,
    wactivar BOOLEAN
) RETURNS VARCHAR AS
$$
DECLARE
    v_estado_actual BOOLEAN;
    v_accion TEXT;
BEGIN
    -- VALIDACIÓN 1: ID de usuario operación para auditoría
    IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
        RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
    END IF;

    -- Obtener el estado actual de la marca
    SELECT ind_activo INTO v_estado_actual
    FROM tab_marcas
    WHERE id_marca = wid_marca;
    
    -- VALIDACIÓN: Verificar que la marca existe
    IF v_estado_actual IS NULL THEN
        RETURN 'Error: Marca no encontrada';
    END IF;
    
    -- VALIDACIÓN: Verificar que el estado es diferente al solicitado
    IF v_estado_actual = wactivar THEN
        RETURN FORMAT('Error: La marca ya está %s', 
                     CASE WHEN wactivar THEN 'activa' ELSE 'inactiva' END);
    END IF;
    
    -- Determinar el texto de la acción
    v_accion := CASE WHEN wactivar THEN 'activada' ELSE 'desactivada' END;

    -- ACTIVACIÓN/DESACTIVACIÓN: Cambiar estado de la marca según wactivar
    UPDATE tab_marcas SET 
        ind_activo = wactivar,
        usr_update = wusr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_marca = wid_marca;
    
    -- VERIFICACIÓN: Confirmar que la operación fue exitosa
    IF FOUND THEN
        RAISE NOTICE 'Marca %s exitosamente - ID: % por usuario ID: %', v_accion, wid_marca, wusr_operacion;
        RETURN FORMAT('Marca %s correctamente', v_accion);
    ELSE
        RAISE NOTICE 'No se pudo actualizar la marca - ID: %', wid_marca;
        RETURN 'Error: No se pudo actualizar la marca';
    END IF;

    -- MANEJO DE ERRORES: Capturar excepciones inesperadas
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 'Error inesperado: ' || SQLERRM;
            ROLLBACK;
END;
$$
LANGUAGE plpgsql;

-- Mantener compatibilidad con el nombre anterior
CREATE OR REPLACE FUNCTION fun_deactivate_marca(
    wid_marca tab_marcas.id_marca%TYPE,
    wusr_operacion tab_marcas.usr_update%TYPE
) RETURNS VARCHAR AS $$
BEGIN
    RETURN fun_deactivate_activate_marca(wid_marca, wusr_operacion, FALSE);
END;
$$ LANGUAGE plpgsql;

