/*
 * FUNCIÓN: fun_update_instancia
 * 
 * DESCRIPCIÓN: Actualiza una instancia existente
 */
CREATE OR REPLACE FUNCTION fun_update_instancia(
    p_id_instancia tab_instancias.id_instancia%TYPE,
    p_nom_instancia tab_instancias.nom_instancia%TYPE DEFAULT NULL,
    p_subdominio tab_instancias.subdominio%TYPE DEFAULT NULL,
    p_dominio_personalizado tab_instancias.dominio_personalizado%TYPE DEFAULT NULL,
    p_estado_instancia tab_instancias.estado_instancia%TYPE DEFAULT NULL,
    p_version_instancia tab_instancias.version_instancia%TYPE DEFAULT NULL,
    p_db_host tab_instancias.db_host%TYPE DEFAULT NULL,
    p_db_puerto tab_instancias.db_puerto%TYPE DEFAULT NULL,
    p_db_usuario tab_instancias.db_usuario%TYPE DEFAULT NULL,
    p_backend_url tab_instancias.backend_url%TYPE DEFAULT NULL,
    p_frontend_url tab_instancias.frontend_url%TYPE DEFAULT NULL,
    p_region_deployment tab_instancias.region_deployment%TYPE DEFAULT NULL,
    p_config_json tab_instancias.config_json%TYPE DEFAULT NULL,
    p_fecha_ultimo_deploy tab_instancias.fecha_ultimo_deploy%TYPE DEFAULT NULL,
    p_usr_update tab_instancias.usr_update%TYPE
) RETURNS JSON AS
$$
BEGIN
    IF p_id_instancia IS NULL OR p_id_instancia <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de la instancia es obligatorio');
    END IF;

    IF p_usr_update IS NULL OR TRIM(p_usr_update) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El usuario que actualiza es obligatorio');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_instancias WHERE id_instancia = p_id_instancia) THEN
        RETURN json_build_object('success', false, 'message', 'La instancia no existe');
    END IF;

    UPDATE tab_instancias
    SET 
        nom_instancia = COALESCE(p_nom_instancia, nom_instancia),
        subdominio = COALESCE(p_subdominio, subdominio),
        dominio_personalizado = COALESCE(p_dominio_personalizado, dominio_personalizado),
        estado_instancia = COALESCE(p_estado_instancia, estado_instancia),
        version_instancia = COALESCE(p_version_instancia, version_instancia),
        db_host = COALESCE(p_db_host, db_host),
        db_puerto = COALESCE(p_db_puerto, db_puerto),
        db_usuario = COALESCE(p_db_usuario, db_usuario),
        backend_url = COALESCE(p_backend_url, backend_url),
        frontend_url = COALESCE(p_frontend_url, frontend_url),
        region_deployment = COALESCE(p_region_deployment, region_deployment),
        config_json = COALESCE(p_config_json, config_json),
        fecha_ultimo_deploy = COALESCE(p_fecha_ultimo_deploy, fecha_ultimo_deploy),
        usr_update = p_usr_update,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_instancia = p_id_instancia;

    RETURN json_build_object('success', true, 'message', 'Instancia actualizada correctamente', 'id_instancia', p_id_instancia);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
