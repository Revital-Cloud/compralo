/*
 * FUNCIÓN: fun_update_cliente
 * 
 * DESCRIPCIÓN: Actualiza un cliente existente
 * 
 * PARÁMETROS:
 *   - p_identificacion_fiscal: Identificación fiscal del cliente a actualizar (PK, obligatorio)
 *   - p_tipo_identificacion: Tipo de identificación (opcional)
 *   - p_nom_empresa: Nombre de la empresa (opcional)
 *   - p_email_contacto: Email de contacto (opcional)
 *   - p_telefono_contacto: Teléfono de contacto (opcional)
 *   - p_direccion_empresa: Dirección de la empresa (opcional)
 *   - p_ciudad: Ciudad (opcional)
 *   - p_pais: País (opcional)
 *   - p_nom_contacto_principal: Nombre del contacto principal (opcional)
 *   - p_email_contacto_principal: Email del contacto principal (opcional)
 *   - p_telefono_contacto_principal: Teléfono del contacto principal (opcional)
 *   - p_estado_cliente: Estado del cliente (opcional)
 *   - p_fecha_ultimo_acceso: Fecha de último acceso (opcional)
 *   - p_notas_internas: Notas internas (opcional)
 *   - p_password_cliente: Hash de la contraseña nueva (opcional, solo si se quiere cambiar)
 *   - p_ind_activo: Si el cliente puede acceder al panel (opcional)
 *   - p_usr_update: Usuario que actualiza el registro (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación
 * 
 * AUTOR: Sistema DB_Revital SaaS
 * FECHA: Enero 2026
 */
CREATE OR REPLACE FUNCTION fun_update_cliente(
    p_identificacion_fiscal tab_clientes.identificacion_fiscal%TYPE,
    p_usr_update tab_clientes.usr_update%TYPE,
    p_tipo_identificacion tab_clientes.tipo_identificacion%TYPE DEFAULT NULL,
    p_nom_empresa tab_clientes.nom_empresa%TYPE DEFAULT NULL,
    p_email_contacto tab_clientes.email_contacto%TYPE DEFAULT NULL,
    p_telefono_contacto tab_clientes.telefono_contacto%TYPE DEFAULT NULL,
    p_direccion_empresa tab_clientes.direccion_empresa%TYPE DEFAULT NULL,
    p_ciudad tab_clientes.ciudad%TYPE DEFAULT NULL,
    p_pais tab_clientes.pais%TYPE DEFAULT NULL,
    p_nom_contacto_principal tab_clientes.nom_contacto_principal%TYPE DEFAULT NULL,
    p_email_contacto_principal tab_clientes.email_contacto_principal%TYPE DEFAULT NULL,
    p_telefono_contacto_principal tab_clientes.telefono_contacto_principal%TYPE DEFAULT NULL,
    p_estado_cliente tab_clientes.estado_cliente%TYPE DEFAULT NULL,
    p_fecha_ultimo_acceso tab_clientes.fecha_ultimo_acceso%TYPE DEFAULT NULL,
    p_notas_internas tab_clientes.notas_internas%TYPE DEFAULT NULL,
    p_password_cliente tab_clientes.password_cliente%TYPE DEFAULT NULL,
    p_ind_activo tab_clientes.ind_activo%TYPE DEFAULT NULL
) RETURNS JSON AS
$$
DECLARE
    v_cliente_existe INTEGER;
    v_email_existe INTEGER;
    v_email_actual VARCHAR;
BEGIN
    -- Validación: Identificación fiscal
    IF p_identificacion_fiscal IS NULL OR TRIM(p_identificacion_fiscal) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La identificación fiscal es obligatoria'
        );
    END IF;

    -- Validación: Usuario
    IF p_usr_update IS NULL OR TRIM(p_usr_update) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario que actualiza el registro es obligatorio'
        );
    END IF;

    -- Validación: Verificar si el cliente existe y obtener email actual
    SELECT COUNT(*), email_contacto_principal INTO v_cliente_existe, v_email_actual
    FROM tab_clientes
    WHERE identificacion_fiscal = p_identificacion_fiscal
    GROUP BY email_contacto_principal;

    IF v_cliente_existe = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El cliente no existe'
        );
    END IF;

    -- Validación: Verificar unicidad de email si se está cambiando
    IF p_email_contacto_principal IS NOT NULL AND p_email_contacto_principal != v_email_actual THEN
        SELECT COUNT(*) INTO v_email_existe
        FROM tab_clientes
        WHERE email_contacto_principal = p_email_contacto_principal
        AND identificacion_fiscal != p_identificacion_fiscal;

        IF v_email_existe > 0 THEN
            RETURN json_build_object(
                'success', false,
                'message', 'Ya existe otro cliente con este email de contacto principal'
            );
        END IF;
    END IF;

    -- Actualizar el cliente (solo los campos proporcionados)
    UPDATE tab_clientes
    SET 
        tipo_identificacion = COALESCE(p_tipo_identificacion, tipo_identificacion),
        nom_empresa = COALESCE(p_nom_empresa, nom_empresa),
        email_contacto = COALESCE(p_email_contacto, email_contacto),
        telefono_contacto = COALESCE(p_telefono_contacto, telefono_contacto),
        direccion_empresa = COALESCE(p_direccion_empresa, direccion_empresa),
        ciudad = COALESCE(p_ciudad, ciudad),
        pais = COALESCE(p_pais, pais),
        nom_contacto_principal = COALESCE(p_nom_contacto_principal, nom_contacto_principal),
        email_contacto_principal = COALESCE(p_email_contacto_principal, email_contacto_principal),
        telefono_contacto_principal = COALESCE(p_telefono_contacto_principal, telefono_contacto_principal),
        estado_cliente = COALESCE(p_estado_cliente, estado_cliente),
        fecha_ultimo_acceso = COALESCE(p_fecha_ultimo_acceso, fecha_ultimo_acceso),
        notas_internas = COALESCE(p_notas_internas, notas_internas),
        password_cliente = COALESCE(p_password_cliente, password_cliente),
        ind_activo = COALESCE(p_ind_activo, ind_activo),
        usr_update = p_usr_update,
        fec_update = CURRENT_TIMESTAMP
    WHERE identificacion_fiscal = p_identificacion_fiscal;

    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Cliente actualizado correctamente',
            'identificacion_fiscal', p_identificacion_fiscal
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'No se pudo actualizar el cliente'
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al actualizar el cliente: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql;
