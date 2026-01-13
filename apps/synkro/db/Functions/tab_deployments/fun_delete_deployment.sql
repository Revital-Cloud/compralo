/*
 * FUNCIÓN: fun_delete_deployment
 */
CREATE OR REPLACE FUNCTION fun_delete_deployment(
    p_id_deployment tab_deployments.id_deployment%TYPE
) RETURNS JSON AS
$$
BEGIN
    IF p_id_deployment IS NULL OR p_id_deployment <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID del deployment es obligatorio');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_deployments WHERE id_deployment = p_id_deployment) THEN
        RETURN json_build_object('success', false, 'message', 'El deployment no existe');
    END IF;

    DELETE FROM tab_deployments WHERE id_deployment = p_id_deployment;

    RETURN json_build_object('success', true, 'message', 'Deployment eliminado correctamente (soft delete)', 'id_deployment', p_id_deployment);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
