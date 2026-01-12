/*
 * FUNCIÓN: fun_update_usuario_synkro
 * 
 * DESCRIPCIÓN: Actualiza un usuario administrador de Synkro existente
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario a actualizar (obligatorio)
 *   - p_nom_usuario: Nombre del usuario (opcional)
 *   - p_ape_usuario: Apellido del usuario (opcional)
 *   - p_email_usuario: Email del usuario (opcional, debe ser único)
 *   - p_password_usuario: Hash de la contraseña nueva (opcional, solo si se quiere cambiar)
 *   - p_rol_synkro: Rol del usuario (opcional)
 *   - p_ind_activo: Si el usuario puede acceder al panel (opcional)
 *   - p_usr_update: Usuario que actualiza el registro (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación
 * 
 * AUTOR: Sistema DB_Synkro SaaS
 * FECHA: Diciembre 2025
 */
CREATE OR REPLACE FUNCTION fun_update_usuario_synkro(
    p_id_usuario tab_usuarios_synkro.id_usuario%TYPE,
    p_nom_usuario tab_usuarios_synkro.nom_usuario%TYPE DEFAULT NULL,
    p_ape_usuario tab_usuarios_synkro.ape_usuario%TYPE DEFAULT NULL,
    p_email_usuario tab_usuarios_synkro.email_usuario%TYPE DEFAULT NULL,
    p_password_usuario tab_usuarios_synkro.password_usuario%TYPE DEFAULT NULL,
    p_rol_synkro tab_usuarios_synkro.rol_synkro%TYPE DEFAULT NULL,
    p_ind_activo tab_usuarios_synkro.ind_activo%TYPE DEFAULT NULL,
    p_usr_update tab_usuarios_synkro.usr_update%TYPE
) RETURNS JSON AS
$$
DECLARE
    v_usuario_existe INTEGER;
    v_email_existe INTEGER;
    v_email_actual VARCHAR;
BEGIN
    -- Validación: ID de usuario
    IF p_id_usuario IS NULL OR p_id_usuario <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El ID del usuario es obligatorio'
        );
    END IF;

    -- Validación: Usuario
    IF p_usr_update IS NULL OR TRIM(p_usr_update) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario que actualiza el registro es obligatorio'
        );
    END IF;

    -- Validar que el usuario existe
    SELECT COUNT(*), email_usuario INTO v_usuario_existe, v_email_actual
    FROM tab_usuarios_synkro
    WHERE id_usuario = p_id_usuario
    GROUP BY email_usuario;

    IF v_usuario_existe = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario no existe'
        );
    END IF;

    -- Validación: Email (si se proporciona)
    IF p_email_usuario IS NOT NULL THEN
        -- Validar formato de email
        IF NOT (p_email_usuario ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
            RETURN json_build_object(
                'success', false,
                'message', 'El formato del email no es válido'
            );
        END IF;

        -- Validar unicidad de email (solo si es diferente al actual)
        IF p_email_usuario != v_email_actual THEN
            SELECT COUNT(*) INTO v_email_existe
            FROM tab_usuarios_synkro
            WHERE email_usuario = p_email_usuario
            AND id_usuario != p_id_usuario;

            IF v_email_existe > 0 THEN
                RETURN json_build_object(
                    'success', false,
                    'message', 'Ya existe otro usuario con este email'
                );
            END IF;
        END IF;
    END IF;

    -- Validación: Rol (si se proporciona)
    IF p_rol_synkro IS NOT NULL THEN
        IF p_rol_synkro NOT IN ('admin_synkro', 'soporte', 'ventas') THEN
            RETURN json_build_object(
                'success', false,
                'message', 'El rol debe ser uno de: admin_synkro, soporte, ventas'
            );
        END IF;
    END IF;

    -- Actualizar usuario
    UPDATE tab_usuarios_synkro
    SET 
        nom_usuario = COALESCE(p_nom_usuario, nom_usuario),
        ape_usuario = COALESCE(p_ape_usuario, ape_usuario),
        email_usuario = COALESCE(p_email_usuario, email_usuario),
        password_usuario = COALESCE(p_password_usuario, password_usuario),
        rol_synkro = COALESCE(p_rol_synkro, rol_synkro),
        ind_activo = COALESCE(p_ind_activo, ind_activo),
        usr_update = p_usr_update,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_usuario = p_id_usuario;

    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Usuario administrador de Synkro actualizado correctamente',
            'id_usuario', p_id_usuario
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'No se pudo actualizar el usuario'
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al actualizar el usuario: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql;
