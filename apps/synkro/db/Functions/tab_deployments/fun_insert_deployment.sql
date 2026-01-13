/*
 * FUNCIÓN: fun_insert_deployment
 */
CREATE OR REPLACE FUNCTION fun_insert_deployment(
    p_id_instancia tab_deployments.id_instancia%TYPE,
    p_version_deploy tab_deployments.version_deploy%TYPE,
    p_tipo_deploy tab_deployments.tipo_deploy%TYPE DEFAULT 'manual',
    p_estado_deploy tab_deployments.estado_deploy%TYPE DEFAULT 'iniciado',
    p_ambiente tab_deployments.ambiente%TYPE DEFAULT 'produccion',
    p_logs_deploy tab_deployments.logs_deploy%TYPE DEFAULT NULL,
    p_fecha_inicio tab_deployments.fecha_inicio%TYPE DEFAULT CURRENT_TIMESTAMP,
    p_iniciado_por tab_deployments.iniciado_por%TYPE DEFAULT NULL,
    p_usr_insert tab_deployments.usr_insert%TYPE
) RETURNS JSON AS
$$
DECLARE
    v_id_deployment DECIMAL(10,0);
BEGIN
    IF p_id_instancia IS NULL OR p_id_instancia <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de la instancia es obligatorio');
    END IF;

    IF p_version_deploy IS NULL OR TRIM(p_version_deploy) = '' THEN
        RETURN json_build_object('success', false, 'message', 'La versión del deployment es obligatoria');
    END IF;

    IF p_usr_insert IS NULL OR TRIM(p_usr_insert) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El usuario que crea el registro es obligatorio');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_instancias WHERE id_instancia = p_id_instancia) THEN
        RETURN json_build_object('success', false, 'message', 'La instancia no existe');
    END IF;

    INSERT INTO tab_deployments (
        id_instancia, version_deploy, tipo_deploy, estado_deploy, ambiente,
        logs_deploy, fecha_inicio, iniciado_por, usr_insert, fec_insert
    ) VALUES (
        p_id_instancia, p_version_deploy, p_tipo_deploy, p_estado_deploy, p_ambiente,
        p_logs_deploy, p_fecha_inicio, p_iniciado_por, p_usr_insert, CURRENT_TIMESTAMP
    ) RETURNING id_deployment INTO v_id_deployment;

    RETURN json_build_object('success', true, 'message', 'Deployment insertado correctamente', 'id_deployment', v_id_deployment);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
