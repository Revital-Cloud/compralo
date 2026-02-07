/*
* FUNCIÓN: fun_deactivate_direccion_principal
* 
* DESCRIPCIÓN: Desactiva una dirección principal para un usuario.
* Solo puede haber una dirección principal por usuario.
* 
* PARÁMETROS:
*   - p_id_direccion: ID de la dirección a desactivar como principal
*   - p_id_usuario: ID del usuario al que pertenece la dirección
*   - p_usr_operacion: ID del usuario que realiza la operación
*
* RETORNA: VARCHAR - Mensaje indicando éxito o error específico
*
* LÓGICA:
*   1. Validar que la dirección existe y pertenece al usuario
*   2. Verificar que la dirección es actualmente principal
*   3. Desactivar el estado principal de la dirección
*   4. Confirmar éxito de la operación
*
* MANEJO DE ERRORES:
*   - Captura cualquier excepción y realiza ROLLBACK
*   - Retorna mensaje de error descriptivo
*
* AUTOR: Sistema DB_Revital
* FECHA: 2025
*/
CREATE OR REPLACE FUNCTION fun_deactivate_direccion_principal(
    wid_direccion tab_direcciones_usuario.id_direccion%TYPE,
    wid_usuario tab_direcciones_usuario.id_usuario%TYPE,
    wusr_operacion tab_direcciones_usuario.usr_update%TYPE
) RETURNS VARCHAR AS
$$
DECLARE
    v_direccion_existe BOOLEAN := FALSE;
    v_es_principal BOOLEAN := FALSE;
    v_mensaje VARCHAR;
BEGIN
    -- VALIDACIÓN 1: ID de dirección
    IF wid_direccion IS NULL OR wid_direccion = 0 THEN
        RETURN 'Error: El ID de dirección es obligatorio y debe ser mayor a 0.';
    END IF;

    -- VALIDACIÓN 2: ID de usuario
    IF wid_usuario IS NULL OR wid_usuario = 0 THEN
        RETURN 'Error: El ID de usuario es obligatorio y debe ser mayor a 0.';
    END IF;

    -- VALIDACIÓN 3: usr_operacion
    IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
        RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
    END IF;

    -- PASO 1: Verificar que la dirección existe y pertenece al usuario
    SELECT EXISTS(
        SELECT 1 FROM tab_direcciones_usuario 
        WHERE id_direccion = wid_direccion 
        AND id_usuario = wid_usuario 
        AND ind_activa = TRUE
    ) INTO v_direccion_existe;

    IF NOT v_direccion_existe THEN
        RETURN 'Error: La dirección no existe, no pertenece al usuario o está inactiva.';
    END IF;

    -- PASO 2: Verificar si la dirección es actualmente principal
    SELECT ind_principal INTO v_es_principal
    FROM tab_direcciones_usuario 
    WHERE id_direccion = wid_direccion AND id_usuario = wid_usuario;

    -- PASO 3: Verificar si ya no es principal
    IF NOT v_es_principal THEN
        v_mensaje := 'La dirección ya no es principal';
        RAISE NOTICE '%', v_mensaje;
        RETURN v_mensaje;
    END IF;

    -- PASO 4: Desactivar el estado principal de la dirección
    UPDATE tab_direcciones_usuario 
    SET ind_principal = FALSE,
        usr_update = wusr_operacion
    WHERE id_direccion = wid_direccion AND id_usuario = wid_usuario;

    -- PASO 5: Verificar éxito de la operación
    IF FOUND THEN
        v_mensaje := 'Dirección removida como principal correctamente';
        RAISE NOTICE 'Dirección % removida como principal para usuario: %', wid_direccion, wid_usuario;
        RETURN v_mensaje;
    ELSE
        RAISE NOTICE 'Error: No se pudo desactivar la dirección como principal';
        RETURN 'Error: No se pudo desactivar la dirección como principal';
    END IF;

    -- MANEJO DE ERRORES: Capturar excepciones inesperadas
    EXCEPTION
        WHEN SQLSTATE '23503' THEN
            RETURN 'Error: El usuario especificado no existe o está inactivo.';
        WHEN OTHERS THEN
            RETURN 'Error inesperado: ' || SQLERRM;
            ROLLBACK;
END;
$$
LANGUAGE plpgsql;
