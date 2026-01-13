/*
 * FUNCIÓN: fun_insert_cliente
 * 
 * DESCRIPCIÓN: Inserta un nuevo cliente en el sistema
 * 
 * PARÁMETROS:
 *   - p_identificacion_fiscal: Identificación fiscal única (PK, obligatorio)
 *   - p_tipo_identificacion: Tipo de identificación (default: 'NIT')
 *   - p_nom_empresa: Nombre de la empresa (obligatorio)
 *   - p_email_contacto: Email de contacto (obligatorio)
 *   - p_telefono_contacto: Teléfono de contacto (opcional)
 *   - p_direccion_empresa: Dirección de la empresa (opcional)
 *   - p_ciudad: Ciudad (opcional)
 *   - p_pais: País (default: 'CO')
 *   - p_nom_contacto_principal: Nombre del contacto principal (obligatorio)
 *   - p_email_contacto_principal: Email del contacto principal (obligatorio)
 *   - p_telefono_contacto_principal: Teléfono del contacto principal (opcional)
 *   - p_estado_cliente: Estado del cliente (default: 'prospecto')
 *   - p_notas_internas: Notas internas (opcional)
 *   - p_password_cliente: Hash de la contraseña (Argon2) (opcional para prospectos)
 *   - p_ind_activo: Si el cliente puede acceder al panel (default: true)
 *   - p_usr_insert: Usuario que crea el registro (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación
 * 
 * AUTOR: Sistema DB_Synkro SaaS
 * FECHA: Enero 2026
 */
CREATE OR REPLACE FUNCTION fun_insert_cliente(
    p_identificacion_fiscal tab_clientes.identificacion_fiscal%TYPE,
    p_nom_empresa tab_clientes.nom_empresa%TYPE,
    p_email_contacto tab_clientes.email_contacto%TYPE,
    p_nom_contacto_principal tab_clientes.nom_contacto_principal%TYPE,
    p_email_contacto_principal tab_clientes.email_contacto_principal%TYPE,
    p_usr_insert tab_clientes.usr_insert%TYPE,
    p_tipo_identificacion tab_clientes.tipo_identificacion%TYPE DEFAULT 'NIT',
    p_telefono_contacto tab_clientes.telefono_contacto%TYPE DEFAULT NULL,
    p_direccion_empresa tab_clientes.direccion_empresa%TYPE DEFAULT NULL,
    p_ciudad tab_clientes.ciudad%TYPE DEFAULT NULL,
    p_pais tab_clientes.pais%TYPE DEFAULT 'CO',
    p_telefono_contacto_principal tab_clientes.telefono_contacto_principal%TYPE DEFAULT NULL,
    p_estado_cliente tab_clientes.estado_cliente%TYPE DEFAULT 'prospecto',
    p_notas_internas tab_clientes.notas_internas%TYPE DEFAULT NULL,
    p_password_cliente tab_clientes.password_cliente%TYPE DEFAULT NULL,
    p_ind_activo tab_clientes.ind_activo%TYPE DEFAULT true
) RETURNS JSON AS
$$
DECLARE
    v_cliente_existe INTEGER;
    v_email_existe INTEGER;
BEGIN
    -- Validación: Identificación fiscal
    IF p_identificacion_fiscal IS NULL OR TRIM(p_identificacion_fiscal) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La identificación fiscal es obligatoria'
        );
    END IF;

    -- Validación: Nombre de empresa
    IF p_nom_empresa IS NULL OR TRIM(p_nom_empresa) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El nombre de la empresa es obligatorio'
        );
    END IF;

    -- Validación: Email de contacto
    IF p_email_contacto IS NULL OR TRIM(p_email_contacto) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El email de contacto es obligatorio'
        );
    END IF;

    -- Validación: Email del contacto principal
    IF p_email_contacto_principal IS NULL OR TRIM(p_email_contacto_principal) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El email del contacto principal es obligatorio'
        );
    END IF;

    -- Validación: Nombre del contacto principal
    IF p_nom_contacto_principal IS NULL OR TRIM(p_nom_contacto_principal) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El nombre del contacto principal es obligatorio'
        );
    END IF;

    -- Validación: Usuario
    IF p_usr_insert IS NULL OR TRIM(p_usr_insert) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario que crea el registro es obligatorio'
        );
    END IF;

    -- Validación: Verificar si el cliente ya existe
    SELECT COUNT(*) INTO v_cliente_existe
    FROM tab_clientes
    WHERE identificacion_fiscal = p_identificacion_fiscal;

    IF v_cliente_existe > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Ya existe un cliente con esta identificación fiscal'
        );
    END IF;

    -- Validación: Verificar si el email del contacto principal ya existe
    SELECT COUNT(*) INTO v_email_existe
    FROM tab_clientes
    WHERE email_contacto_principal = p_email_contacto_principal;

    IF v_email_existe > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Ya existe un cliente con este email de contacto principal'
        );
    END IF;

    -- Insertar el cliente
    INSERT INTO tab_clientes (
        identificacion_fiscal,
        tipo_identificacion,
        nom_empresa,
        email_contacto,
        telefono_contacto,
        direccion_empresa,
        ciudad,
        pais,
        nom_contacto_principal,
        email_contacto_principal,
        telefono_contacto_principal,
        estado_cliente,
        notas_internas,
        password_cliente,
        ind_activo,
        usr_insert,
        fec_insert
    ) VALUES (
        p_identificacion_fiscal,
        p_tipo_identificacion,
        p_nom_empresa,
        p_email_contacto,
        p_telefono_contacto,
        p_direccion_empresa,
        p_ciudad,
        p_pais,
        p_nom_contacto_principal,
        p_email_contacto_principal,
        p_telefono_contacto_principal,
        p_estado_cliente,
        p_notas_internas,
        p_password_cliente,
        COALESCE(p_ind_activo, true),
        p_usr_insert,
        CURRENT_TIMESTAMP
    );

    RETURN json_build_object(
        'success', true,
        'message', 'Cliente insertado correctamente',
        'identificacion_fiscal', p_identificacion_fiscal
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al insertar el cliente: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql;
