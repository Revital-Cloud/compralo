/*
* FUNCIÓN: fun_update_direcciones	
* 
* DESCRIPCIÓN: Actualiza una dirección de usuario en el sistema.
* 
* PARÁMETROS:
*   - p_id_direccion: ID de la dirección a actualizar
*   - p_id_usuario: ID del usuario al que pertenece la dirección
*   - p_nombre_direccion: Nuevo nombre descriptivo de la dirección
*   - p_calle_direccion: Nueva dirección completa de la calle
*   - p_ciudad: Nueva ciudad de la dirección
*   - p_departamento: Nuevo departamento/estado de la dirección
*   - p_codigo_postal: Nuevo código postal de la dirección
*   - p_barrio: Nuevo barrio/sector de la dirección
*   - p_referencias: Nueva referencia para el domiciliario
*   - p_complemento: Nuevo complemento para la dirección
*   - p_ind_principal: Nuevo estado principal de la dirección
*   - p_ind_activa: Nuevo estado activo de la dirección
*   - p_usr_operacion: ID del usuario que realiza la operación
*
* RETORNA: VARCHAR - Mensaje indicando éxito o error específico
*
* LÓGICA:
*   1. Validar todos los identificadores (dirección, usuario)
*   2. Validar que el nombre de la dirección sea válido
*   3. Validar que la dirección completa de la calle sea válida
*   4. Validar que la ciudad sea válida
*   5. Validar que el departamento/estado sea válido
*   6. Validar que el código postal sea válido
*   7. Validar que el barrio/sector sea válido
*   8. Validar que el usuario exista
*   9. Actualizar la dirección específica
*   10. Confirmar éxito de la operación
*
* MANEJO DE ERRORES:
*   - Captura cualquier excepción y realiza ROLLBACK
*   - Retorna mensaje de error descriptivo
*
* AUTOR: Sistema DB_Revital
* FECHA: 2025

*/
CREATE OR REPLACE FUNCTION fun_update_direcciones(
    wid_direccion tab_direcciones_usuario.id_direccion%TYPE,
    wid_usuario tab_direcciones_usuario.id_usuario%TYPE,
    wnom_direccion tab_direcciones_usuario.nombre_direccion%TYPE,
    wcalle_direccion tab_direcciones_usuario.calle_direccion%TYPE,
    wciudad tab_direcciones_usuario.ciudad%TYPE,
    wdepartamento tab_direcciones_usuario.departamento%TYPE,
    wcodigo_postal tab_direcciones_usuario.codigo_postal%TYPE,
    wbarrio tab_direcciones_usuario.barrio%TYPE,
    wreferencias tab_direcciones_usuario.referencias%TYPE,
    wcomplemento tab_direcciones_usuario.complemento%TYPE,
    wind_principal tab_direcciones_usuario.ind_principal%TYPE,
    wind_activa tab_direcciones_usuario.ind_activa%TYPE,
    wusr_operacion tab_direcciones_usuario.usr_update%TYPE
) RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: ID de dirección
        IF wid_direccion IS NULL OR wid_direccion = 0 THEN
            RETURN 'Error: El ID de dirección es obligatorio y debe ser mayor a 0.';
        END IF;

        -- VALIDACIÓN 2: ID de usuario
        IF wid_usuario IS NULL OR wid_usuario = 0 THEN
            RETURN 'Error: El ID de usuario es obligatorio y debe ser mayor a 0.';
        END IF;

        -- VALIDACIÓN 3: Nombre de la dirección
        IF wnom_direccion IS NULL OR wnom_direccion = '' OR LENGTH(TRIM(wnom_direccion)) < 3 THEN
            RETURN 'Error: El nombre de la dirección es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 4: Dirección completa de la calle
        IF wcalle_direccion IS NULL OR wcalle_direccion = '' OR LENGTH(TRIM(wcalle_direccion)) < 5 THEN
            RETURN 'Error: La dirección completa de la calle es obligatoria y debe tener al menos 5 caracteres.';
        END IF;

        -- VALIDACIÓN 5: Ciudad
        IF wciudad IS NULL OR wciudad = '' OR LENGTH(TRIM(wciudad)) < 3 THEN
            RETURN 'Error: La ciudad es obligatoria y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 6: Departamento/Estado
        IF wdepartamento IS NULL OR wdepartamento = '' OR LENGTH(TRIM(wdepartamento)) < 3 THEN
            RETURN 'Error: El departamento/estado es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 7: Código postal
        IF wcodigo_postal IS NULL OR wcodigo_postal = '' OR LENGTH(TRIM(wcodigo_postal)) < 3 THEN
            RETURN 'Error: El código postal es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 8: Barrio/Sector
        IF wbarrio IS NULL OR wbarrio = '' OR LENGTH(TRIM(wbarrio)) < 3 THEN
            RETURN 'Error: El barrio/sector es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 9: usr_operacion
        IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
            RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
        END IF;

        --ACTUALIZACIÓN: Modificar información de la dirección específica
        UPDATE tab_direcciones_usuario
        SET nombre_direccion = wnom_direccion,
            calle_direccion = wcalle_direccion,
            ciudad = wciudad,
            departamento = wdepartamento,
            codigo_postal = wcodigo_postal,
            barrio = wbarrio,
            referencias = wreferencias,
            complemento = wcomplemento,
            ind_principal = COALESCE(wind_principal, ind_principal),
            ind_activa = COALESCE(wind_activa, ind_activa),
            usr_update = wusr_operacion
        WHERE id_direccion = wid_direccion AND id_usuario = wid_usuario;

        -- VERIFICACIÓN: Confirmar que la actualización fue exitosa
        IF FOUND THEN
            RAISE NOTICE 'Dirección actualizada exitosamente: % por usuario ID: %', wnom_direccion, wusr_operacion;
            RETURN 'Dirección actualizada correctamente';
        ELSE
            RAISE NOTICE 'Error: Dirección no encontrada o no se pudo actualizar';
            RETURN 'Error: Dirección no encontrada o no se pudo actualizar';
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