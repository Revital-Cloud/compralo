/*
 * FUNCIÓN: fun_delete_usuario_revital
 * 
 * DESCRIPCIÓN: Elimina un usuario administrador de Revital (soft delete)
 *              El registro se guarda en tab_reg_del mediante trigger
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario a eliminar (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación
 * 
 * NOTA: Esta función realiza un DELETE físico, pero el trigger
 *       de auditoría guarda el registro en tab_reg_del (soft delete)
 * 
 * AUTOR: Sistema DB_Revital SaaS
 * FECHA: Diciembre 2025
 */
CREATE OR REPLACE FUNCTION fun_delete_usuario_revital(
    p_id_usuario tab_usuarios_revital.id_usuario%TYPE
) RETURNS JSON AS
$$
DECLARE
    v_usuario_existe INTEGER;
    v_email_usuario VARCHAR;
    v_rol_revital enum_rol_revital;
    v_usuarios_admin_restantes INTEGER;
BEGIN
    -- Validación: ID de usuario
    IF p_id_usuario IS NULL OR p_id_usuario <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El ID del usuario es obligatorio'
        );
    END IF;

    -- Validar que el usuario existe y obtener información
    SELECT COUNT(*), email_usuario, rol_revital
    INTO v_usuario_existe, v_email_usuario, v_rol_revital
    FROM tab_usuarios_revital
    WHERE id_usuario = p_id_usuario
    GROUP BY email_usuario, rol_revital;

    IF v_usuario_existe = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario no existe'
        );
    END IF;

    -- Validación: No permitir eliminar el último admin_revital
    IF v_rol_revital = 'admin_revital' THEN
        SELECT COUNT(*) INTO v_usuarios_admin_restantes
        FROM tab_usuarios_revital
        WHERE rol_revital = 'admin_revital'
        AND id_usuario != p_id_usuario
        AND ind_activo = true;

        IF v_usuarios_admin_restantes = 0 THEN
            RETURN json_build_object(
                'success', false,
                'message', 'No se puede eliminar el último administrador activo del sistema'
            );
        END IF;
    END IF;

    -- Eliminar el usuario (el trigger guardará el registro en tab_reg_del)
    DELETE FROM tab_usuarios_revital
    WHERE id_usuario = p_id_usuario;

    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Usuario administrador de Revital eliminado correctamente (soft delete)',
            'id_usuario', p_id_usuario,
            'email_usuario', v_email_usuario
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'No se pudo eliminar el usuario'
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al eliminar el usuario: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql;
