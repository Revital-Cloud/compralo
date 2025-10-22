

CREATE OR REPLACE FUNCTION fun_deactivate_direcciones(
    wid_direccion tab_direcciones_usuario.id_direccion%TYPE,
    wid_usuario tab_direcciones_usuario.id_usuario%TYPE,
    wusr_operacion tab_direcciones_usuario.usr_update%TYPE,
    wactivar BOOLEAN DEFAULT FALSE
) RETURNS VARCHAR AS
$$
DECLARE
    v_estado_anterior BOOLEAN;
    v_estado_nuevo BOOLEAN;
    v_mensaje VARCHAR;
BEGIN
    -- PASO 1: Obtener el estado actual de la dirección
    SELECT ind_activa INTO v_estado_anterior
    FROM tab_direcciones_usuario 
    WHERE id_direccion = wid_direccion AND id_usuario = wid_usuario;
    
    -- PASO 2: Verificar si la dirección existe
    IF NOT FOUND THEN
        RAISE NOTICE 'Error: Dirección no encontrada';
        RETURN 'Error: Dirección no encontrada';
    END IF;
    
    -- PASO 3: Determinar el nuevo estado
    v_estado_nuevo := wactivar;
    
    -- PASO 4: Verificar si ya está en el estado deseado
    IF v_estado_anterior = v_estado_nuevo THEN
        IF v_estado_nuevo THEN
            v_mensaje := 'La dirección ya está activa';
        ELSE
            v_mensaje := 'La dirección ya está desactivada';
        END IF;
        RAISE NOTICE '%', v_mensaje;
        RETURN v_mensaje;
    END IF;
    
    -- PASO 5: Actualizar el estado de la dirección
    UPDATE tab_direcciones_usuario SET 
        ind_activa = v_estado_nuevo,
        usr_update = wusr_operacion
    WHERE id_direccion = wid_direccion AND id_usuario = wid_usuario;

    IF FOUND THEN
        IF v_estado_nuevo THEN
            v_mensaje := 'Dirección activada correctamente';
            RAISE NOTICE 'Dirección activada exitosamente: % por usuario ID: %', wid_direccion, wusr_operacion;
        ELSE
            v_mensaje := 'Dirección desactivada correctamente';
            RAISE NOTICE 'Dirección desactivada exitosamente: % por usuario ID: %', wid_direccion, wusr_operacion;
        END IF;
        RETURN v_mensaje;
    ELSE
        RAISE NOTICE 'Error: No se pudo actualizar la dirección';
        RETURN 'Error: No se pudo actualizar la dirección';
    END IF;

    -- MANEJO DE ERRORES: Capturar excepciones inesperadas
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 'Error inesperado: ' || SQLERRM;
            ROLLBACK;
END;
$$
LANGUAGE plpgsql;