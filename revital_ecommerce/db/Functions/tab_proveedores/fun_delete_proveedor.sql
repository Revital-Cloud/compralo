CREATE OR REPLACE FUNCTION fun_delete_proveedor(p_id_proveedor INTEGER)
RETURNS JSON AS $$
DECLARE
    v_count_productos INTEGER;
    v_count_ordenes_compra INTEGER;
    v_result JSON;
    v_id_proveedor INTEGER := p_id_proveedor;
BEGIN
    -- Verificar si el proveedor existe
    IF NOT EXISTS (SELECT 1 FROM tab_proveedores WHERE id_proveedor = p_id_proveedor) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El proveedor no existe',
            'id_proveedor', p_id_proveedor
        );
    END IF;

    -- Verificar si el proveedor tiene productos asociados
    SELECT COUNT(1) INTO v_count_productos 
    FROM tab_productos 
    WHERE id_proveedor = v_id_proveedor AND ind_activo = true;

    IF v_count_productos > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se puede eliminar el proveedor porque tiene productos asociados',
            'productos_asociados', v_count_productos,
            'id_proveedor', p_id_proveedor
        );
    END IF;

    -- Verificar si el proveedor tiene órdenes de compra asociadas
    SELECT COUNT(1) INTO v_count_ordenes_compra 
    FROM tab_orden_compra_proveedor 
    WHERE id_proveedor = v_id_proveedor;

    IF v_count_ordenes_compra > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se puede eliminar el proveedor porque tiene órdenes de compra asociadas',
            'ordenes_compra_asociadas', v_count_ordenes_compra,
            'id_proveedor', p_id_proveedor
        );
    END IF;

    -- Eliminar el proveedor completamente
    DELETE FROM tab_proveedores 
    WHERE id_proveedor = v_id_proveedor;

    RETURN json_build_object(
        'success', true,
        'message', 'Proveedor eliminado exitosamente',
        'id_proveedor', p_id_proveedor
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al eliminar el proveedor: ' || SQLERRM,
            'id_proveedor', p_id_proveedor
        );
END;
$$ LANGUAGE plpgsql;
