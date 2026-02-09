/*
 * FUNCIÓN: fun_delete_plan
 * 
 * DESCRIPCIÓN: Elimina un plan de suscripción (soft delete)
 *              El registro se guarda en tab_reg_del mediante trigger
 * 
 * PARÁMETROS:
 *   - p_id_plan: ID del plan a eliminar (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación
 * 
 * NOTA: Esta función realiza un DELETE físico, pero el trigger
 *       de auditoría guarda el registro en tab_reg_del (soft delete)
 * 
 * AUTOR: Sistema DB_Revital SaaS
 * FECHA: 2026
 */
CREATE OR REPLACE FUNCTION fun_delete_plan(
    p_id_plan tab_planes.id_plan%TYPE
) RETURNS JSON AS
$$
DECLARE
    v_plan_existe INTEGER;
    v_suscripciones_activas INTEGER;
BEGIN
    -- Validación: ID del plan
    IF p_id_plan IS NULL OR p_id_plan <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El ID del plan es obligatorio y debe ser mayor a 0'
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

    -- Validación: Verificar si hay suscripciones activas con este plan
    SELECT COUNT(*) INTO v_suscripciones_activas
    FROM tab_suscripciones
    WHERE id_plan = p_id_plan
    AND estado_suscripcion = 'activa';

    IF v_suscripciones_activas > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se puede eliminar el plan porque tiene suscripciones activas',
            'suscripciones_activas', v_suscripciones_activas
        );
    END IF;

    -- Eliminar el plan (el trigger guardará el registro en tab_reg_del)
    DELETE FROM tab_planes
    WHERE id_plan = p_id_plan;

    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Plan eliminado correctamente (soft delete)',
            'id_plan', p_id_plan
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'No se pudo eliminar el plan'
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al eliminar el plan: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql;
