/*
 * Elimina una variante del carrito (total o cantidad indicada).
 * Parámetro: variant_id.
 */
CREATE OR REPLACE FUNCTION fun_eliminar_producto_carrito(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_session_id tab_carritos.session_id%TYPE,
    p_variant_id tab_product_variant_combinations.id%TYPE,
    p_cantidad tab_carrito_productos.cantidad%TYPE,
    p_usr_operacion tab_carrito_productos.usr_update%TYPE
) RETURNS JSON AS $$
DECLARE
    v_id_carrito tab_carritos.id_carrito%TYPE;
    v_cantidad_actual tab_carrito_productos.cantidad%TYPE;
    v_cantidad_eliminar tab_carrito_productos.cantidad%TYPE;
    v_cantidad_restante tab_carrito_productos.cantidad%TYPE;
    v_usr_final tab_carrito_productos.usr_update%TYPE;
BEGIN
    IF p_id_usuario IS NULL AND p_session_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Debe proporcionar id_usuario o session_id');
    END IF;
    IF p_variant_id IS NULL OR p_variant_id <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'variant_id es obligatorio');
    END IF;
    IF p_cantidad IS NOT NULL AND p_cantidad <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'La cantidad a eliminar debe ser mayor a 0');
    END IF;

    v_usr_final := COALESCE(p_usr_operacion, p_id_usuario, ABS(hashtext(p_session_id))::DECIMAL(10));
    v_id_carrito := fun_obtener_carrito_usuario(p_id_usuario, p_session_id);

    SELECT cantidad INTO v_cantidad_actual
    FROM tab_carrito_productos
    WHERE id_carrito = v_id_carrito AND variant_id = p_variant_id;

    IF v_cantidad_actual IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'El producto no está en el carrito');
    END IF;

    IF p_cantidad IS NULL THEN
        v_cantidad_eliminar := v_cantidad_actual;
        v_cantidad_restante := 0;
    ELSIF p_cantidad >= v_cantidad_actual THEN
        v_cantidad_eliminar := v_cantidad_actual;
        v_cantidad_restante := 0;
    ELSE
        v_cantidad_eliminar := p_cantidad;
        v_cantidad_restante := v_cantidad_actual - p_cantidad;
    END IF;

    IF v_cantidad_restante = 0 THEN
        DELETE FROM tab_carrito_productos
        WHERE id_carrito = v_id_carrito AND variant_id = p_variant_id;
    ELSE
        UPDATE tab_carrito_productos
        SET cantidad = v_cantidad_restante, usr_update = v_usr_final, fec_update = NOW()
        WHERE id_carrito = v_id_carrito AND variant_id = p_variant_id;
    END IF;

    UPDATE tab_carritos SET fec_update = NOW(), usr_update = v_usr_final WHERE id_carrito = v_id_carrito;

    RETURN json_build_object(
        'success', true,
        'message', CASE WHEN v_cantidad_restante = 0 THEN 'Producto eliminado del carrito' ELSE 'Cantidad reducida' END,
        'id_carrito', v_id_carrito,
        'cantidad_eliminada', v_cantidad_eliminar,
        'cantidad_restante', v_cantidad_restante
    );
END;
$$ LANGUAGE plpgsql;
