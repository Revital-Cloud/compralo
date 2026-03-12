/*
 * FUNCIÓN: fun_soft_delete_usuario
 *
 * DESCRIPCIÓN:
 *   Marca la cuenta como desactivada sin borrar registros relacionados.
 *   ind_activo = FALSE, deleted_at = NOW(), actualiza auditoría.
 *
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario a desactivar.
 *   - p_usr_update: ID del usuario que realiza la operación (para auditoría).
 *
 * RETORNA:
 *   - VARCHAR con mensaje de éxito o error.
 */

-- ============================================================
-- Soft delete de usuario
-- ============================================================
CREATE OR REPLACE FUNCTION fun_soft_delete_usuario(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_usr_update tab_usuarios.usr_update%TYPE
)
RETURNS VARCHAR AS
$$
BEGIN
    -- Verificar existencia
    IF NOT EXISTS (SELECT 1 FROM tab_usuarios WHERE id_usuario = p_id_usuario) THEN
        RETURN 'Error: Usuario no encontrado';
    END IF;

    UPDATE tab_usuarios
    SET ind_activo = FALSE,
        deleted_at = NOW(),
        usr_update = p_usr_update,
        fec_update = NOW()
    WHERE id_usuario = p_id_usuario;

    RETURN 'Usuario desactivado correctamente';
END;
$$ LANGUAGE plpgsql;

