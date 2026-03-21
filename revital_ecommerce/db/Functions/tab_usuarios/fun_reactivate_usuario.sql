/*
 * FUNCIÓN: fun_reactivate_usuario
 *
 * DESCRIPCIÓN:
 *   Reactiva una cuenta previamente desactivada (soft delete) sin borrar
 *   registros relacionados. Establece:
 *     - ind_activo = TRUE
 *     - deleted_at = NULL
 *     - fec_update = NOW()
 *     - usr_update opcional (si se envía)
 *
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario a reactivar.
 *   - p_usr_update: (opcional) ID del usuario que realiza la operación.
 *
 * RETORNA:
 *   - VARCHAR con mensaje de éxito o error.
 */

-- ============================================================
-- Reactivar usuario
-- ============================================================
CREATE OR REPLACE FUNCTION fun_reactivate_usuario(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_usr_update tab_usuarios.usr_update%TYPE DEFAULT NULL
)
RETURNS VARCHAR AS
$$
BEGIN
    -- Verificar existencia
    IF NOT EXISTS (SELECT 1 FROM tab_usuarios WHERE id_usuario = p_id_usuario) THEN
        RETURN 'Error: Usuario no encontrado';
    END IF;

    UPDATE tab_usuarios
    SET ind_activo = TRUE,
        deleted_at = NULL,
        usr_update = COALESCE(p_usr_update, usr_update),
        fec_update = NOW()
    WHERE id_usuario = p_id_usuario;

    RETURN 'Usuario reactivado correctamente';
END;
$$ LANGUAGE plpgsql;

