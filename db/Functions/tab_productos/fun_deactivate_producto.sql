/*
 * FUNCIÓN: fun_deactivate_producto
 * 
 * DESCRIPCIÓN: Desactiva un producto del catálogo mediante eliminación lógica.
 *              No elimina físicamente el registro, solo cambia su estado a inactivo.
 * 
 * PARÁMETROS:
 *   - wid_categoria: ID de categoría del producto (obligatorio, > 0)
 *   - wid_linea: ID de línea del producto (obligatorio, > 0)  
 *   - wid_sublinea: ID de sublínea del producto (obligatorio, > 0)
 *   - wid_producto: ID específico del producto (obligatorio, > 0)
 *   - wusr_operacion: ID del usuario que realiza la operación para auditoría (obligatorio, DECIMAL)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar ID de usuario operación para auditoría
 *   2. Buscar producto activo con los IDs proporcionados
 *   3. Cambiar estado a inactivo (FALSE)
 *   4. Actualizar timestamp de modificación
 *   5. Desactivar comentarios asociados
 *   6. Confirmar éxito de la operación
 * 
 * NOTA: Solo afecta productos que estén actualmente activos
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_deactivate_producto(
    wid_categoria tab_productos.id_categoria%TYPE,
    wid_linea tab_productos.id_linea%TYPE,
    wid_sublinea tab_productos.id_sublinea%TYPE,
    wid_producto tab_productos.id_producto%TYPE,
    wusr_operacion tab_productos.usr_update%TYPE  -- Ahora es DECIMAL(10)
) RETURNS VARCHAR AS $$
DECLARE
    v_count_comentarios INT;
    v_producto_actualizado INT;
BEGIN
    -- VALIDACIÓN: ID de usuario operación para auditoría
    IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
        RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
    END IF;

    -- PASO 1: Desactivar el producto
    UPDATE tab_productos SET 
        ind_activo = FALSE,
        usr_update = wusr_operacion
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND id_sublinea = wid_sublinea AND id_producto = wid_producto AND ind_activo = TRUE;

    GET DIAGNOSTICS v_producto_actualizado = ROW_COUNT;

    -- VALIDACIÓN: Verificar que el producto fue encontrado y desactivado
    IF v_producto_actualizado = 0 THEN
        RETURN 'Error: Producto no encontrado o ya estaba inactivo';
    END IF;

    -- PASO 2: Desactivar todos los comentarios de este producto
    UPDATE tab_comentarios SET 
        ind_activo = FALSE,
        usr_update = wusr_operacion  -- Usar ID numérico directamente
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND id_sublinea = wid_sublinea AND id_producto = wid_producto AND ind_activo = TRUE;

    GET DIAGNOSTICS v_count_comentarios = ROW_COUNT;

    -- RESULTADO: Mensaje detallado con totales
    RAISE NOTICE 'Producto desactivado por usuario ID: %, comentarios desactivados: %', wusr_operacion, v_count_comentarios;
    RETURN FORMAT('Producto desactivado exitosamente y se desactivaron: %s comentarios', v_count_comentarios);

-- MANEJO DE ERRORES: Capturar excepciones inesperadas
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error inesperado: ' || SQLERRM;
        ROLLBACK;
END;
$$
LANGUAGE plpgsql;

-- Ejemplos de uso corregidos (ahora con nombre de función correcto y ID numérico)
SELECT fun_deactivate_producto(1, 1, 1, 1, 1234567890);
SELECT fun_deactivate_producto(1, 1, 1, 2, 1234567890);
