/*
 * FUNCIÓN: fun_deactivate_activate_producto 
 * 
 * DESCRIPCIÓN: Activa o desactiva un producto del catálogo mediante eliminación lógica
 *              y automáticamente activa/desactiva todos los comentarios que dependen
 *              de este producto según el estado solicitado.
 * 
 * PARÁMETROS:
 *   - wid_categoria: ID de categoría del producto (obligatorio, > 0)
 *   - wid_linea: ID de línea del producto (obligatorio, > 0)  
 *   - wid_sublinea: ID de sublínea del producto (obligatorio, > 0)
 *   - wid_producto: ID específico del producto (obligatorio, > 0)
 *   - wusr_operacion: ID del usuario que realiza la operación para auditoría (obligatorio, DECIMAL)
 *   - wactivar: BOOLEAN - TRUE para activar, FALSE para desactivar (obligatorio)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   Si wactivar = FALSE (desactivar):
 *   1. Validar ID de usuario operación para auditoría
 *   2. Buscar producto con los IDs proporcionados
 *   3. Cambiar estado a inactivo (FALSE)
 *   4. Actualizar timestamp de modificación
 *   5. Desactivar comentarios asociados
 * 
 *   Si wactivar = TRUE (activar):
 *   1. Validar ID de usuario operación para auditoría
 *   2. Buscar producto con los IDs proporcionados
 *   3. Cambiar estado a activo (TRUE)
 *   4. Actualizar timestamp de modificación
 *   5. Activar comentarios asociados
 * 
 * VALIDACIONES:
 *   - Verifica que el producto existe
 *   - Verifica que el estado actual es diferente al solicitado
 *   - Manejo de errores con EXCEPTION
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_deactivate_activate_producto(
    wid_categoria tab_productos.id_categoria%TYPE,
    wid_linea tab_productos.id_linea%TYPE,
    wid_sublinea tab_productos.id_sublinea%TYPE,
    wid_producto tab_productos.id_producto%TYPE,
    wusr_operacion tab_productos.usr_update%TYPE,
    wactivar BOOLEAN
) RETURNS VARCHAR AS $$
DECLARE
    v_count_comentarios INT;
    v_producto_actualizado INT;
    v_estado_actual BOOLEAN;
    v_accion TEXT;
BEGIN
    -- VALIDACIÓN: ID de usuario operación para auditoría
    IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
        RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
    END IF;

    -- Obtener el estado actual del producto
    SELECT ind_activo INTO v_estado_actual
    FROM tab_productos
    WHERE id_categoria = wid_categoria 
      AND id_linea = wid_linea 
      AND id_sublinea = wid_sublinea 
      AND id_producto = wid_producto;
    
    -- VALIDACIÓN: Verificar que el producto existe
    IF v_estado_actual IS NULL THEN
        RETURN 'Error: Producto no encontrado';
    END IF;
    
    -- VALIDACIÓN: Verificar que el estado es diferente al solicitado
    IF v_estado_actual = wactivar THEN
        RETURN FORMAT('Error: El producto ya está %s', 
                     CASE WHEN wactivar THEN 'activo' ELSE 'inactivo' END);
    END IF;
    
    -- Determinar el texto de la acción
    v_accion := CASE WHEN wactivar THEN 'activado' ELSE 'desactivado' END;

    -- PASO 1: Activar/Desactivar el producto
    UPDATE tab_productos SET 
        ind_activo = wactivar,
        usr_update = wusr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_categoria = wid_categoria 
      AND id_linea = wid_linea 
      AND id_sublinea = wid_sublinea 
      AND id_producto = wid_producto;

    GET DIAGNOSTICS v_producto_actualizado = ROW_COUNT;

    -- VALIDACIÓN: Verificar que el producto fue actualizado
    IF v_producto_actualizado = 0 THEN
        RETURN 'Error: No se pudo actualizar el producto';
    END IF;

    -- PASO 2: Activar/Desactivar todos los comentarios de este producto
    UPDATE tab_comentarios SET 
        ind_activo = wactivar,
        usr_update = wusr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_categoria = wid_categoria 
      AND id_linea = wid_linea 
      AND id_sublinea = wid_sublinea 
      AND id_producto = wid_producto 
      AND ind_activo != wactivar;

    GET DIAGNOSTICS v_count_comentarios = ROW_COUNT;

    -- RESULTADO: Mensaje detallado con totales
    RAISE NOTICE 'Producto %s por usuario ID: %, comentarios %s: %', v_accion, wusr_operacion, 
                 CASE WHEN wactivar THEN 'activados' ELSE 'desactivados' END, v_count_comentarios;
    RETURN FORMAT('Producto %s exitosamente y se %s: %s comentarios', 
                v_accion,
                CASE WHEN wactivar THEN 'activaron' ELSE 'desactivaron' END,
                v_count_comentarios);

-- MANEJO DE ERRORES: Capturar excepciones inesperadas
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error inesperado al cambiar estado del producto: ' || SQLERRM;
        ROLLBACK;
END;
$$
LANGUAGE plpgsql;

-- Mantener compatibilidad con el nombre anterior
CREATE OR REPLACE FUNCTION fun_deactivate_producto(
    wid_categoria tab_productos.id_categoria%TYPE,
    wid_linea tab_productos.id_linea%TYPE,
    wid_sublinea tab_productos.id_sublinea%TYPE,
    wid_producto tab_productos.id_producto%TYPE,
    wusr_operacion tab_productos.usr_update%TYPE
) RETURNS VARCHAR AS $$
BEGIN
    RETURN fun_deactivate_activate_producto(wid_categoria, wid_linea, wid_sublinea, wid_producto, wusr_operacion, FALSE);
END;
$$ LANGUAGE plpgsql;

