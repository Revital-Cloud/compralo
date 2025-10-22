CREATE OR REPLACE FUNCTION fun_delete_producto(p_id_producto INTEGER)
RETURNS JSON AS $$
DECLARE
    v_count_carrito INTEGER;
    v_count_ordenes INTEGER;
    v_result JSON;
    v_id_producto INTEGER := p_id_producto;
BEGIN
    -- Verificar si el producto existe
    IF NOT EXISTS (SELECT 1 FROM tab_productos WHERE id_producto = p_id_producto) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El producto no existe',
            'id_producto', p_id_producto
        );
    END IF;

    -- Verificar si el producto está en carritos
    SELECT COUNT(*) INTO v_count_carrito 
    FROM tab_carrito_productos cp
    WHERE cp.id_producto = v_id_producto;

    IF v_count_carrito > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se puede eliminar el producto porque está en carritos',
            'carritos_asociados', v_count_carrito,
            'id_producto', p_id_producto
        );
    END IF;

    -- Verificar si el producto tiene órdenes asociadas
    SELECT COUNT(*) INTO v_count_ordenes 
    FROM tab_orden_productos op
    INNER JOIN tab_ordenes o ON op.id_orden = o.id_orden
    WHERE op.id_producto = v_id_producto;

    IF v_count_ordenes > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se puede eliminar el producto porque tiene órdenes asociadas',
            'ordenes_asociadas', v_count_ordenes,
            'id_producto', p_id_producto
        );
    END IF;

    -- Eliminar el producto completamente
    DELETE FROM tab_productos 
    WHERE id_producto = v_id_producto;

    RETURN json_build_object(
        'success', true,
        'message', 'Producto eliminado exitosamente',
        'id_producto', p_id_producto
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al eliminar el producto: ' || SQLERRM,
            'id_producto', p_id_producto
        );
END;
$$ LANGUAGE plpgsql;
