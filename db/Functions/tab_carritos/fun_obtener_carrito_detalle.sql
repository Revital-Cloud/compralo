/*
 * FUNCIÓN: fun_obtener_carrito_detalle
 * 
 * DESCRIPCIÓN: Obtiene el detalle completo del carrito de un usuario en formato JSON
 *              incluyendo productos, cantidades, precios, stock y metadatos del carrito.
 *              Soporta tanto usuarios registrados como usuarios anónimos.
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario registrado (opcional)
 *   - p_session_id: ID de sesión para usuarios anónimos (opcional)
 * 
 * RETORNA: JSON con estructura:
 *   {
 *     "id_carrito": number,
 *     "total_productos": number,
 *     "subtotal_carrito": number,
 *     "productos": [
 *       {
 *         "id_carrito_producto": number,
 *         "nombre_producto": string,
 *         "cantidad": number,
 *         "precio_unitario": number,
 *         "subtotal": number,
 *         "stock_disponible": number,
 *         "imagen_producto": string
 *       }
 *     ]
 *   }
 * 
 * DEPENDENCIAS:
 *   - fun_obtener_carrito_usuario(): Para obtener el ID del carrito
 *   - tab_carrito_productos: Tabla de productos en carrito
 *   - tab_productos: Tabla de productos maestro
 * 
 * NOTA: Al menos uno de los parámetros debe ser proporcionado
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2024
 */
CREATE OR REPLACE FUNCTION fun_obtener_carrito_detalle(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_session_id tab_carritos.session_id%TYPE
) RETURNS JSON AS $$
DECLARE
    -- Variable para almacenar el ID del carrito del usuario
    v_id_carrito INT;
    -- Variables para metadatos del carrito
    v_total_productos INT;
    v_subtotal_carrito DECIMAL(10,2);
    -- Variable para el JSON final
    v_resultado JSON;
BEGIN
    -- Obtener el ID del carrito del usuario (crea uno nuevo si no existe)
    v_id_carrito := fun_obtener_carrito_usuario(p_id_usuario, p_session_id);
    
    -- Construir el JSON con productos y metadatos
    SELECT 
        json_build_object(
            'id_carrito', v_id_carrito,
            'total_productos', COALESCE(COUNT(cp.id_carrito_producto), 0),
            'subtotal_carrito', COALESCE(SUM(cp.cantidad * cp.precio_unitario_carrito), 0),
            'productos', COALESCE(
                json_agg(
                    json_build_object(
                        'id_carrito_producto', cp.id_carrito_producto,
                        'nombre_producto', p.nom_producto,
                        'cantidad', cp.cantidad,
                        'precio_unitario', cp.precio_unitario_carrito,
                        'subtotal', (cp.cantidad * cp.precio_unitario_carrito),
                        'stock_disponible', p.num_stock,
                        'imagen_producto', p.img_producto
                    ) ORDER BY cp.fec_insert DESC
                ), 
                '[]'::json
            )
        ) INTO v_resultado
    FROM tab_carrito_productos cp
    -- JOIN con productos para obtener información actualizada
    JOIN tab_productos p ON (
        cp.id_categoria_producto = p.id_categoria AND
        cp.id_linea_producto = p.id_linea AND
        cp.id_sublinea_producto = p.id_sublinea AND
        cp.id_producto = p.id_producto
        AND p.ind_activo = TRUE  -- Filtrar solo productos activos
    )
    WHERE cp.id_carrito = v_id_carrito;                                      -- Filtrar por carrito específico
    
    -- Retornar el JSON resultante
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql; 