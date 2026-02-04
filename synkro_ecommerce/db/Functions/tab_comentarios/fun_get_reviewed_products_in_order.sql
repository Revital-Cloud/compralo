/*
* FUNCIÓN: fun_get_reviewed_products_in_order
* 
* DESCRIPCIÓN: Obtiene la lista de productos que un usuario ya ha reseñado en una orden específica.
* 
* PARÁMETROS:
*   - wid_orden: ID de la orden (obligatorio, > 0)
*   - wid_usuario: ID del usuario (obligatorio, > 0)
*
* RETORNA: TABLE(product_key VARCHAR) - Lista de claves de productos en formato "id_categoria-id_linea-id_sublinea-id_producto"
* 
* LÓGICA:
*   1. Validar parámetros obligatorios
*   2. Buscar comentarios activos del usuario en la orden especificada
*   3. Retornar lista de claves de productos únicas
* 
* AUTOR: Sistema DB_Synkro
* FECHA: 2025
*/
CREATE OR REPLACE FUNCTION fun_get_reviewed_products_in_order(
    wid_orden tab_comentarios.id_orden%TYPE,
    wid_usuario tab_comentarios.id_usuario%TYPE
) RETURNS TABLE(product_key VARCHAR) AS $$

BEGIN
    -- VALIDACIÓN 1: ID de orden
    IF wid_orden IS NULL OR wid_orden <= 0 THEN
        RAISE EXCEPTION 'El ID de orden es obligatorio y debe ser mayor a 0';
    END IF;

    -- VALIDACIÓN 2: ID de usuario
    IF wid_usuario IS NULL OR wid_usuario <= 0 THEN
        RAISE EXCEPTION 'El ID de usuario es obligatorio y debe ser mayor a 0';
    END IF;

    -- RETORNAR lista de productos reseñados
    RETURN QUERY
    SELECT DISTINCT
        (c.id_categoria::VARCHAR || '-' || 
         c.id_linea::VARCHAR || '-' || 
         c.id_sublinea::VARCHAR || '-' || 
         c.id_producto::VARCHAR)::VARCHAR as product_key
    FROM tab_comentarios c
    WHERE c.id_orden = wid_orden
      AND c.id_usuario = wid_usuario
      AND c.ind_activo = TRUE
    ORDER BY product_key;

-- MANEJO DE ERRORES
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al obtener productos reseñados: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

