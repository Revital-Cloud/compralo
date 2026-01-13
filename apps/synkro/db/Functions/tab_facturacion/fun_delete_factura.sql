/*
 * FUNCIÓN: fun_delete_factura
 */
CREATE OR REPLACE FUNCTION fun_delete_factura(
    p_id_factura tab_facturacion.id_factura%TYPE
) RETURNS JSON AS
$$
BEGIN
    IF p_id_factura IS NULL OR p_id_factura <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de la factura es obligatorio');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_facturacion WHERE id_factura = p_id_factura) THEN
        RETURN json_build_object('success', false, 'message', 'La factura no existe');
    END IF;

    DELETE FROM tab_facturacion WHERE id_factura = p_id_factura;

    RETURN json_build_object('success', true, 'message', 'Factura eliminada correctamente (soft delete)', 'id_factura', p_id_factura);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
