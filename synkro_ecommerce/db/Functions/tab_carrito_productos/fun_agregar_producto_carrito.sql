/*
 * STORED PROCEDURE: fun_agregar_producto_carrito
 *
 * DESCRIPCIÓN: Agrega un producto al carrito o actualiza la cantidad si ya existe
 *              con las mismas opciones (color, talla, capacidad, etc.).
 *
 * PARÁMETROS:
 *   - p_opciones_elegidas: JSON con las opciones que el cliente eligió (ej. {"color": "rojo", "talla": "39"}).
 *                         Vacío '{}' si el producto no tiene opciones. Genérico para cualquier tipo de producto.
 *
 * RETORNA: JSON con success, message, id_carrito.
 */
CREATE OR REPLACE FUNCTION fun_agregar_producto_carrito(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_session_id tab_carritos.session_id%TYPE,
    p_id_categoria tab_productos.id_categoria%TYPE,
    p_id_linea tab_productos.id_linea%TYPE,
    p_id_sublinea tab_productos.id_sublinea%TYPE,
    p_id_producto tab_productos.id_producto%TYPE,
    p_cantidad tab_carrito_productos.cantidad%TYPE,
    p_usr_operacion tab_carrito_productos.usr_insert%TYPE,
    p_opciones_elegidas JSONB DEFAULT '{}'
) RETURNS JSON AS $$
DECLARE
    v_id_carrito tab_carritos.id_carrito%TYPE;
    v_precio_actual tab_productos.val_precio%TYPE;
    v_stock_disponible tab_productos.num_stock%TYPE;
    v_cantidad_actual tab_carrito_productos.cantidad%TYPE;
    v_usr_operacion_final tab_carrito_productos.usr_insert%TYPE;
BEGIN
    IF p_id_usuario IS NULL AND p_session_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Debe proporcionar id_usuario o session_id');
    END IF;

    IF p_usr_operacion IS NOT NULL THEN
        v_usr_operacion_final := p_usr_operacion;
    ELSIF p_id_usuario IS NOT NULL THEN
        v_usr_operacion_final := p_id_usuario;
    ELSE
        v_usr_operacion_final := ABS(hashtext(p_session_id))::DECIMAL(10);
    END IF;

    SELECT val_precio, num_stock INTO v_precio_actual, v_stock_disponible
    FROM tab_productos
    WHERE id_categoria = p_id_categoria AND id_linea = p_id_linea
      AND id_sublinea = p_id_sublinea AND id_producto = p_id_producto
      AND ind_activo = TRUE;

    IF v_precio_actual IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Producto no encontrado o no está disponible');
    END IF;

    v_id_carrito := fun_obtener_carrito_usuario(p_id_usuario, p_session_id);
    p_opciones_elegidas := COALESCE(p_opciones_elegidas, '{}'::JSONB);

    SELECT cantidad INTO v_cantidad_actual
    FROM tab_carrito_productos
    WHERE id_carrito = v_id_carrito 
      AND id_categoria_producto = p_id_categoria
      AND id_linea_producto = p_id_linea
      AND id_sublinea_producto = p_id_sublinea
      AND id_producto = p_id_producto
      AND COALESCE(opciones_elegidas, '{}'::JSONB) = p_opciones_elegidas;

    IF (COALESCE(v_cantidad_actual, 0) + p_cantidad) > v_stock_disponible THEN
        RETURN json_build_object('success', false, 'message', 'Stock insuficiente');
    END IF;

    INSERT INTO tab_carrito_productos (
        id_carrito, id_categoria_producto, id_linea_producto,
        id_sublinea_producto, id_producto, cantidad,
        precio_unitario_carrito, usr_insert, opciones_elegidas
    ) VALUES (
        v_id_carrito, p_id_categoria, p_id_linea, p_id_sublinea, p_id_producto,
        p_cantidad, v_precio_actual, v_usr_operacion_final, p_opciones_elegidas
    )
    ON CONFLICT (id_carrito, id_categoria_producto, id_linea_producto, id_sublinea_producto, id_producto, opciones_elegidas)
    DO UPDATE SET
        cantidad = tab_carrito_productos.cantidad + p_cantidad,
        precio_unitario_carrito = v_precio_actual,
        usr_update = v_usr_operacion_final;

    UPDATE tab_carritos SET fec_update = NOW(), usr_update = v_usr_operacion_final WHERE id_carrito = v_id_carrito;

    RETURN json_build_object('success', true, 'message', 'Producto agregado al carrito', 'id_carrito', v_id_carrito);
END;
$$ LANGUAGE plpgsql;
