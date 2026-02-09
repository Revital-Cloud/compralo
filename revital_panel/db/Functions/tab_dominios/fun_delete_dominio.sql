/*
 * FUNCIÓN: fun_delete_dominio
 */
CREATE OR REPLACE FUNCTION fun_delete_dominio(
    p_id_dominio tab_dominios.id_dominio%TYPE
) RETURNS JSON AS
$$
BEGIN
    IF p_id_dominio IS NULL OR p_id_dominio <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID del dominio es obligatorio');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_dominios WHERE id_dominio = p_id_dominio) THEN
        RETURN json_build_object('success', false, 'message', 'El dominio no existe');
    END IF;

    DELETE FROM tab_dominios WHERE id_dominio = p_id_dominio;

    RETURN json_build_object('success', true, 'message', 'Dominio eliminado correctamente (soft delete)', 'id_dominio', p_id_dominio);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
