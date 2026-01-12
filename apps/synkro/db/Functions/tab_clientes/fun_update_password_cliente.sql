/*
 * FUNCIÓN: fun_update_password_cliente
 * 
 * DESCRIPCIÓN: Actualiza solo la contraseña de un cliente
 * 
 * PARÁMETROS:
 *   - p_identificacion_fiscal: Identificación fiscal del cliente (obligatorio)
 *   - p_password_cliente: Nuevo hash de la contraseña (Argon2) (obligatorio)
 *   - p_usr_update: Usuario que actualiza el registro (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación
 * 
 * AUTOR: Sistema DB_Synkro SaaS
 * FECHA: Enero 2026
 */
CREATE OR REPLACE FUNCTION fun_update_password_cliente(
    p_identificacion_fiscal tab_clientes.identificacion_fiscal%TYPE,
    p_password_cliente tab_clientes.password_cliente%TYPE,
    p_usr_update tab_clientes.usr_update%TYPE
) RETURNS JSON AS
$$
DECLARE
    v_cliente_existe INTEGER;
BEGIN
    -- Validación: Identificación fiscal
    IF p_identificacion_fiscal IS NULL OR TRIM(p_identificacion_fiscal) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La identificación fiscal es obligatoria'
        );
    END IF;

    -- Validación: Contraseña
    IF p_password_cliente IS NULL OR TRIM(p_password_cliente) = '' THEN
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

    -- Validar que el cliente existe y está activo
    SELECT COUNT(*) INTO v_cliente_existe
    FROM tab_clientes
    WHERE identificacion_fiscal = p_identificacion_fiscal
    AND ind_activo = true;

    IF v_cliente_existe = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El cliente no existe o no está activo'
        );
    END IF;

    -- Actualizar solo la contraseña
    UPDATE tab_clientes
    SET 
        password_cliente = p_password_cliente,
        usr_update = p_usr_update,
        fec_update = CURRENT_TIMESTAMP
    WHERE identificacion_fiscal = p_identificacion_fiscal;

    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Contraseña actualizada correctamente',
            'identificacion_fiscal', p_identificacion_fiscal
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
