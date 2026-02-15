/*
 * Migra el carrito anónimo al carrito del usuario registrado.
 * Usa variant_id en tab_carrito_productos; actualiza precio desde product_variants.
 */
CREATE OR REPLACE FUNCTION fun_migrar_carrito_anonimo_a_usuario(
    p_id_carrito_anonimo tab_carritos.id_carrito%TYPE,
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_usr_operacion tab_carritos.usr_insert%TYPE
) RETURNS JSON AS $$
DECLARE
    v_id_carrito_usuario tab_carritos.id_carrito%TYPE;
    v_item RECORD;
    v_precio DECIMAL(12,2);
BEGIN
    v_id_carrito_usuario := fun_obtener_carrito_usuario(p_id_usuario, NULL);

    FOR v_item IN
        SELECT variant_id, cantidad, precio_unitario_carrito
        FROM tab_carrito_productos
        WHERE id_carrito = p_id_carrito_anonimo
    LOOP
        SELECT price INTO v_precio
        FROM tab_product_variants
        WHERE id = v_item.variant_id AND is_active = TRUE;
        v_precio := COALESCE(v_precio, v_item.precio_unitario_carrito);

        INSERT INTO tab_carrito_productos (id_carrito, variant_id, cantidad, precio_unitario_carrito, usr_insert)
        VALUES (v_id_carrito_usuario, v_item.variant_id, v_item.cantidad, v_precio, COALESCE(p_usr_operacion, p_id_usuario))
        ON CONFLICT (id_carrito, variant_id)
        DO UPDATE SET
            cantidad = tab_carrito_productos.cantidad + v_item.cantidad,
            precio_unitario_carrito = v_precio,
            usr_update = p_usr_operacion,
            fec_update = NOW();
    END LOOP;

    DELETE FROM tab_carrito_productos WHERE id_carrito = p_id_carrito_anonimo;
    DELETE FROM tab_carritos WHERE id_carrito = p_id_carrito_anonimo;

    RETURN json_build_object('success', true, 'message', 'Carrito migrado exitosamente');
END;
$$ LANGUAGE plpgsql;
