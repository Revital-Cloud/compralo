/*
 * FUNCIÓN: fun_toggle_categoria 
 * 
 * DESCRIPCIÓN: Activa o desactiva una categoría del sistema mediante eliminación lógica
 *              y automáticamente activa/desactiva todas las líneas, sublíneas
 *              y productos que dependen de esta categoría según el estado solicitado.
 * 
 * PARÁMETROS:
 *   - wid_categoria: ID de la categoría a activar/desactivar (obligatorio)
 *   - wusr_operacion: Usuario que realiza la operación (obligatorio, para auditoría)
 *   - wactivar: BOOLEAN - TRUE para activar, FALSE para desactivar (obligatorio)
 * 
 * RETORNA: VARCHAR - Mensaje detallado con cantidad de elementos afectados
 * 
 * LÓGICA DE CASCADA:
 *   Si wactivar = FALSE (desactivar):
 *   1. Desactivar la categoría principal
 *   2. Desactivar TODAS las líneas de esa categoría
 *   3. Desactivar TODAS las sublíneas de esa categoría  
 *   4. Desactivar TODOS los productos de esa categoría
 *   5. Desactivar TODOS los comentarios de esa categoría
 * 
 *   Si wactivar = TRUE (activar):
 *   1. Activar la categoría principal
 *   2. Activar TODAS las líneas de esa categoría
 *   3. Activar TODAS las sublíneas de esa categoría  
 *   4. Activar TODOS los productos de esa categoría
 *   5. Activar TODOS los comentarios de esa categoría
 * 
 * VALIDACIONES:
 *   - Verifica que la categoría existe
 *   - Verifica que el estado actual es diferente al solicitado
 *   - Manejo de errores con EXCEPTION
 *   - Auditoría completa con usuario que ejecuta la operación
 * 
 * EJEMPLO RETORNO (desactivar): "Categoría desactivada exitosamente. Se desactivaron: 3 líneas, 8 sublíneas, 45 productos, 12 comentarios"
 * EJEMPLO RETORNO (activar): "Categoría activada exitosamente. Se activaron: 3 líneas, 8 sublíneas, 45 productos, 12 comentarios"
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_deactivate_activate_categoria(
    wid_categoria tab_categorias.id_categoria%TYPE,
    wusr_operacion tab_categorias.usr_update%TYPE,
    wactivar BOOLEAN
) RETURNS VARCHAR AS $$
DECLARE
    v_count_lineas INT;
    v_count_sublineas INT;
    v_count_productos INT;
    v_count_comentarios INT;
    v_categoria_actualizada INT;
    v_estado_actual BOOLEAN;
    v_accion TEXT;
BEGIN
    -- Obtener el estado actual de la categoría
    SELECT ind_activo INTO v_estado_actual
    FROM tab_categorias
    WHERE id_categoria = wid_categoria;
    
    -- VALIDACIÓN: Verificar que la categoría existe
    IF v_estado_actual IS NULL THEN
        RETURN 'Error: Categoría no encontrada';
    END IF;
    
    -- VALIDACIÓN: Verificar que el estado es diferente al solicitado
    IF v_estado_actual = wactivar THEN
        RETURN FORMAT('Error: La categoría ya está %s', 
                     CASE WHEN wactivar THEN 'activa' ELSE 'inactiva' END);
    END IF;
    
    -- Determinar el texto de la acción
    v_accion := CASE WHEN wactivar THEN 'activada' ELSE 'desactivada' END;
    
    -- PASO 1: Activar/Desactivar la categoría
    UPDATE tab_categorias SET 
        ind_activo = wactivar,
        usr_update = wusr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_categoria = wid_categoria;
    
    GET DIAGNOSTICS v_categoria_actualizada = ROW_COUNT;
    
    -- VALIDACIÓN: Verificar que la categoría fue actualizada
    IF v_categoria_actualizada = 0 THEN
        RETURN 'Error: No se pudo actualizar la categoría';
    END IF;

    -- PASO 2: Activar/Desactivar todas las líneas de esta categoría
    UPDATE tab_lineas SET 
        ind_activo = wactivar,
        usr_update = wusr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_categoria = wid_categoria AND ind_activo != wactivar;
    
    GET DIAGNOSTICS v_count_lineas = ROW_COUNT;
    
    -- PASO 3: Activar/Desactivar todas las sublíneas de esta categoría
    UPDATE tab_sublineas SET 
        ind_activo = wactivar,
        usr_update = wusr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_categoria = wid_categoria AND ind_activo != wactivar;

    GET DIAGNOSTICS v_count_sublineas = ROW_COUNT;

    -- PASO 4: Activar/Desactivar todos los productos de esta categoría
    UPDATE tab_productos SET 
        ind_activo = wactivar,
        usr_update = wusr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_categoria = wid_categoria AND ind_activo != wactivar;

    GET DIAGNOSTICS v_count_productos = ROW_COUNT;

    -- PASO 5: Activar/Desactivar todos los comentarios de esta categoría	
    UPDATE tab_comentarios SET 
        ind_activo = wactivar,
        usr_update = wusr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_categoria = wid_categoria AND ind_activo != wactivar;
    
    GET DIAGNOSTICS v_count_comentarios = ROW_COUNT;

    -- RESULTADO: Mensaje detallado con totales
    RETURN FORMAT('Categoría %s exitosamente. Se %s: %s líneas, %s sublíneas, %s productos, %s comentarios', 
                v_accion,
                CASE WHEN wactivar THEN 'activaron' ELSE 'desactivaron' END,
                v_count_lineas, 
                v_count_sublineas, 
                v_count_productos, 
                v_count_comentarios);

-- MANEJO DE ERRORES: Capturar excepciones inesperadas
EXCEPTION 
    WHEN OTHERS THEN
        RETURN 'Error inesperado al cambiar estado de categoría: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Mantener compatibilidad con el nombre anterior
CREATE OR REPLACE FUNCTION fun_deactivate_categoria(
    wid_categoria tab_categorias.id_categoria%TYPE,
    wusr_operacion tab_categorias.usr_update%TYPE
) RETURNS VARCHAR AS $$
BEGIN
    RETURN fun_toggle_categoria(wid_categoria, wusr_operacion, FALSE);
END;
$$ LANGUAGE plpgsql;
