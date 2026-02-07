/*
 * FUNCIÓN: fun_eliminar_metodo_pago
 * 
 * DESCRIPCIÓN: Elimina un método de pago guardado por un usuario.
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario (obligatorio)
 *   - p_id_metodo_pago: ID del método de pago a eliminar (obligatorio)
 * 
 * RETORNA: JSON - Resultado de la operación
 * 
 * LÓGICA:
 *   1. Valida que los parámetros no sean nulos.
 *   2. Elimina el método de pago si coincide el ID y pertenece al usuario.
 *   3. Informa si el método no fue encontrado.
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_eliminar_metodo_pago(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_id_metodo_pago tab_metodos_pago_usuario.id_metodo_pago%TYPE
) RETURNS JSON AS $$
DECLARE
    v_deleted_rows INT;
BEGIN
    -- VALIDACIONES
    IF p_id_usuario IS NULL OR p_id_metodo_pago IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'ID de usuario y ID de método de pago son obligatorios');
    END IF;

    -- ELIMINACIÓN
    DELETE FROM tab_metodos_pago_usuario
    WHERE
        id_usuario = p_id_usuario AND id_metodo_pago = p_id_metodo_pago;
    
    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;

    -- RESPUESTA
    IF v_deleted_rows = 0 THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'El método de pago no fue encontrado para este usuario.'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Método de pago eliminado exitosamente.'
    );

EXCEPTION 
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Error inesperado: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql; 