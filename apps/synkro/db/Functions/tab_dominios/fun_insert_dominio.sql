/*
 * FUNCIÓN: fun_insert_dominio
 */
CREATE OR REPLACE FUNCTION fun_insert_dominio(
    p_id_instancia tab_dominios.id_instancia%TYPE,
    p_nom_dominio tab_dominios.nom_dominio%TYPE,
    p_tipo_dominio tab_dominios.tipo_dominio%TYPE DEFAULT 'subdominio',
    p_estado_dominio tab_dominios.estado_dominio%TYPE DEFAULT 'pendiente',
    p_ssl_habilitado tab_dominios.ssl_habilitado%TYPE DEFAULT FALSE,
    p_fecha_ssl_emision tab_dominios.fecha_ssl_emision%TYPE DEFAULT NULL,
    p_fecha_ssl_vencimiento tab_dominios.fecha_ssl_vencimiento%TYPE DEFAULT NULL,
    p_usr_insert tab_dominios.usr_insert%TYPE
) RETURNS JSON AS
$$
DECLARE
    v_id_dominio DECIMAL(10,0);
    v_dominio_existe INTEGER;
BEGIN
    IF p_id_instancia IS NULL OR p_id_instancia <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de la instancia es obligatorio');
    END IF;

    IF p_nom_dominio IS NULL OR TRIM(p_nom_dominio) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El nombre del dominio es obligatorio');
    END IF;

    IF p_usr_insert IS NULL OR TRIM(p_usr_insert) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El usuario que crea el registro es obligatorio');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_instancias WHERE id_instancia = p_id_instancia) THEN
        RETURN json_build_object('success', false, 'message', 'La instancia no existe');
    END IF;

    SELECT COUNT(*) INTO v_dominio_existe FROM tab_dominios WHERE nom_dominio = p_nom_dominio;
    IF v_dominio_existe > 0 THEN
        RETURN json_build_object('success', false, 'message', 'Ya existe un dominio con este nombre');
    END IF;

    INSERT INTO tab_dominios (
        id_instancia, nom_dominio, tipo_dominio, estado_dominio,
        ssl_habilitado, fecha_ssl_emision, fecha_ssl_vencimiento, usr_insert, fec_insert
    ) VALUES (
        p_id_instancia, p_nom_dominio, p_tipo_dominio, p_estado_dominio,
        p_ssl_habilitado, p_fecha_ssl_emision, p_fecha_ssl_vencimiento, p_usr_insert, CURRENT_TIMESTAMP
    ) RETURNING id_dominio INTO v_id_dominio;

    RETURN json_build_object('success', true, 'message', 'Dominio insertado correctamente', 'id_dominio', v_id_dominio);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
