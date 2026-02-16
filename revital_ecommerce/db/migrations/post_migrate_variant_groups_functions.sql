/*
 * Ejecutar DESPUÉS de migrate_to_variant_groups.sql.
 * Actualiza funciones que referenciaban tab_product_variants/tab_product_images
 * para usar tab_product_variant_combinations y tab_product_variant_groups/tab_product_variant_images.
 */

-- fun_agregar_producto_carrito: variant_id ahora es tab_product_variant_combinations.id
CREATE OR REPLACE FUNCTION fun_agregar_producto_carrito(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_session_id tab_carritos.session_id%TYPE,
    p_variant_id tab_product_variant_combinations.id%TYPE,
    p_cantidad tab_carrito_productos.cantidad%TYPE,
    p_opciones_elegidas JSONB DEFAULT '{}'::JSONB,
    p_usr_operacion tab_carrito_productos.usr_insert%TYPE DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_id_carrito tab_carritos.id_carrito%TYPE;
    v_precio tab_product_variant_combinations.price%TYPE;
    v_stock tab_product_variant_combinations.stock%TYPE;
    v_cantidad_actual tab_carrito_productos.cantidad%TYPE;
    v_usr_final tab_carrito_productos.usr_insert%TYPE;
BEGIN
    IF p_id_usuario IS NULL AND p_session_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Debe proporcionar id_usuario o session_id');
    END IF;

    v_usr_final := COALESCE(p_usr_operacion, p_id_usuario, ABS(hashtext(p_session_id))::DECIMAL(10));

    SELECT price, stock INTO v_precio, v_stock
    FROM tab_product_variant_combinations
    WHERE id = p_variant_id AND is_active = TRUE;

    IF v_precio IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Variante no encontrada o no disponible');
    END IF;

    v_id_carrito := fun_obtener_carrito_usuario(p_id_usuario, p_session_id);

    SELECT cantidad INTO v_cantidad_actual
    FROM tab_carrito_productos
    WHERE id_carrito = v_id_carrito AND variant_id = p_variant_id;

    IF (COALESCE(v_cantidad_actual, 0) + p_cantidad) > v_stock THEN
        RETURN json_build_object('success', false, 'message', 'Stock insuficiente');
    END IF;

    INSERT INTO tab_carrito_productos (
        id_carrito, variant_id, cantidad, precio_unitario_carrito, opciones_elegidas, usr_insert
    ) VALUES (
        v_id_carrito, p_variant_id, p_cantidad, v_precio, COALESCE(p_opciones_elegidas, '{}'::JSONB), v_usr_final
    )
    ON CONFLICT (id_carrito, variant_id)
    DO UPDATE SET
        cantidad = tab_carrito_productos.cantidad + p_cantidad,
        precio_unitario_carrito = v_precio,
        opciones_elegidas = COALESCE(EXCLUDED.opciones_elegidas, tab_carrito_productos.opciones_elegidas, '{}'::JSONB),
        usr_update = v_usr_final,
        fec_update = NOW();

    UPDATE tab_carritos SET fec_update = NOW(), usr_update = v_usr_final WHERE id_carrito = v_id_carrito;

    RETURN json_build_object('success', true, 'message', 'Producto agregado al carrito', 'id_carrito', v_id_carrito);
END;
$$ LANGUAGE plpgsql;
