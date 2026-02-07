/*
 * FUNCIÓN: fun_insert_plan
 * 
 * DESCRIPCIÓN: Inserta un nuevo plan de suscripción en el sistema
 * 
 * PARÁMETROS:
 *   - p_nom_plan: Nombre del plan (obligatorio, único)
 *   - p_desc_plan: Descripción del plan (opcional)
 *   - p_precio_mensual: Precio mensual del plan (obligatorio, > 0)
 *   - p_precio_anual: Precio anual del plan (opcional)
 *   - p_moneda: Moneda del plan (default: 'USD')
 *   - p_max_productos: Límite de productos (opcional, NULL = ilimitado)
 *   - p_max_usuarios: Límite de usuarios (opcional, NULL = ilimitado)
 *   - p_max_almacenamiento_gb: Límite de almacenamiento en GB (opcional, NULL = ilimitado)
 *   - p_features_json: Características del plan en formato JSONB (opcional)
 *   - p_estado_plan: Estado del plan (default: 'activo')
 *   - p_usr_insert: Usuario que crea el registro (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación
 * 
 * AUTOR: Sistema DB_Revital SaaS
 * FECHA: 2026
 */
CREATE OR REPLACE FUNCTION fun_insert_plan(
    p_nom_plan tab_planes.nom_plan%TYPE,
    p_precio_mensual tab_planes.precio_mensual%TYPE,
    p_usr_insert tab_planes.usr_insert%TYPE,
    p_desc_plan tab_planes.desc_plan%TYPE DEFAULT NULL,
    p_precio_anual tab_planes.precio_anual%TYPE DEFAULT NULL,
    p_moneda tab_planes.moneda%TYPE DEFAULT 'USD',
    p_max_productos tab_planes.max_productos%TYPE DEFAULT NULL,
    p_max_usuarios tab_planes.max_usuarios%TYPE DEFAULT NULL,
    p_max_almacenamiento_gb tab_planes.max_almacenamiento_gb%TYPE DEFAULT NULL,
    p_features_json tab_planes.features_json%TYPE DEFAULT NULL,
    p_estado_plan tab_planes.estado_plan%TYPE DEFAULT 'activo'
) RETURNS JSON AS
$$
DECLARE
    v_id_plan DECIMAL(10,0);
    v_plan_existe INTEGER;
BEGIN
    -- Validación: Nombre del plan
    IF p_nom_plan IS NULL OR TRIM(p_nom_plan) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El nombre del plan es obligatorio'
        );
    END IF;

    -- Validación: Precio mensual
    IF p_precio_mensual IS NULL OR p_precio_mensual <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El precio mensual es obligatorio y debe ser mayor a 0'
        );
    END IF;

    -- Validación: Precio anual si se proporciona
    IF p_precio_anual IS NOT NULL AND p_precio_anual <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El precio anual debe ser mayor a 0 si se proporciona'
        );
    END IF;

    -- Validación: Usuario
    IF p_usr_insert IS NULL OR TRIM(p_usr_insert) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario que crea el registro es obligatorio'
        );
    END IF;

    -- Validación: Verificar si el plan ya existe
    SELECT COUNT(*) INTO v_plan_existe
    FROM tab_planes
    WHERE UPPER(TRIM(nom_plan)) = UPPER(TRIM(p_nom_plan));

    IF v_plan_existe > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Ya existe un plan con el mismo nombre'
        );
    END IF;

    -- Insertar el plan
    INSERT INTO tab_planes (
        nom_plan,
        desc_plan,
        precio_mensual,
        precio_anual,
        moneda,
        max_productos,
        max_usuarios,
        max_almacenamiento_gb,
        features_json,
        estado_plan,
        usr_insert,
        fec_insert
    ) VALUES (
        p_nom_plan,
        p_desc_plan,
        p_precio_mensual,
        p_precio_anual,
        p_moneda,
        p_max_productos,
        p_max_usuarios,
        p_max_almacenamiento_gb,
        p_features_json,
        p_estado_plan,
        p_usr_insert,
        CURRENT_TIMESTAMP
    ) RETURNING id_plan INTO v_id_plan;

    RETURN json_build_object(
        'success', true,
        'message', 'Plan insertado correctamente',
        'id_plan', v_id_plan
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al insertar el plan: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql;
