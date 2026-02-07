/*
 * FUNCIÓN: fun_actualizar_metodo_pago_default
 * 
 * DESCRIPCIÓN: Establece un método de pago como el predeterminado para un usuario.
 *              Automáticamente quita la marca de predeterminado de cualquier otro método.
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario (obligatorio)
 *   - p_id_metodo_pago: ID del método de pago a marcar como predeterminado (obligatorio)
 *   - p_usr_operacion: Usuario que realiza la operación (para auditoría)
 * 
 * RETORNA: JSON - Resultado de la operación
 * 
 * LÓGICA:
 *   1. Quita la marca 'is_default' de todos los métodos de pago del usuario.
 *   2. Establece la marca 'is_default' en el método de pago seleccionado.
 *   3. Valida que el método de pago pertenezca al usuario.
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_actualizar_metodo_pago_default(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_id_metodo_pago tab_metodos_pago_usuario.id_metodo_pago%TYPE,
    p_usr_operacion tab_usuarios.id_usuario%TYPE
) RETURNS JSON AS $$
DECLARE
    v_updated_rows INT;
BEGIN
    -- Quitar la marca de predeterminado de cualquier otro método del usuario
    UPDATE tab_metodos_pago_usuario
    SET 
        is_default = FALSE,
        usr_update = p_usr_operacion
    WHERE 
        id_usuario = p_id_usuario AND is_default = TRUE;

    -- Establecer el método seleccionado como predeterminado
    UPDATE tab_metodos_pago_usuario
    SET 
        is_default = TRUE,
        usr_update = p_usr_operacion
    WHERE 
        id_usuario = p_id_usuario AND id_metodo_pago = p_id_metodo_pago;

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

    -- RESPUESTA
    IF v_updated_rows = 0 THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'El método de pago no fue encontrado para este usuario.'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Método de pago predeterminado actualizado exitosamente.'
    );

EXCEPTION 
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Error inesperado: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql; 