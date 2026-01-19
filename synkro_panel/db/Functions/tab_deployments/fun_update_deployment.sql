/*
 * FUNCIÓN: fun_update_deployment
 */
CREATE OR REPLACE FUNCTION fun_update_deployment(
    p_id_deployment tab_deployments.id_deployment%TYPE,
    p_usr_update tab_deployments.usr_update%TYPE,
    p_version_deploy tab_deployments.version_deploy%TYPE DEFAULT NULL,
    p_tipo_deploy tab_deployments.tipo_deploy%TYPE DEFAULT NULL,
    p_estado_deploy tab_deployments.estado_deploy%TYPE DEFAULT NULL,
    p_ambiente tab_deployments.ambiente%TYPE DEFAULT NULL,
    p_logs_deploy tab_deployments.logs_deploy%TYPE DEFAULT NULL,
    p_fecha_fin tab_deployments.fecha_fin%TYPE DEFAULT NULL,
    p_duracion_segundos tab_deployments.duracion_segundos%TYPE DEFAULT NULL
) RETURNS JSON AS
$$
BEGIN
    IF p_id_deployment IS NULL OR p_id_deployment <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID del deployment es obligatorio');
    END IF;

    IF p_usr_update IS NULL OR TRIM(p_usr_update) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El usuario que actualiza es obligatorio');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_deployments WHERE id_deployment = p_id_deployment) THEN
        RETURN json_build_object('success', false, 'message', 'El deployment no existe');
    END IF;

    UPDATE tab_deployments
    SET 
        version_deploy = COALESCE(p_version_deploy, version_deploy),
        tipo_deploy = COALESCE(p_tipo_deploy, tipo_deploy),
        estado_deploy = COALESCE(p_estado_deploy, estado_deploy),
        ambiente = COALESCE(p_ambiente, ambiente),
        logs_deploy = COALESCE(p_logs_deploy, logs_deploy),
        fecha_fin = COALESCE(p_fecha_fin, fecha_fin),
        duracion_segundos = COALESCE(p_duracion_segundos, duracion_segundos),
        usr_update = p_usr_update,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_deployment = p_id_deployment;

    RETURN json_build_object('success', true, 'message', 'Deployment actualizado correctamente', 'id_deployment', p_id_deployment);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
