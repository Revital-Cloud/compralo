/*
 * FUNCIÓN: fun_insert_uso_recurso
 * 
 * DESCRIPCIÓN: Inserta una medición de uso de recursos
 * NOTA: Normalmente se inserta automáticamente por el sistema de monitoreo
 */
CREATE OR REPLACE FUNCTION fun_insert_uso_recurso(
    p_id_instancia tab_uso_recursos.id_instancia%TYPE,
    p_id_suscripcion tab_uso_recursos.id_suscripcion%TYPE,
    p_usr_insert tab_uso_recursos.usr_insert%TYPE,
    p_fecha_medicion tab_uso_recursos.fecha_medicion%TYPE DEFAULT CURRENT_TIMESTAMP,
    p_productos_actuales tab_uso_recursos.productos_actuales%TYPE DEFAULT 0,
    p_usuarios_actuales tab_uso_recursos.usuarios_actuales%TYPE DEFAULT 0,
    p_almacenamiento_actual_gb tab_uso_recursos.almacenamiento_actual_gb%TYPE DEFAULT 0,
    p_max_productos tab_uso_recursos.max_productos%TYPE DEFAULT NULL,
    p_max_usuarios tab_uso_recursos.max_usuarios%TYPE DEFAULT NULL,
    p_max_almacenamiento_gb tab_uso_recursos.max_almacenamiento_gb%TYPE DEFAULT NULL
) RETURNS JSON AS
$$
DECLARE
    v_id_uso_recurso DECIMAL(10,0);
BEGIN
    IF p_id_instancia IS NULL OR p_id_instancia <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de la instancia es obligatorio');
    END IF;

    IF p_id_suscripcion IS NULL OR p_id_suscripcion <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de la suscripción es obligatorio');
    END IF;

    IF p_usr_insert IS NULL OR TRIM(p_usr_insert) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El usuario que crea el registro es obligatorio');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_instancias WHERE id_instancia = p_id_instancia) THEN
        RETURN json_build_object('success', false, 'message', 'La instancia no existe');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_suscripciones WHERE id_suscripcion = p_id_suscripcion) THEN
        RETURN json_build_object('success', false, 'message', 'La suscripción no existe');
    END IF;

    INSERT INTO tab_uso_recursos (
        id_instancia, id_suscripcion, fecha_medicion,
        productos_actuales, usuarios_actuales, almacenamiento_actual_gb,
        max_productos, max_usuarios, max_almacenamiento_gb,
        usr_insert, fec_insert
    ) VALUES (
        p_id_instancia, p_id_suscripcion, p_fecha_medicion,
        p_productos_actuales, p_usuarios_actuales, p_almacenamiento_actual_gb,
        p_max_productos, p_max_usuarios, p_max_almacenamiento_gb,
        p_usr_insert, CURRENT_TIMESTAMP
    ) RETURNING id_uso_recurso INTO v_id_uso_recurso;

    RETURN json_build_object('success', true, 'message', 'Medición de uso de recursos insertada correctamente', 'id_uso_recurso', v_id_uso_recurso);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
