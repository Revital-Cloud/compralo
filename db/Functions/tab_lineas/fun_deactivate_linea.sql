/*
 * FUNCIÓN: fun_deactivate_linea
 * 
 * DESCRIPCIÓN: Desactiva una línea del sistema mediante eliminación lógica
 *              y automáticamente desactiva todas las sublíneas y productos
 *              que dependen de esta línea.
 * 
 * PARÁMETROS:
 *   - wid_categoria: ID de la categoría de la línea (obligatorio)
 *   - wid_linea: ID de la línea a desactivar (obligatorio)
 *   - wusr_operacion: Usuario que realiza la operación (obligatorio, para auditoría)
 * 
 * RETORNA: VARCHAR - Mensaje detallado con cantidad de elementos desactivados
 * 
 * LÓGICA DE CASCADA:
 *   1. Desactivar la línea principal
 *   2. Desactivar TODAS las sublíneas de esa línea
 *   3. Desactivar TODOS los productos de esa línea
 *   4. Retornar resumen detallado de elementos afectados
 * 
 * VALIDACIONES:
 *   - Verifica que la línea existe y está activa
 *   - Manejo de errores con EXCEPTION
 *   - Auditoría completa con usuario que ejecuta la operación
 * 
 * EJEMPLO RETORNO: "Línea desactivada exitosamente y sus elementos asociados: 5 sublíneas, 23 productos"
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_deactivate_linea(
    wid_categoria tab_lineas.id_categoria%TYPE,
    wid_linea tab_lineas.id_linea%TYPE,
    wusr_operacion tab_lineas.usr_update%TYPE
) RETURNS VARCHAR AS $$
DECLARE
    v_count_sublineas INT;
    v_count_productos INT;
    v_count_comentarios INT;
    v_linea_actualizada INT;
BEGIN
    -- PASO 1: Desactivar la línea
    UPDATE tab_lineas SET 
        ind_activo = FALSE,
        usr_update = wusr_operacion,
        fec_update = NOW()
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND ind_activo = TRUE;
    
    GET DIAGNOSTICS v_linea_actualizada = ROW_COUNT;
    
    -- VALIDACIÓN: Verificar que la línea fue encontrada y desactivada
    IF v_linea_actualizada = 0 THEN
        RETURN 'Error: Línea no encontrada o ya estaba inactiva';
    END IF;

    -- PASO 2: Desactivar todas las sublíneas de esta línea
    UPDATE tab_sublineas SET 
        ind_activo = FALSE,
        usr_update = wusr_operacion
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND ind_activo = TRUE;
    
    GET DIAGNOSTICS v_count_sublineas = ROW_COUNT;

    -- PASO 3: Desactivar todos los productos de esta línea
    UPDATE tab_productos SET 
        ind_activo = FALSE,
        usr_update = wusr_operacion
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND ind_activo = TRUE;

    GET DIAGNOSTICS v_count_productos = ROW_COUNT;

    -- PASO 4: Desactivar todos los comentarios de esta línea
    UPDATE tab_comentarios SET 
        ind_activo = FALSE,
        usr_update = wusr_operacion
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND ind_activo = TRUE;

    GET DIAGNOSTICS v_count_comentarios = ROW_COUNT;

    -- RESULTADO: Mensaje detallado con totales
    RETURN FORMAT('Línea desactivada exitosamente y se desactivaron: %s sublíneas, se desactivaron: %s productos, se desactivaron: %s comentarios', 
                v_count_sublineas, v_count_productos, v_count_comentarios);

-- MANEJO DE ERRORES: Capturar excepciones inesperadas
EXCEPTION 
    WHEN OTHERS THEN
        RETURN 'Error inesperado al desactivar línea: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;



