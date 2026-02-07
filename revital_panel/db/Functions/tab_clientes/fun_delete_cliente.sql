/*
 * FUNCIÓN: fun_delete_cliente
 * 
 * DESCRIPCIÓN: Elimina un cliente (soft delete)
 *              El registro se guarda en tab_reg_del mediante trigger
 * 
 * PARÁMETROS:
 *   - p_identificacion_fiscal: Identificación fiscal del cliente a eliminar (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación
 * 
 * NOTA: Esta función realiza un DELETE físico, pero el trigger
 *       de auditoría guarda el registro en tab_reg_del (soft delete)
 * 
 * AUTOR: Sistema DB_Revital SaaS
 * FECHA: 2026
 */
CREATE OR REPLACE FUNCTION fun_delete_cliente(
    p_identificacion_fiscal tab_clientes.identificacion_fiscal%TYPE
) RETURNS JSON AS
$$
DECLARE
    v_cliente_existe INTEGER;
    v_instancias_activas INTEGER;
    v_suscripciones_activas INTEGER;
BEGIN
    -- Validación: Identificación fiscal
    IF p_identificacion_fiscal IS NULL OR TRIM(p_identificacion_fiscal) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La identificación fiscal es obligatoria'
        );
    END IF;

    -- Validación: Verificar si el cliente existe
    SELECT COUNT(*) INTO v_cliente_existe
    FROM tab_clientes
    WHERE identificacion_fiscal = p_identificacion_fiscal;

    IF v_cliente_existe = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El cliente no existe'
        );
    END IF;

    -- Validación: Verificar si hay instancias activas
    SELECT COUNT(*) INTO v_instancias_activas
    FROM tab_instancias
    WHERE identificacion_fiscal_cliente = p_identificacion_fiscal
    AND estado_instancia = 'activa';

    IF v_instancias_activas > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se puede eliminar el cliente porque tiene instancias activas',
            'instancias_activas', v_instancias_activas
        );
    END IF;

    -- Validación: Verificar si hay suscripciones activas
    SELECT COUNT(*) INTO v_suscripciones_activas
    FROM tab_suscripciones
    WHERE identificacion_fiscal_cliente = p_identificacion_fiscal
    AND estado_suscripcion = 'activa';

    IF v_suscripciones_activas > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se puede eliminar el cliente porque tiene suscripciones activas',
            'suscripciones_activas', v_suscripciones_activas
        );
    END IF;

    -- Eliminar el cliente (el trigger guardará el registro en tab_reg_del)
    DELETE FROM tab_clientes
    WHERE identificacion_fiscal = p_identificacion_fiscal;

    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Cliente eliminado correctamente (soft delete)',
            'identificacion_fiscal', p_identificacion_fiscal
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'No se pudo eliminar el cliente'
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al eliminar el cliente: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql;
