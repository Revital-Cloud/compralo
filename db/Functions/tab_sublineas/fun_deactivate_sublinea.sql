/*
 * FUNCIÓN: fun_deactivate_sublinea
 * 
 * DESCRIPCIÓN: Desactiva una sublínea del sistema mediante eliminación lógica
 *              y automáticamente desactiva todos los productos que dependen
 *              de esta sublínea.
 * 
 * PARÁMETROS:
 *   - wid_categoria: ID de la categoría de la sublínea (obligatorio)
 *   - wid_linea: ID de la línea de la sublínea (obligatorio)
 *   - wid_sublinea: ID de la sublínea a desactivar (obligatorio)
 *   - wusr_operacion: Usuario que realiza la operación (obligatorio, para auditoría)
 * 
 * RETORNA: VARCHAR - Mensaje detallado con cantidad de elementos desactivados
 * 
 * LÓGICA DE CASCADA:
 *   1. Desactivar la sublínea principal
 *   2. Desactivar TODOS los productos de esa sublínea
 *   3. Retornar resumen detallado de elementos afectados
 * 
 * VALIDACIONES:
 *   - Verifica que la sublínea existe y está activa
 *   - Manejo de errores con EXCEPTION
 *   - Auditoría completa con usuario que ejecuta la operación
 * 
 * EJEMPLO RETORNO: "Sublínea desactivada exitosamente y sus elementos asociados: 12 productos"
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_deactivate_sublinea(
    wid_categoria tab_sublineas.id_categoria%TYPE,
    wid_linea tab_sublineas.id_linea%TYPE,
    wid_sublinea tab_sublineas.id_sublinea%TYPE,
    wusr_operacion tab_sublineas.usr_update%TYPE
) RETURNS VARCHAR AS $$
DECLARE
    v_count_productos INT;
    v_count_comentarios INT;
    v_sublinea_actualizada INT;
BEGIN
    -- PASO 1: Desactivar la sublínea
    UPDATE tab_sublineas SET 
        ind_activo = FALSE,
        usr_update = wusr_operacion
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND id_sublinea = wid_sublinea AND ind_activo = TRUE;
    
    GET DIAGNOSTICS v_sublinea_actualizada = ROW_COUNT;
    
    -- VALIDACIÓN: Verificar que la sublínea fue encontrada y desactivada
    IF v_sublinea_actualizada = 0 THEN
        RETURN 'Error: Sublínea no encontrada o ya estaba inactiva';
    END IF;

    -- PASO 2: Desactivar todos los productos de esta sublínea
    UPDATE tab_productos SET 
        ind_activo = FALSE,
        usr_update = wusr_operacion

    WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND id_sublinea = wid_sublinea AND ind_activo = TRUE;

    GET DIAGNOSTICS v_count_productos = ROW_COUNT;

    -- PASO 3: Desactivar todos los comentarios de esta sublínea
    UPDATE tab_comentarios SET 
        ind_activo = FALSE,
        usr_update = wusr_operacion
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND id_sublinea = wid_sublinea AND ind_activo = TRUE;

    GET DIAGNOSTICS v_count_comentarios = ROW_COUNT;

    -- RESULTADO: Mensaje detallado con totales
    RETURN FORMAT('Sublínea desactivada exitosamente y se desactivaron: %s productos, se desactivaron: %s comentarios', 
                v_count_productos, v_count_comentarios);

-- MANEJO DE ERRORES: Capturar excepciones inesperadas
EXCEPTION 
    WHEN OTHERS THEN
        RETURN 'Error inesperado al desactivar sublínea: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

