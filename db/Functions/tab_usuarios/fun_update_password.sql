CREATE OR REPLACE FUNCTION fun_update_password_usuario(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_nueva_password tab_usuarios.password_usuario%TYPE,
    p_usr_operacion tab_usuarios.id_usuario%TYPE
) RETURNS BOOLEAN AS $$
BEGIN
    -- Actualiza la contraseña solo si el usuario existe y está activo
    UPDATE tab_usuarios
    SET password_usuario = p_nueva_password,
        usr_update = p_usr_operacion
    WHERE id_usuario = p_id_usuario;

    -- Verifica si se actualizó alguna fila
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;