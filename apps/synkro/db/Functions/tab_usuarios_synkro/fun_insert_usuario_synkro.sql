/*
 * FUNCIÓN: fun_insert_usuario_synkro
 * 
 * DESCRIPCIÓN: Inserta un nuevo usuario administrador de Synkro en el sistema
 * 
 * PARÁMETROS:
 *   - p_nom_usuario: Nombre del usuario (obligatorio)
 *   - p_ape_usuario: Apellido del usuario (obligatorio)
 *   - p_email_usuario: Email del usuario, debe ser único (obligatorio)
 *   - p_password_usuario: Hash de la contraseña (Argon2) (obligatorio)
 *   - p_rol_synkro: Rol del usuario (admin_synkro, soporte, ventas) (obligatorio)
 *   - p_ind_activo: Si el usuario puede acceder al panel (default: true)
 *   - p_usr_insert: Usuario que crea el registro (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación e id_usuario
 * 
 * AUTOR: Sistema DB_Synkro SaaS
 * FECHA: Diciembre 2025
 */
CREATE OR REPLACE FUNCTION fun_insert_usuario_synkro(
    p_nom_usuario tab_usuarios_synkro.nom_usuario%TYPE,
    p_ape_usuario tab_usuarios_synkro.ape_usuario%TYPE,
    p_email_usuario tab_usuarios_synkro.email_usuario%TYPE,
    p_password_usuario tab_usuarios_synkro.password_usuario%TYPE,
    p_rol_synkro tab_usuarios_synkro.rol_synkro%TYPE,
    p_ind_activo tab_usuarios_synkro.ind_activo%TYPE DEFAULT true,
    p_usr_insert tab_usuarios_synkro.usr_insert%TYPE
) RETURNS JSON AS
$$
DECLARE
    v_id_usuario DECIMAL(10,0);
    v_email_existe INTEGER;
BEGIN
    -- Validación: Nombre
    IF p_nom_usuario IS NULL OR TRIM(p_nom_usuario) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El nombre del usuario es obligatorio'
        );
    END IF;

    -- Validación: Apellido
    IF p_ape_usuario IS NULL OR TRIM(p_ape_usuario) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El apellido del usuario es obligatorio'
        );
    END IF;

    -- Validación: Email
    IF p_email_usuario IS NULL OR TRIM(p_email_usuario) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El email del usuario es obligatorio'
        );
    END IF;

    -- Validación: Formato de email
    IF NOT (p_email_usuario ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El formato del email no es válido'
        );
    END IF;

    -- Validación: Contraseña
    IF p_password_usuario IS NULL OR TRIM(p_password_usuario) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La contraseña (hash) es obligatoria'
        );
    END IF;

    -- Validación: Rol
    IF p_rol_synkro IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El rol del usuario es obligatorio'
        );
    END IF;

    -- Validar que el rol es válido
    IF p_rol_synkro NOT IN ('admin_synkro', 'soporte', 'ventas') THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El rol debe ser uno de: admin_synkro, soporte, ventas'
        );
    END IF;

    -- Validación: Usuario
    IF p_usr_insert IS NULL OR TRIM(p_usr_insert) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario que crea el registro es obligatorio'
        );
    END IF;

    -- Validar unicidad de email
    SELECT COUNT(*) INTO v_email_existe
    FROM tab_usuarios_synkro
    WHERE email_usuario = p_email_usuario;

    IF v_email_existe > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Ya existe un usuario con este email'
        );
    END IF;

    -- Insertar usuario
    INSERT INTO tab_usuarios_synkro (
        nom_usuario,
        ape_usuario,
        email_usuario,
        password_usuario,
        rol_synkro,
        ind_activo,
        usr_insert,
        fec_insert
    ) VALUES (
        p_nom_usuario,
        p_ape_usuario,
        p_email_usuario,
        p_password_usuario,
        p_rol_synkro,
        COALESCE(p_ind_activo, true),
        p_usr_insert,
        CURRENT_TIMESTAMP
    ) RETURNING id_usuario INTO v_id_usuario;

    RETURN json_build_object(
        'success', true,
        'message', 'Usuario administrador de Synkro insertado correctamente',
        'id_usuario', v_id_usuario,
        'email_usuario', p_email_usuario
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al insertar el usuario: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql;
