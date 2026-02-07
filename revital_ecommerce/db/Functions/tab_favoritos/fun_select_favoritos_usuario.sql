/*
 * FUNCIÓN: fun_select_favoritos_usuario
 * 
 * DESCRIPCIÓN: Obtiene la lista completa de productos favoritos de un usuario específico
 *              ordenados por fecha de agregado más reciente primero.
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario para obtener favoritos (obligatorio)
 * 
 * RETORNA: TABLE - Tabla con los favoritos del usuario:
 *   - id_categoria_producto: ID de la categoría del producto
 *   - id_linea_producto: ID de la línea del producto
 *   - id_sublinea_producto: ID de la sublínea del producto
 *   - id_producto: ID del producto específico
 *   - fecha_agregado: Fecha cuando se agregó a favoritos
 * 
 * LÓGICA:
 *   1. Buscar todos los favoritos del usuario
 *   2. Ordenar por fecha de agregado descendente
 *   3. Retornar tabla con identificadores completos
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_select_favoritos_usuario_con_detalles(
    p_id_usuario tab_favoritos.id_usuario%TYPE
) RETURNS TABLE (
    id_usuario DECIMAL, -- Añadido para que coincida con el esquema Pydantic
    id_categoria_producto DECIMAL,
    id_linea_producto DECIMAL,
    id_sublinea_producto DECIMAL,
    id_producto DECIMAL,
	fec_insert TIMESTAMP, 		
    nom_producto VARCHAR,   -- Detalle del producto
    img_producto VARCHAR,   -- Detalle del producto
    val_precio DECIMAL      -- Detalle del producto
) AS
$$
BEGIN
    RETURN QUERY
    SELECT 
        tf.id_usuario,
        tf.id_categoria_producto,
        tf.id_linea_producto,
        tf.id_sublinea_producto,
        tf.id_producto,
		tf.fec_insert,
        tp.nom_producto,        -- Campo unido desde tab_productos
        tp.img_producto,        -- Campo unido desde tab_productos
        tp.val_precio           -- Campo unido desde tab_productos
    FROM 
        tab_favoritos tf
    JOIN 
        tab_productos tp ON tf.id_categoria_producto = tp.id_categoria
                       AND tf.id_linea_producto = tp.id_linea
                       AND tf.id_sublinea_producto = tp.id_sublinea
                       AND tf.id_producto = tp.id_producto
    WHERE 
        tf.id_usuario = p_id_usuario
    ORDER BY 
        tf.fec_insert DESC;
END;
$$
LANGUAGE plpgsql;

Select fun_select_favoritos_usuario(2);

Select * from tab_usuarios;
Select * from tab_categorias;
Select * from tab_lineas;
Select * from tab_sublineas;
Select * from tab_productos;
Select * from tab_favoritos;

