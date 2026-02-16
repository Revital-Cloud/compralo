/*
 * Obtiene el detalle del carrito con variant_id (combination id); join a variant_combinations/groups y products.
 */
CREATE OR REPLACE FUNCTION fun_obtener_carrito_detalle(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_session_id tab_carritos.session_id%TYPE
) RETURNS JSON AS $$
DECLARE
    v_id_carrito INT;
    v_resultado JSON;
BEGIN
    v_id_carrito := fun_obtener_carrito_usuario(p_id_usuario, p_session_id);

    SELECT json_build_object(
        'id_carrito', v_id_carrito,
        'total_productos', COALESCE(COUNT(cp.id_carrito_producto), 0),
        'subtotal_carrito', COALESCE(SUM(cp.cantidad * cp.precio_unitario_carrito), 0),
        'productos', COALESCE(
            json_agg(
                json_build_object(
                    'id_carrito_producto', cp.id_carrito_producto,
                    'variant_id', cp.variant_id,
                    'product_id', p.id,
                    'nombre_producto', p.name,
                    'cantidad', cp.cantidad,
                    'precio_unitario', cp.precio_unitario_carrito,
                    'subtotal', (cp.cantidad * cp.precio_unitario_carrito),
                    'stock_disponible', pv.stock,
                    'opciones_elegidas', COALESCE(cp.opciones_elegidas, '{}'::JSONB),
                    'imagen_producto', (SELECT pvi.image_url FROM tab_product_variant_images pvi WHERE pvi.variant_group_id = g.id ORDER BY pvi.sort_order, pvi.id LIMIT 1)
                ) ORDER BY cp.fec_insert DESC
            ),
            '[]'::json
        )
    ) INTO v_resultado
    FROM tab_carrito_productos cp
    JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id AND pv.is_active = TRUE
    JOIN tab_product_variant_groups g ON g.id = pv.group_id
    JOIN tab_products p ON p.id = g.product_id AND p.is_active = TRUE
    WHERE cp.id_carrito = v_id_carrito;

    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;
