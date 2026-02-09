/*
 * FUNCIÓN: fun_filter_products
 * 
 * DESCRIPCIÓN: Función para filtrar productos con múltiples criterios de búsqueda
 *              que recibe parámetros del frontend para realizar búsquedas avanzadas.
 * 
 * PARÁMETROS:
 *   - p_id_categoria: ID de categoría para filtrar (opcional, valor único)
 *   - p_id_linea: ID de línea para filtrar (opcional, valor único)
 *   - p_id_sublinea: ID de sublínea para filtrar (opcional, valor único)
 *   - p_id_marca: ID de marca para filtrar (opcional, valor único)
 *   - p_id_proveedor: ID de proveedor para filtrar (opcional, valor único)
 *   - p_nombre_producto: Texto para buscar en nombre del producto (opcional, búsqueda parcial)
 *   - p_precio_min: Precio mínimo para filtrar (opcional)
 *   - p_precio_max: Precio máximo para filtrar (opcional)
 *   - p_stock_min: Stock mínimo para filtrar (opcional)
 *   - p_solo_con_stock: TRUE para mostrar solo productos con stock > 0 (opcional)
 *   - p_ordenar_por: Campo para ordenar ('precio', 'nombre', 'stock', 'fecha') (opcional)
 *   - p_orden: Dirección del orden ('ASC' o 'DESC') (opcional)
 *   - p_limit: Límite de resultados (opcional, default 50)
 *   - p_offset: Offset para paginación (opcional, default 0)
 *   - p_id_categorias: Array de IDs de categorías para filtrar (opcional, múltiples valores)
 *   - p_id_lineas: Array de IDs de líneas para filtrar (opcional, múltiples valores)
 *   - p_id_sublineas: Array de IDs de sublíneas para filtrar (opcional, múltiples valores)
 *   - p_id_marcas: Array de IDs de marcas para filtrar (opcional, múltiples valores)
 *   - p_id_proveedores: Array de IDs de proveedores para filtrar (opcional, múltiples valores)
 * 
 * RETORNA: TABLE con información completa de productos filtrados
 * 
 * LÓGICA:
 *   1. Aplicar filtros según parámetros proporcionados
 *   2. Realizar búsqueda de texto en nombre del producto
 *   3. Aplicar filtros de rango de precio y stock
 *   4. Ordenar resultados según parámetros
 *   5. Aplicar paginación
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 * VERSIÓN: 2.2 - Agregado soporte para arrays de múltiples valores
 */
CREATE OR REPLACE FUNCTION fun_filter_products(
    p_id_categoria tab_categorias.id_categoria%TYPE DEFAULT NULL,
    p_id_linea tab_lineas.id_linea%TYPE DEFAULT NULL,
    p_id_sublinea tab_sublineas.id_sublinea%TYPE DEFAULT NULL,
    p_id_marca tab_marcas.id_marca%TYPE DEFAULT NULL,
    p_id_proveedor tab_proveedores.id_proveedor%TYPE DEFAULT NULL,
    p_nombre_producto tab_productos.nom_producto%TYPE DEFAULT NULL,
    p_precio_min tab_productos.val_precio%TYPE DEFAULT NULL,
    p_precio_max tab_productos.val_precio%TYPE DEFAULT NULL,
    p_stock_min tab_productos.num_stock%TYPE DEFAULT NULL,
    p_solo_con_stock BOOLEAN DEFAULT FALSE,
    p_ordenar_por VARCHAR(20) DEFAULT 'nombre',
    p_orden VARCHAR(4) DEFAULT 'ASC',
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    -- NUEVOS PARÁMETROS PARA ARRAYS
    p_id_categorias INTEGER[] DEFAULT NULL,
    p_id_lineas INTEGER[] DEFAULT NULL,
    p_id_sublineas INTEGER[] DEFAULT NULL,
    p_id_marcas INTEGER[] DEFAULT NULL,
    p_id_proveedores INTEGER[] DEFAULT NULL
)
RETURNS TABLE (
    id_categoria tab_productos.id_categoria%TYPE,
    id_linea tab_productos.id_linea%TYPE,
    id_sublinea tab_productos.id_sublinea%TYPE,
    id_producto tab_productos.id_producto%TYPE,
    nom_categoria tab_categorias.nom_categoria%TYPE,
    nom_linea tab_lineas.nom_linea%TYPE,
    nom_sublinea tab_sublineas.nom_sublinea%TYPE,
    nom_producto tab_productos.nom_producto%TYPE,
    spcf_producto tab_productos.spcf_producto%TYPE,
    img_producto tab_productos.img_producto%TYPE,
    val_precio tab_productos.val_precio%TYPE,
    num_stock tab_productos.num_stock%TYPE,
    nom_proveedor tab_proveedores.nom_proveedor%TYPE,
    nom_marca tab_marcas.nom_marca%TYPE,
    fec_insert tab_productos.fec_insert%TYPE,
    total_registros BIGINT
) AS $$
DECLARE
    v_sql TEXT;
    v_where_conditions TEXT := '';
    v_order_clause TEXT;
    v_count_sql TEXT;
    v_total_count BIGINT;
BEGIN
    -- VALIDACIÓN: Límite máximo para evitar sobrecarga
    IF p_limit > 1000 THEN
        p_limit := 1000;
    END IF;
    
    -- VALIDACIÓN: Offset no puede ser negativo
    IF p_offset < 0 THEN
        p_offset := 0;
    END IF;
    
    -- VALIDACIÓN: Orden válido
    IF UPPER(p_orden) NOT IN ('ASC', 'DESC') THEN
        p_orden := 'ASC';
    END IF;
    
    -- VALIDACIÓN: Campo de ordenamiento válido
    IF p_ordenar_por NOT IN ('precio', 'nombre', 'stock', 'fecha') THEN
        p_ordenar_por := 'nombre';
    END IF;
    
    -- CONSTRUIR CONDICIONES WHERE
    -- Solo productos activos
    v_where_conditions := 'WHERE p.ind_activo = true';
    
    -- Filtro por categoría (valor único o array)
    IF p_id_categoria IS NOT NULL THEN
        v_where_conditions := v_where_conditions || ' AND p.id_categoria = ' || p_id_categoria::TEXT;
    ELSIF p_id_categorias IS NOT NULL AND array_length(p_id_categorias, 1) > 0 THEN
        v_where_conditions := v_where_conditions || ' AND p.id_categoria = ANY(ARRAY[' || array_to_string(p_id_categorias, ',') || ']::numeric[])';
    END IF;
    
    -- Filtro por línea (valor único o array)
    IF p_id_linea IS NOT NULL THEN
        v_where_conditions := v_where_conditions || ' AND p.id_linea = ' || p_id_linea::TEXT;
    ELSIF p_id_lineas IS NOT NULL AND array_length(p_id_lineas, 1) > 0 THEN
        v_where_conditions := v_where_conditions || ' AND p.id_linea = ANY(ARRAY[' || array_to_string(p_id_lineas, ',') || ']::numeric[])';
    END IF;
    
    -- Filtro por sublínea (valor único o array)
    IF p_id_sublinea IS NOT NULL THEN
        v_where_conditions := v_where_conditions || ' AND p.id_sublinea = ' || p_id_sublinea::TEXT;
    ELSIF p_id_sublineas IS NOT NULL AND array_length(p_id_sublineas, 1) > 0 THEN
        v_where_conditions := v_where_conditions || ' AND p.id_sublinea = ANY(ARRAY[' || array_to_string(p_id_sublineas, ',') || ']::numeric[])';
    END IF;
    
    -- Filtro por marca (valor único o array)
    IF p_id_marca IS NOT NULL THEN
        v_where_conditions := v_where_conditions || ' AND p.id_marca = ' || p_id_marca::TEXT;
    ELSIF p_id_marcas IS NOT NULL AND array_length(p_id_marcas, 1) > 0 THEN
        v_where_conditions := v_where_conditions || ' AND p.id_marca = ANY(ARRAY[' || array_to_string(p_id_marcas, ',') || ']::int[])';
    END IF;
    
    -- Filtro por proveedor (valor único o array)
    IF p_id_proveedor IS NOT NULL THEN
        v_where_conditions := v_where_conditions || ' AND p.id_proveedor = ' || p_id_proveedor::TEXT;
    ELSIF p_id_proveedores IS NOT NULL AND array_length(p_id_proveedores, 1) > 0 THEN
        v_where_conditions := v_where_conditions || ' AND p.id_proveedor = ANY(ARRAY[' || array_to_string(p_id_proveedores, ',') || ']::int[])';
    END IF;
    
    -- Búsqueda por nombre del producto (búsqueda parcial, case-insensitive)
    IF p_nombre_producto IS NOT NULL AND p_nombre_producto != '' THEN
        v_where_conditions := v_where_conditions || format(' AND UPPER(p.nom_producto) LIKE UPPER(%L)', '%' || p_nombre_producto || '%');
    END IF;
    
    -- Filtro por precio mínimo
    IF p_precio_min IS NOT NULL THEN
        v_where_conditions := v_where_conditions || ' AND p.val_precio >= ' || p_precio_min::TEXT;
    END IF;
    
    -- Filtro por precio máximo
    IF p_precio_max IS NOT NULL THEN
        v_where_conditions := v_where_conditions || ' AND p.val_precio <= ' || p_precio_max::TEXT;
    END IF;
    
    -- Filtro por stock mínimo
    IF p_stock_min IS NOT NULL THEN
        v_where_conditions := v_where_conditions || ' AND p.num_stock >= ' || p_stock_min::TEXT;
    END IF;
    
    -- Filtro solo productos con stock
    IF p_solo_con_stock = TRUE THEN
        v_where_conditions := v_where_conditions || ' AND p.num_stock > 0';
    END IF;
    
    -- CONSTRUIR CLAUSULA ORDER BY
    CASE p_ordenar_por
        WHEN 'precio' THEN
            v_order_clause := 'ORDER BY p.val_precio ' || UPPER(p_orden)::TEXT;
        WHEN 'nombre' THEN
            v_order_clause := 'ORDER BY p.nom_producto ' || UPPER(p_orden)::TEXT;
        WHEN 'stock' THEN
            v_order_clause := 'ORDER BY p.num_stock ' || UPPER(p_orden)::TEXT;
        WHEN 'fecha' THEN
            v_order_clause := 'ORDER BY p.fec_insert ' || UPPER(p_orden)::TEXT;
        ELSE
            v_order_clause := 'ORDER BY p.nom_producto ASC';
    END CASE;
    
    -- CONSTRUIR QUERY PRINCIPAL CON SUBCONSULTA PARA CONTEO
    v_sql := '
        SELECT 
            p.id_categoria,
            p.id_linea,
            p.id_sublinea,
            p.id_producto,
            c.nom_categoria, 
            l.nom_linea, 
            s.nom_sublinea, 
            p.nom_producto, 
            p.spcf_producto, 
            p.img_producto, 
            p.val_precio, 
            p.num_stock, 
            pr.nom_proveedor, 
            m.nom_marca,
            p.fec_insert,
            (SELECT COUNT(DISTINCT p2.id_categoria || ''-'' || p2.id_linea || ''-'' || p2.id_sublinea || ''-'' || p2.id_producto) 
             FROM tab_productos p2
             LEFT JOIN tab_categorias c2 ON p2.id_categoria = c2.id_categoria
             LEFT JOIN tab_lineas l2 ON p2.id_linea = l2.id_linea AND p2.id_categoria = l2.id_categoria
             LEFT JOIN tab_sublineas s2 ON p2.id_sublinea = s2.id_sublinea AND p2.id_linea = s2.id_linea
             LEFT JOIN tab_proveedores pr2 ON p2.id_proveedor = pr2.id_proveedor
             LEFT JOIN tab_marcas m2 ON p2.id_marca = m2.id_marca
             WHERE p2.ind_activo = true' || 
                CASE WHEN p_id_categoria IS NOT NULL THEN ' AND p2.id_categoria = ' || p_id_categoria::TEXT 
                     WHEN p_id_categorias IS NOT NULL AND array_length(p_id_categorias, 1) > 0 THEN ' AND p2.id_categoria = ANY(ARRAY[' || array_to_string(p_id_categorias, ',') || ']::numeric[])' 
                     ELSE '' END ||
                CASE WHEN p_id_linea IS NOT NULL THEN ' AND p2.id_linea = ' || p_id_linea::TEXT 
                     WHEN p_id_lineas IS NOT NULL AND array_length(p_id_lineas, 1) > 0 THEN ' AND p2.id_linea = ANY(ARRAY[' || array_to_string(p_id_lineas, ',') || ']::numeric[])' 
                     ELSE '' END ||
                CASE WHEN p_id_sublinea IS NOT NULL THEN ' AND p2.id_sublinea = ' || p_id_sublinea::TEXT 
                     WHEN p_id_sublineas IS NOT NULL AND array_length(p_id_sublineas, 1) > 0 THEN ' AND p2.id_sublinea = ANY(ARRAY[' || array_to_string(p_id_sublineas, ',') || ']::numeric[])' 
                     ELSE '' END ||
                CASE WHEN p_id_marca IS NOT NULL THEN ' AND p2.id_marca = ' || p_id_marca::TEXT 
                     WHEN p_id_marcas IS NOT NULL AND array_length(p_id_marcas, 1) > 0 THEN ' AND p2.id_marca = ANY(ARRAY[' || array_to_string(p_id_marcas, ',') || ']::int[])' 
                     ELSE '' END ||
                CASE WHEN p_id_proveedor IS NOT NULL THEN ' AND p2.id_proveedor = ' || p_id_proveedor::TEXT 
                     WHEN p_id_proveedores IS NOT NULL AND array_length(p_id_proveedores, 1) > 0 THEN ' AND p2.id_proveedor = ANY(ARRAY[' || array_to_string(p_id_proveedores, ',') || ']::int[])' 
                     ELSE '' END ||
                CASE WHEN p_nombre_producto IS NOT NULL AND p_nombre_producto != '' THEN format(' AND UPPER(p2.nom_producto) LIKE UPPER(%L)', '%' || p_nombre_producto || '%') ELSE '' END ||
                CASE WHEN p_precio_min IS NOT NULL THEN ' AND p2.val_precio >= ' || p_precio_min::TEXT ELSE '' END ||
                CASE WHEN p_precio_max IS NOT NULL THEN ' AND p2.val_precio <= ' || p_precio_max::TEXT ELSE '' END ||
                CASE WHEN p_stock_min IS NOT NULL THEN ' AND p2.num_stock >= ' || p_stock_min::TEXT ELSE '' END ||
                CASE WHEN p_solo_con_stock = TRUE THEN ' AND p2.num_stock > 0' ELSE '' END || '
            ) as total_registros
        FROM tab_productos p
        LEFT JOIN tab_categorias c ON p.id_categoria = c.id_categoria
        LEFT JOIN tab_lineas l ON p.id_linea = l.id_linea AND p.id_categoria = l.id_categoria
        LEFT JOIN tab_sublineas s ON p.id_sublinea = s.id_sublinea AND p.id_linea = s.id_linea
        LEFT JOIN tab_proveedores pr ON p.id_proveedor = pr.id_proveedor
        LEFT JOIN tab_marcas m ON p.id_marca = m.id_marca
        ' || v_where_conditions || '
        ' || v_order_clause || '
        LIMIT ' || p_limit::TEXT || ' OFFSET ' || p_offset::TEXT;
    
    -- EJECUTAR QUERY Y RETORNAR RESULTADOS
    RETURN QUERY EXECUTE v_sql;

-- MANEJO DE ERRORES
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en filtrado de productos: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Ejemplos de uso:
-- 
-- 1. Buscar productos por nombre (búsqueda parcial)
-- SELECT * FROM fun_filter_products(p_nombre_producto := 'laptop');
--
-- 2. Filtrar por categoría y rango de precio
-- SELECT * FROM fun_filter_products(p_id_categoria := 1, p_precio_min := 100, p_precio_max := 500);
--
-- 3. Mostrar solo productos con stock, ordenados por precio
-- SELECT * FROM fun_filter_products(p_solo_con_stock := true, p_ordenar_por := 'precio', p_orden := 'ASC');
--
-- 4. Búsqueda completa con paginación
-- SELECT * FROM fun_filter_products(
--     p_id_categoria := 1,
--     p_nombre_producto := 'pro',
--     p_precio_min := 50,
--     p_solo_con_stock := true,
--     p_ordenar_por := 'precio',
--     p_orden := 'ASC',
--     p_limit := 20,
--     p_offset := 0
-- );
--
-- 5. NUEVOS: Filtrar por múltiples categorías usando array
-- SELECT * FROM fun_filter_products(p_id_categorias := ARRAY[1, 2, 3]);
--
-- 6. Filtrar por múltiples marcas usando array
-- SELECT * FROM fun_filter_products(p_id_marcas := ARRAY[1, 2, 3, 4]);
--
-- 7. Filtrar por múltiples líneas usando array
-- SELECT * FROM fun_filter_products(p_id_lineas := ARRAY[1, 2]);
--
-- 8. Filtrar por múltiples sublíneas usando array
-- SELECT * FROM fun_filter_products(p_id_sublineas := ARRAY[1, 2, 3, 4, 5]);
--
-- 9. Filtrar por múltiples proveedores usando array
-- SELECT * FROM fun_filter_products(p_id_proveedores := ARRAY[1, 2, 3]);
--
-- 10. Combinación de filtros únicos y arrays
-- SELECT * FROM fun_filter_products(
--     p_id_categorias := ARRAY[1, 2],           -- Múltiples categorías
--     p_id_marcas := ARRAY[1, 2, 3],           -- Múltiples marcas
--     p_precio_min := 100,                     -- Precio mínimo
--     p_solo_con_stock := true,                -- Solo con stock
--     p_ordenar_por := 'precio',
--     p_orden := 'ASC'
-- );

--SELECT fun_filter_products()