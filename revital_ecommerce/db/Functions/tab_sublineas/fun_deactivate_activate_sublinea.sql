/*
 * FUNCIÓN: fun_deactivate_activate_sublinea 
 * 
 * DESCRIPCIÓN: Activa o desactiva una sublínea del sistema mediante eliminación lógica
 *              y automáticamente activa/desactiva todos los productos que dependen
 *              de esta sublínea según el estado solicitado.
 * 
 * PARÁMETROS:
 *   - wid_categoria: ID de la categoría de la sublínea (obligatorio)
 *   - wid_linea: ID de la línea de la sublínea (obligatorio)
 *   - wid_sublinea: ID de la sublínea a activar/desactivar (obligatorio)
 *   - wusr_operacion: Usuario que realiza la operación (obligatorio, para auditoría)
 *   - wactivar: BOOLEAN - TRUE para activar, FALSE para desactivar (obligatorio)
 * 
 * RETORNA: VARCHAR - Mensaje detallado con cantidad de elementos afectados
 * 
 * LÓGICA DE CASCADA:
 *   Si wactivar = FALSE (desactivar):
 *   1. Desactivar la sublínea principal
 *   2. Desactivar TODOS los productos de esa sublínea
 *   3. Desactivar TODOS los comentarios de esa sublínea
 * 
 *   Si wactivar = TRUE (activar):
 *   1. Activar la sublínea principal
 *   2. Activar TODOS los productos de esa sublínea
 *   3. Activar TODOS los comentarios de esa sublínea
 * 
 * VALIDACIONES:
 *   - Verifica que la sublínea existe
 *   - Verifica que el estado actual es diferente al solicitado
 *   - Manejo de errores con EXCEPTION
 *   - Auditoría completa con usuario que ejecuta la operación
 * 
 * EJEMPLO RETORNO (desactivar): "Sublínea desactivada exitosamente. Se desactivaron: 12 productos, 8 comentarios"
 * EJEMPLO RETORNO (activar): "Sublínea activada exitosamente. Se activaron: 12 productos, 8 comentarios"
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_deactivate_activate_sublinea(
    wid_categoria tab_sublineas.id_categoria%TYPE,
    wid_linea tab_sublineas.id_linea%TYPE,
    wid_sublinea tab_sublineas.id_sublinea%TYPE,
    wusr_operacion tab_sublineas.usr_update%TYPE,
    wactivar BOOLEAN
) RETURNS VARCHAR AS $$
DECLARE
    v_count_productos INT;
    v_count_comentarios INT;
    v_sublinea_actualizada INT;
    v_estado_actual BOOLEAN;
    v_accion TEXT;
BEGIN
    -- Obtener el estado actual de la sublínea
    SELECT ind_activo INTO v_estado_actual
    FROM tab_sublineas
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND id_sublinea = wid_sublinea;
    
    -- VALIDACIÓN: Verificar que la sublínea existe
    IF v_estado_actual IS NULL THEN
        RETURN 'Error: Sublínea no encontrada';
    END IF;
    
    -- VALIDACIÓN: Verificar que el estado es diferente al solicitado
    IF v_estado_actual = wactivar THEN
        RETURN FORMAT('Error: La sublínea ya está %s', 
                     CASE WHEN wactivar THEN 'activa' ELSE 'inactiva' END);
    END IF;
    
    -- Determinar el texto de la acción
    v_accion := CASE WHEN wactivar THEN 'activada' ELSE 'desactivada' END;
    
    -- PASO 1: Activar/Desactivar la sublínea
    UPDATE tab_sublineas SET 
        ind_activo = wactivar,
        usr_update = wusr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND id_sublinea = wid_sublinea;
    
    GET DIAGNOSTICS v_sublinea_actualizada = ROW_COUNT;
    
    -- VALIDACIÓN: Verificar que la sublínea fue actualizada
    IF v_sublinea_actualizada = 0 THEN
        RETURN 'Error: No se pudo actualizar la sublínea';
    END IF;

    -- PASO 2: Activar/Desactivar todos los productos de esta sublínea
    UPDATE tab_productos SET 
        ind_activo = wactivar,
        usr_update = wusr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND id_sublinea = wid_sublinea AND ind_activo != wactivar;

    GET DIAGNOSTICS v_count_productos = ROW_COUNT;

    -- PASO 3: Activar/Desactivar todos los comentarios de esta sublínea
    UPDATE tab_comentarios SET 
        ind_activo = wactivar,
        usr_update = wusr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND id_sublinea = wid_sublinea AND ind_activo != wactivar;

    GET DIAGNOSTICS v_count_comentarios = ROW_COUNT;

    -- RESULTADO: Mensaje detallado con totales
    RETURN FORMAT('Sublínea %s exitosamente. Se %s: %s productos, %s comentarios', 
                v_accion,
                CASE WHEN wactivar THEN 'activaron' ELSE 'desactivaron' END,
                v_count_productos, 
                v_count_comentarios);

-- MANEJO DE ERRORES: Capturar excepciones inesperadas
EXCEPTION 
    WHEN OTHERS THEN
        RETURN 'Error inesperado al cambiar estado de sublínea: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Mantener compatibilidad con el nombre anterior
CREATE OR REPLACE FUNCTION fun_deactivate_sublinea(
    wid_categoria tab_sublineas.id_categoria%TYPE,
    wid_linea tab_sublineas.id_linea%TYPE,
    wid_sublinea tab_sublineas.id_sublinea%TYPE,
    wusr_operacion tab_sublineas.usr_update%TYPE
) RETURNS VARCHAR AS $$
BEGIN
    RETURN fun_deactivate_activate_sublinea(wid_categoria, wid_linea, wid_sublinea, wusr_operacion, FALSE);
END;
$$ LANGUAGE plpgsql;

