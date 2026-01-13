/*
 * FUNCIÓN: fun_update_dominio
 */
CREATE OR REPLACE FUNCTION fun_update_dominio(
    p_id_dominio tab_dominios.id_dominio%TYPE,
    p_estado_dominio tab_dominios.estado_dominio%TYPE DEFAULT NULL,
    p_ssl_habilitado tab_dominios.ssl_habilitado%TYPE DEFAULT NULL,
    p_fecha_ssl_emision tab_dominios.fecha_ssl_emision%TYPE DEFAULT NULL,
    p_fecha_ssl_vencimiento tab_dominios.fecha_ssl_vencimiento%TYPE DEFAULT NULL,
    p_usr_update tab_dominios.usr_update%TYPE
) RETURNS JSON AS
$$
BEGIN
    IF p_id_dominio IS NULL OR p_id_dominio <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID del dominio es obligatorio');
    END IF;

    IF p_usr_update IS NULL OR TRIM(p_usr_update) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El usuario que actualiza es obligatorio');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_dominios WHERE id_dominio = p_id_dominio) THEN
        RETURN json_build_object('success', false, 'message', 'El dominio no existe');
    END IF;

    UPDATE tab_dominios
    SET 
        estado_dominio = COALESCE(p_estado_dominio, estado_dominio),
        ssl_habilitado = COALESCE(p_ssl_habilitado, ssl_habilitado),
        fecha_ssl_emision = COALESCE(p_fecha_ssl_emision, fecha_ssl_emision),
        fecha_ssl_vencimiento = COALESCE(p_fecha_ssl_vencimiento, fecha_ssl_vencimiento),
        usr_update = p_usr_update,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_dominio = p_id_dominio;

    RETURN json_build_object('success', true, 'message', 'Dominio actualizado correctamente', 'id_dominio', p_id_dominio);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
