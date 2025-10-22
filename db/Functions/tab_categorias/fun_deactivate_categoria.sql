/*
 * FUNCIÓN: fun_deactivate_categoria 
 * 
 * DESCRIPCIÓN: Desactiva una categoría del sistema mediante eliminación lógica
 *              y automáticamente desactiva todas las líneas, sublíneas
 *              y productos que dependen de esta categoría.
 * 
 * PARÁMETROS:
 *   - wid_categoria: ID de la categoría a desactivar (obligatorio)
 *   - wusr_operacion: Usuario que realiza la operación (obligatorio, para auditoría)
 * 
 * RETORNA: VARCHAR - Mensaje detallado con cantidad de elementos desactivados
 * 
 * LÓGICA DE CASCADA:
 *   1. Desactivar la categoría principal
 *   2. Desactivar TODAS las líneas de esa categoría
 *   3. Desactivar TODAS las sublíneas de esa categoría  
 *   4. Desactivar TODOS los productos de esa categoría
 *   5. Retornar resumen detallado de elementos afectados
 * 
 * VALIDACIONES:
 *   - Verifica que la categoría existe y está activa
 *   - Manejo de errores con EXCEPTION
 *   - Auditoría completa con usuario que ejecuta la operación
 * 
 * EJEMPLO RETORNO: "Categoría desactivada exitosamente. Cascada aplicada: 3 líneas, 8 sublíneas, 45 productos"
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_deactivate_categoria(
    wid_categoria tab_categorias.id_categoria%TYPE,
    wusr_operacion tab_categorias.usr_update%TYPE
) RETURNS VARCHAR AS $$
DECLARE
    v_count_lineas INT;
    v_count_sublineas INT;
    v_count_productos INT;
    v_count_comentarios INT;
    v_categoria_actualizada INT;
BEGIN
    -- PASO 1: Desactivar la categoría
    UPDATE tab_categorias SET 
        ind_activo = FALSE,
        usr_update = wusr_operacion
    WHERE id_categoria = wid_categoria AND ind_activo = TRUE;
    
    GET DIAGNOSTICS v_categoria_actualizada = ROW_COUNT;
    
    -- VALIDACIÓN: Verificar que la categoría fue encontrada y desactivada
    IF v_categoria_actualizada = 0 THEN
        RETURN 'Error: Categoría no encontrada o ya estaba inactiva';
    END IF;

    -- PASO 2: Desactivar todas las líneas de esta categoría
    UPDATE tab_lineas SET 
        ind_activo = FALSE,
        usr_update = wusr_operacion
    WHERE id_categoria = wid_categoria AND ind_activo = TRUE;
    
    GET DIAGNOSTICS v_count_lineas = ROW_COUNT;
    
    -- PASO 3: Desactivar todas las sublíneas de esta categoría
    UPDATE tab_sublineas SET 
        ind_activo = FALSE,
        usr_update = wusr_operacion 
    WHERE id_categoria = wid_categoria AND ind_activo = TRUE;

    GET DIAGNOSTICS v_count_sublineas = ROW_COUNT;

    -- PASO 4: Desactivar todos los productos de esta categoría
    UPDATE tab_productos SET 
        ind_activo = FALSE,
        usr_update = wusr_operacion 
    WHERE id_categoria = wid_categoria AND ind_activo = TRUE;

    GET DIAGNOSTICS v_count_productos = ROW_COUNT;

    -- PASO 5: Desactivar todos los comentarios de esta categoría	
    UPDATE tab_comentarios SET 
        ind_activo = FALSE,
        usr_update = wusr_operacion 
    WHERE id_categoria = wid_categoria AND ind_activo = TRUE;
    

    -- RESULTADO: Mensaje detallado con totales
    RETURN FORMAT('Categoría desactivada exitosamente. se desactivaron: %s líneas, se desactivaron: %s sublíneas, se desactivaron: %s productos, se desactivaron: %s comentarios', 
                v_count_lineas, v_count_sublineas, v_count_productos, v_count_comentarios);

-- MANEJO DE ERRORES: Capturar excepciones inesperadas
EXCEPTION 
    WHEN OTHERS THEN
        RETURN 'Error inesperado al desactivar categoría: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
