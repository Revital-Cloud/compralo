/*
 * FUNCIÓN: fun_activar_desactivar_descuento
 * 
 * DESCRIPCIÓN: Activa o desactiva un descuento específico del sistema manteniendo
 *              auditoría del usuario que realiza el cambio.
 * 
 * PARÁMETROS:
 *   - p_id_descuento: ID del descuento a modificar (obligatorio)
 *   - p_activar: TRUE para activar, FALSE para desactivar (obligatorio)
 *   - p_usr_update: Usuario que realiza la modificación (obligatorio)
 * 
 * RETORNA: JSON - Objeto con resultado de la operación
 *   - success: booleano indicando éxito
 *   - message: mensaje descriptivo
 *   - descuento: información del descuento (si aplica)
 * 
 * LÓGICA:
 *   1. Verificar existencia del descuento
 *   2. Obtener estado actual del descuento
 *   3. Validar si ya tiene el estado deseado
 *   4. Actualizar estado y auditoría
 *   5. Retornar resultado detallado
 * 
 * MANEJO DE ERRORES:
 *   - Captura cualquier excepción SQL
 *   - Retorna JSON con información del error
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_activar_desactivar_descuento(
    p_id_descuento tab_descuentos.id_descuento%TYPE,
    p_activar BOOLEAN,
    p_usr_update tab_descuentos.usr_update%TYPE
) RETURNS JSON AS $$
DECLARE
    v_existe BOOLEAN := FALSE;
    v_estado_actual BOOLEAN;
    v_nombre_descuento VARCHAR;
BEGIN
    -- PASO 1: Verificar que el descuento existe y obtener su estado actual
    SELECT 
        EXISTS(SELECT 1 FROM tab_descuentos WHERE id_descuento = p_id_descuento),
        ind_activo,
        nom_descuento
    INTO v_existe, v_estado_actual, v_nombre_descuento
    FROM tab_descuentos 
    WHERE id_descuento = p_id_descuento;
    
    -- VALIDACIÓN 1: Existencia del descuento
    IF NOT v_existe THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El descuento especificado no existe'
        );
    END IF;

    -- VALIDACIÓN 2: Verificar si ya tiene el estado deseado
    IF v_estado_actual = p_activar THEN
        RETURN json_build_object(
            'success', true,
            'message', CASE 
                WHEN p_activar THEN 'El descuento ya está activo'
                ELSE 'El descuento ya está inactivo'
            END,
            'descuento', json_build_object(
                'id_descuento', p_id_descuento,
                'nombre', v_nombre_descuento,
                'estado', CASE WHEN p_activar THEN 'Activo' ELSE 'Inactivo' END
            )
        );
    END IF;

    -- ACTUALIZACIÓN: Cambiar estado del descuento con auditoría
    UPDATE tab_descuentos 
    SET 
        ind_activo = p_activar,                                 -- Nuevo estado
        usr_update = p_usr_update,                              -- Usuario que modifica
        fec_update = NOW()                                      -- Timestamp de modificación
    WHERE id_descuento = p_id_descuento;

    -- RESPUESTA: Confirmar éxito con información detallada
    RETURN json_build_object(
        'success', true,
        'message', CASE 
            WHEN p_activar THEN 'Descuento activado exitosamente'
            ELSE 'Descuento desactivado exitosamente'
        END,
        'descuento', json_build_object(
            'id_descuento', p_id_descuento,
            'nombre', v_nombre_descuento,
            'estado_anterior', CASE WHEN v_estado_actual THEN 'Activo' ELSE 'Inactivo' END,
            'estado_nuevo', CASE WHEN p_activar THEN 'Activo' ELSE 'Inactivo' END
        )
    );

-- MANEJO DE ERRORES: Capturar excepciones SQL
EXCEPTION 
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error inesperado: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql; 