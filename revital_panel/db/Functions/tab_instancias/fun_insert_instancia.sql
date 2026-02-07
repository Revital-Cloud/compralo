/*
 * FUNCIÓN: fun_insert_instancia
 * 
 * DESCRIPCIÓN: Inserta una nueva instancia de e-commerce
 * 
 * PARÁMETROS:
 *   - p_identificacion_fiscal_cliente: Identificación fiscal del cliente (obligatorio)
 *   - p_nom_instancia: Nombre de la instancia (obligatorio)
 *   - p_slug_instancia: Slug único para URLs (obligatorio, único)
 *   - p_subdominio: Subdominio (opcional, único)
 *   - p_dominio_personalizado: Dominio personalizado (opcional)
 *   - p_estado_instancia: Estado inicial (default: 'creando')
 *   - p_version_instancia: Versión de la instancia (default: '1.0.0')
 *   - p_db_nombre: Nombre de la base de datos (obligatorio, único)
 *   - p_db_host: Host de la base de datos (opcional)
 *   - p_db_puerto: Puerto de la base de datos (default: 5432)
 *   - p_db_usuario: Usuario de la base de datos (opcional)
 *   - p_backend_url: URL del backend (opcional)
 *   - p_frontend_url: URL del frontend (opcional)
 *   - p_region_deployment: Región de deployment (default: 'us-east-1')
 *   - p_config_json: Configuración adicional en JSONB (opcional)
 *   - p_usr_insert: Usuario que crea el registro (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación
 * 
 * AUTOR: Sistema DB_Revital SaaS
 * FECHA: 2026
 */
CREATE OR REPLACE FUNCTION fun_insert_instancia(
    p_identificacion_fiscal_cliente tab_instancias.identificacion_fiscal_cliente%TYPE,
    p_nom_instancia tab_instancias.nom_instancia%TYPE,
    p_slug_instancia tab_instancias.slug_instancia%TYPE,
    p_db_nombre tab_instancias.db_nombre%TYPE,
    p_usr_insert tab_instancias.usr_insert%TYPE,
    p_subdominio tab_instancias.subdominio%TYPE DEFAULT NULL,
    p_dominio_personalizado tab_instancias.dominio_personalizado%TYPE DEFAULT NULL,
    p_estado_instancia tab_instancias.estado_instancia%TYPE DEFAULT 'creando',
    p_version_instancia tab_instancias.version_instancia%TYPE DEFAULT '1.0.0',
    p_db_host tab_instancias.db_host%TYPE DEFAULT NULL,
    p_db_puerto tab_instancias.db_puerto%TYPE DEFAULT 5432,
    p_db_usuario tab_instancias.db_usuario%TYPE DEFAULT NULL,
    p_backend_url tab_instancias.backend_url%TYPE DEFAULT NULL,
    p_frontend_url tab_instancias.frontend_url%TYPE DEFAULT NULL,
    p_region_deployment tab_instancias.region_deployment%TYPE DEFAULT 'us-east-1',
    p_config_json tab_instancias.config_json%TYPE DEFAULT NULL
) RETURNS JSON AS
$$
DECLARE
    v_id_instancia DECIMAL(10,0);
    v_cliente_existe INTEGER;
    v_slug_existe INTEGER;
    v_db_nombre_existe INTEGER;
    v_subdominio_existe INTEGER;
BEGIN
    -- Validaciones básicas
    IF p_identificacion_fiscal_cliente IS NULL OR TRIM(p_identificacion_fiscal_cliente) = '' THEN
        RETURN json_build_object('success', false, 'message', 'La identificación fiscal del cliente es obligatoria');
    END IF;

    IF p_nom_instancia IS NULL OR TRIM(p_nom_instancia) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El nombre de la instancia es obligatorio');
    END IF;

    IF p_slug_instancia IS NULL OR TRIM(p_slug_instancia) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El slug de la instancia es obligatorio');
    END IF;

    IF p_db_nombre IS NULL OR TRIM(p_db_nombre) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El nombre de la base de datos es obligatorio');
    END IF;

    IF p_usr_insert IS NULL OR TRIM(p_usr_insert) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El usuario que crea el registro es obligatorio');
    END IF;

    -- Validar que el cliente existe
    SELECT COUNT(*) INTO v_cliente_existe FROM tab_clientes WHERE identificacion_fiscal = p_identificacion_fiscal_cliente;
    IF v_cliente_existe = 0 THEN
        RETURN json_build_object('success', false, 'message', 'El cliente no existe');
    END IF;

    -- Validar unicidad de slug
    SELECT COUNT(*) INTO v_slug_existe FROM tab_instancias WHERE slug_instancia = p_slug_instancia;
    IF v_slug_existe > 0 THEN
        RETURN json_build_object('success', false, 'message', 'Ya existe una instancia con este slug');
    END IF;

    -- Validar unicidad de db_nombre
    SELECT COUNT(*) INTO v_db_nombre_existe FROM tab_instancias WHERE db_nombre = p_db_nombre;
    IF v_db_nombre_existe > 0 THEN
        RETURN json_build_object('success', false, 'message', 'Ya existe una instancia con este nombre de base de datos');
    END IF;

    -- Validar unicidad de subdominio si se proporciona
    IF p_subdominio IS NOT NULL THEN
        SELECT COUNT(*) INTO v_subdominio_existe FROM tab_instancias WHERE subdominio = p_subdominio;
        IF v_subdominio_existe > 0 THEN
            RETURN json_build_object('success', false, 'message', 'Ya existe una instancia con este subdominio');
        END IF;
    END IF;

    -- Insertar la instancia
    INSERT INTO tab_instancias (
        identificacion_fiscal_cliente, nom_instancia, slug_instancia, subdominio,
        dominio_personalizado, estado_instancia, version_instancia, db_nombre,
        db_host, db_puerto, db_usuario, backend_url, frontend_url,
        region_deployment, config_json, usr_insert, fec_insert
    ) VALUES (
        p_identificacion_fiscal_cliente, p_nom_instancia, p_slug_instancia, p_subdominio,
        p_dominio_personalizado, p_estado_instancia, p_version_instancia, p_db_nombre,
        p_db_host, p_db_puerto, p_db_usuario, p_backend_url, p_frontend_url,
        p_region_deployment, p_config_json, p_usr_insert, CURRENT_TIMESTAMP
    ) RETURNING id_instancia INTO v_id_instancia;

    RETURN json_build_object(
        'success', true,
        'message', 'Instancia insertada correctamente',
        'id_instancia', v_id_instancia
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error al insertar la instancia: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
