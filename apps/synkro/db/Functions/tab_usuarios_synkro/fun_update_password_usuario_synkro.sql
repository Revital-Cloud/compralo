/*
 * FUNCIÓN: fun_update_password_usuario_synkro
 * 
 * DESCRIPCIÓN: Actualiza solo la contraseña de un usuario administrador de Synkro
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario (obligatorio)
 *   - p_password_usuario: Nuevo hash de la contraseña (Argon2) (obligatorio)
 *   - p_usr_update: Usuario que actualiza el registro (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación
 * 
 * AUTOR: Sistema DB_Synkro SaaS
 * FECHA: Enero 2026
 */
CREATE OR REPLACE FUNCTION fun_update_password_usuario_synkro(
    p_id_usuario tab_usuarios_synkro.id_usuario%TYPE,
    p_password_usuario tab_usuarios_synkro.password_usuario%TYPE,
    p_usr_update tab_usuarios_synkro.usr_update%TYPE
) RETURNS JSON AS
$$
DECLARE
    v_usuario_existe INTEGER;
BEGIN
    -- Validación: ID de usuario
    IF p_id_usuario IS NULL OR p_id_usuario <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El ID del usuario es obligatorio'
        );
    END IF;

    -- Validación: Contraseña
    IF p_password_usuario IS NULL OR TRIM(p_password_usuario) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La nueva contraseña (hash) es obligatoria'
        );
    END IF;

    -- Validación: Usuario
    IF p_usr_update IS NULL OR TRIM(p_usr_update) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario que actualiza el registro es obligatorio'
        );
    END IF;

    -- Validar que el usuario existe y está activo
    SELECT COUNT(*) INTO v_usuario_existe
    FROM tab_usuarios_synkro
    WHERE id_usuario = p_id_usuario
    AND ind_activo = true;

    IF v_usuario_existe = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario no existe o no está activo'
        );
    END IF;

    -- Actualizar solo la contraseña
    UPDATE tab_usuarios_synkro
    SET 
        password_usuario = p_password_usuario,
        usr_update = p_usr_update,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_usuario = p_id_usuario;

    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Contraseña actualizada correctamente',
            'id_usuario', p_id_usuario
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'No se pudo actualizar la contraseña'
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al actualizar la contraseña: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql;
