/*
 * FUNCIÓN: fun_update_plan
 * 
 * DESCRIPCIÓN: Actualiza un plan de suscripción existente
 * 
 * PARÁMETROS:
 *   - p_id_plan: ID del plan a actualizar (obligatorio)
 *   - p_nom_plan: Nuevo nombre del plan (opcional)
 *   - p_desc_plan: Nueva descripción del plan (opcional)
 *   - p_precio_mensual: Nuevo precio mensual (opcional)
 *   - p_precio_anual: Nuevo precio anual (opcional)
 *   - p_moneda: Nueva moneda (opcional)
 *   - p_max_productos: Nuevo límite de productos (opcional)
 *   - p_max_usuarios: Nuevo límite de usuarios (opcional)
 *   - p_max_almacenamiento_gb: Nuevo límite de almacenamiento (opcional)
 *   - p_features_json: Nuevas características en JSONB (opcional)
 *   - p_estado_plan: Nuevo estado del plan (opcional)
 *   - p_usr_update: Usuario que actualiza el registro (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación
 * 
 * AUTOR: Sistema DB_Synkro SaaS
 * FECHA: 2026
 */
CREATE OR REPLACE FUNCTION fun_update_plan(
    p_id_plan tab_planes.id_plan%TYPE,
    p_usr_update tab_planes.usr_update%TYPE,
    p_nom_plan tab_planes.nom_plan%TYPE DEFAULT NULL,
    p_desc_plan tab_planes.desc_plan%TYPE DEFAULT NULL,
    p_precio_mensual tab_planes.precio_mensual%TYPE DEFAULT NULL,
    p_precio_anual tab_planes.precio_anual%TYPE DEFAULT NULL,
    p_moneda tab_planes.moneda%TYPE DEFAULT NULL,
    p_max_productos tab_planes.max_productos%TYPE DEFAULT NULL,
    p_max_usuarios tab_planes.max_usuarios%TYPE DEFAULT NULL,
    p_max_almacenamiento_gb tab_planes.max_almacenamiento_gb%TYPE DEFAULT NULL,
    p_features_json tab_planes.features_json%TYPE DEFAULT NULL,
    p_estado_plan tab_planes.estado_plan%TYPE DEFAULT NULL
) RETURNS JSON AS
$$
DECLARE
    v_plan_existe INTEGER;
    v_nom_plan_existe INTEGER;
BEGIN
    -- Validación: ID del plan
    IF p_id_plan IS NULL OR p_id_plan <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El ID del plan es obligatorio y debe ser mayor a 0'
        );
    END IF;

    -- Validación: Usuario
    IF p_usr_update IS NULL OR TRIM(p_usr_update) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario que actualiza el registro es obligatorio'
        );
    END IF;

    -- Validación: Verificar si el plan existe
    SELECT COUNT(*) INTO v_plan_existe
    FROM tab_planes
    WHERE id_plan = p_id_plan;

    IF v_plan_existe = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El plan no existe'
        );
    END IF;

    -- Validación: Si se cambia el nombre, verificar que no exista otro plan con ese nombre
    IF p_nom_plan IS NOT NULL THEN
        SELECT COUNT(*) INTO v_nom_plan_existe
        FROM tab_planes
        WHERE UPPER(TRIM(nom_plan)) = UPPER(TRIM(p_nom_plan))
        AND id_plan != p_id_plan;

        IF v_nom_plan_existe > 0 THEN
            RETURN json_build_object(
                'success', false,
                'message', 'Ya existe otro plan con el mismo nombre'
            );
        END IF;
    END IF;

    -- Validación: Precio mensual si se proporciona
    IF p_precio_mensual IS NOT NULL AND p_precio_mensual <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El precio mensual debe ser mayor a 0'
        );
    END IF;

    -- Validación: Precio anual si se proporciona
    IF p_precio_anual IS NOT NULL AND p_precio_anual <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El precio anual debe ser mayor a 0'
        );
    END IF;

    -- Actualizar el plan (solo los campos proporcionados)
    UPDATE tab_planes
    SET 
        nom_plan = COALESCE(p_nom_plan, nom_plan),
        desc_plan = COALESCE(p_desc_plan, desc_plan),
        precio_mensual = COALESCE(p_precio_mensual, precio_mensual),
        precio_anual = COALESCE(p_precio_anual, precio_anual),
        moneda = COALESCE(p_moneda, moneda),
        max_productos = COALESCE(p_max_productos, max_productos),
        max_usuarios = COALESCE(p_max_usuarios, max_usuarios),
        max_almacenamiento_gb = COALESCE(p_max_almacenamiento_gb, max_almacenamiento_gb),
        features_json = COALESCE(p_features_json, features_json),
        estado_plan = COALESCE(p_estado_plan, estado_plan),
        usr_update = p_usr_update,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_plan = p_id_plan;

    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Plan actualizado correctamente',
            'id_plan', p_id_plan
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'No se pudo actualizar el plan'
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al actualizar el plan: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql;
