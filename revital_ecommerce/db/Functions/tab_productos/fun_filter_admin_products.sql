/*
 * FUNCIÓN: fun_get_all_products_admin
 * 
 * DESCRIPCIÓN: Función para obtener TODOS los productos (activos e inactivos) 
 *              para el panel de administración con paginación y ordenamiento.
 * 
 * PARÁMETROS:
 *   - p_ordenar_por: Campo para ordenar ('precio', 'nombre', 'stock', 'fecha', 'categoria', 'marca') (opcional)
 *   - p_orden: Dirección del orden ('ASC' o 'DESC') (opcional)
 *   - p_limit: Límite de resultados (opcional, default 50)
 *   - p_offset: Offset para paginación (opcional, default 0)
 * 
 * RETORNA: TABLE con información completa de productos (incluyendo estados de activación)
 * 
 * LÓGICA:
 *   1. Obtener TODOS los productos sin filtros de activación
 *   2. Incluir estados de activación de todas las tablas relacionadas
 *   3. Aplicar ordenamiento según parámetros
 *   4. Aplicar paginación
 *   5. Incluir conteo total de registros
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 * VERSIÓN: 1.0 - Función para administración
 */
CREATE OR REPLACE FUNCTION fun_get_all_products_admin(
    p_ordenar_por VARCHAR(20) DEFAULT 'nombre',
    p_orden VARCHAR(4) DEFAULT 'ASC',
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
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
    ind_activo_producto tab_productos.ind_activo%TYPE,
    ind_activo_categoria tab_categorias.ind_activo%TYPE,
    ind_activo_linea tab_lineas.ind_activo%TYPE,
    ind_activo_sublinea tab_sublineas.ind_activo%TYPE,
    ind_activo_proveedor tab_proveedores.ind_activo%TYPE,
    ind_activo_marca tab_marcas.ind_activo%TYPE,
    total_registros BIGINT
) AS $$
DECLARE
    v_sql TEXT;
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
    IF p_ordenar_por NOT IN ('precio', 'nombre', 'stock', 'fecha', 'categoria', 'marca') THEN
        p_ordenar_por := 'nombre';
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
        WHEN 'categoria' THEN
            v_order_clause := 'ORDER BY c.nom_categoria ' || UPPER(p_orden)::TEXT;
        WHEN 'marca' THEN
            v_order_clause := 'ORDER BY m.nom_marca ' || UPPER(p_orden)::TEXT;
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
            p.ind_activo as ind_activo_producto,
            c.ind_activo as ind_activo_categoria,
            l.ind_activo as ind_activo_linea,
            s.ind_activo as ind_activo_sublinea,
            pr.ind_activo as ind_activo_proveedor,
            m.ind_activo as ind_activo_marca,
            (SELECT COUNT(DISTINCT p2.id_categoria || ''-'' || p2.id_linea || ''-'' || p2.id_sublinea || ''-'' || p2.id_producto) 
             FROM tab_productos p2
             INNER JOIN tab_categorias c2 ON p2.id_categoria = c2.id_categoria
             INNER JOIN tab_lineas l2 ON p2.id_linea = l2.id_linea AND p2.id_categoria = l2.id_categoria
             INNER JOIN tab_sublineas s2 ON p2.id_sublinea = s2.id_sublinea AND p2.id_linea = s2.id_linea
             INNER JOIN tab_proveedores pr2 ON p2.id_proveedor = pr2.id_proveedor
             INNER JOIN tab_marcas m2 ON p2.id_marca = m2.id_marca
            ) as total_registros
        FROM tab_productos p
        INNER JOIN tab_categorias c ON p.id_categoria = c.id_categoria
        INNER JOIN tab_lineas l ON p.id_linea = l.id_linea AND p.id_categoria = l.id_categoria
        INNER JOIN tab_sublineas s ON p.id_sublinea = s.id_sublinea AND p.id_linea = s.id_linea
        INNER JOIN tab_proveedores pr ON p.id_proveedor = pr.id_proveedor
        INNER JOIN tab_marcas m ON p.id_marca = m.id_marca
        ' || v_order_clause || '
        LIMIT ' || p_limit::TEXT || ' OFFSET ' || p_offset::TEXT;
    
    -- EJECUTAR QUERY Y RETORNAR RESULTADOS
    RETURN QUERY EXECUTE v_sql;

-- MANEJO DE ERRORES
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en obtención de productos para admin: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Ejemplos de uso:
-- 
-- 1. Obtener todos los productos (primera página)
-- SELECT * FROM fun_get_all_products_admin();
--
-- 2. Obtener productos ordenados por precio descendente
-- SELECT * FROM fun_get_all_products_admin('precio', 'DESC');
--
-- 3. Obtener productos con paginación personalizada
-- SELECT * FROM fun_get_all_products_admin('nombre', 'ASC', 20, 40);
--
-- 4. Obtener productos ordenados por categoría
-- SELECT * FROM fun_get_all_products_admin('categoria', 'ASC');
--
-- 5. Obtener productos ordenados por marca
-- SELECT * FROM fun_get_all_products_admin('marca', 'ASC');
--
-- 6. Filtrar solo productos inactivos (desde el frontend)
-- SELECT * FROM fun_get_all_products_admin() WHERE ind_activo_producto = false;
--
-- 7. Filtrar productos con categorías inactivas
-- SELECT * FROM fun_get_all_products_admin() WHERE ind_activo_categoria = false;