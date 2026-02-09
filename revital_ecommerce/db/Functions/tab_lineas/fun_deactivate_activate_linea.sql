/*
 * FUNCIÓN: fun_deactivate_activate_linea 
 * 
 * DESCRIPCIÓN: Activa o desactiva una línea del sistema mediante eliminación lógica
 *              y automáticamente activa/desactiva todas las sublíneas y productos
 *              que dependen de esta línea según el estado solicitado.
 * 
 * PARÁMETROS:
 *   - wid_categoria: ID de la categoría de la línea (obligatorio)
 *   - wid_linea: ID de la línea a activar/desactivar (obligatorio)
 *   - wusr_operacion: Usuario que realiza la operación (obligatorio, para auditoría)
 *   - wactivar: BOOLEAN - TRUE para activar, FALSE para desactivar (obligatorio)
 * 
 * RETORNA: VARCHAR - Mensaje detallado con cantidad de elementos afectados
 * 
 * LÓGICA DE CASCADA:
 *   Si wactivar = FALSE (desactivar):
 *   1. Desactivar la línea principal
 *   2. Desactivar TODAS las sublíneas de esa línea
 *   3. Desactivar TODOS los productos de esa línea
 *   4. Desactivar TODOS los comentarios de esa línea
 * 
 *   Si wactivar = TRUE (activar):
 *   1. Activar la línea principal
 *   2. Activar TODAS las sublíneas de esa línea
 *   3. Activar TODOS los productos de esa línea
 *   4. Activar TODOS los comentarios de esa línea
 * 
 * VALIDACIONES:
 *   - Verifica que la línea existe
 *   - Verifica que el estado actual es diferente al solicitado
 *   - Manejo de errores con EXCEPTION
 *   - Auditoría completa con usuario que ejecuta la operación
 * 
 * EJEMPLO RETORNO (desactivar): "Línea desactivada exitosamente. Se desactivaron: 5 sublíneas, 23 productos, 12 comentarios"
 * EJEMPLO RETORNO (activar): "Línea activada exitosamente. Se activaron: 5 sublíneas, 23 productos, 12 comentarios"
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_deactivate_activate_linea(
    wid_categoria tab_lineas.id_categoria%TYPE,
    wid_linea tab_lineas.id_linea%TYPE,
    wusr_operacion tab_lineas.usr_update%TYPE,
    wactivar BOOLEAN
) RETURNS VARCHAR AS $$
DECLARE
    v_count_sublineas INT;
    v_count_productos INT;
    v_count_comentarios INT;
    v_linea_actualizada INT;
    v_estado_actual BOOLEAN;
    v_accion TEXT;
BEGIN
    -- Obtener el estado actual de la línea
    SELECT ind_activo INTO v_estado_actual
    FROM tab_lineas
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea;
    
    -- VALIDACIÓN: Verificar que la línea existe
    IF v_estado_actual IS NULL THEN
        RETURN 'Error: Línea no encontrada';
    END IF;
    
    -- VALIDACIÓN: Verificar que el estado es diferente al solicitado
    IF v_estado_actual = wactivar THEN
        RETURN FORMAT('Error: La línea ya está %s', 
                     CASE WHEN wactivar THEN 'activa' ELSE 'inactiva' END);
    END IF;
    
    -- Determinar el texto de la acción
    v_accion := CASE WHEN wactivar THEN 'activada' ELSE 'desactivada' END;
    
    -- PASO 1: Activar/Desactivar la línea
    UPDATE tab_lineas SET 
        ind_activo = wactivar,
        usr_update = wusr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea;
    
    GET DIAGNOSTICS v_linea_actualizada = ROW_COUNT;
    
    -- VALIDACIÓN: Verificar que la línea fue actualizada
    IF v_linea_actualizada = 0 THEN
        RETURN 'Error: No se pudo actualizar la línea';
    END IF;

    -- PASO 2: Activar/Desactivar todas las sublíneas de esta línea
    UPDATE tab_sublineas SET 
        ind_activo = wactivar,
        usr_update = wusr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND ind_activo != wactivar;
    
    GET DIAGNOSTICS v_count_sublineas = ROW_COUNT;

    -- PASO 3: Activar/Desactivar todos los productos de esta línea
    UPDATE tab_productos SET 
        ind_activo = wactivar,
        usr_update = wusr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND ind_activo != wactivar;

    GET DIAGNOSTICS v_count_productos = ROW_COUNT;

    -- PASO 4: Activar/Desactivar todos los comentarios de esta línea
    UPDATE tab_comentarios SET 
        ind_activo = wactivar,
        usr_update = wusr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND ind_activo != wactivar;

    GET DIAGNOSTICS v_count_comentarios = ROW_COUNT;

    -- RESULTADO: Mensaje detallado con totales
    RETURN FORMAT('Línea %s exitosamente. Se %s: %s sublíneas, %s productos, %s comentarios', 
                v_accion,
                CASE WHEN wactivar THEN 'activaron' ELSE 'desactivaron' END,
                v_count_sublineas, 
                v_count_productos, 
                v_count_comentarios);

-- MANEJO DE ERRORES: Capturar excepciones inesperadas
EXCEPTION 
    WHEN OTHERS THEN
        RETURN 'Error inesperado al cambiar estado de línea: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Mantener compatibilidad con el nombre anterior
CREATE OR REPLACE FUNCTION fun_deactivate_linea(
    wid_categoria tab_lineas.id_categoria%TYPE,
    wid_linea tab_lineas.id_linea%TYPE,
    wusr_operacion tab_lineas.usr_update%TYPE
) RETURNS VARCHAR AS $$
BEGIN
    RETURN fun_deactivate_activate_linea(wid_categoria, wid_linea, wusr_operacion, FALSE);
END;
$$ LANGUAGE plpgsql;

