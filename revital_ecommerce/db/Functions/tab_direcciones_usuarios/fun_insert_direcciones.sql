/*
* FUNCIÓN: fun_insert_direcciones
* 
* DESCRIPCIÓN: Inserta una nueva dirección de usuario en el sistema.
* 
* PARÁMETROS:
*   - p_id_usuario: ID del usuario al que se le asignará la dirección
*   - p_nombre_direccion: Nombre descriptivo de la dirección (e.g., "Casa", "Trabajo", "Oficina")
*   - p_calle_direccion: Dirección completa de la calle
*   - p_ciudad: Ciudad de la dirección
*   - p_departamento: Departamento/Estado de la dirección
*   - p_codigo_postal: Código postal de la dirección
*   - p_barrio: Barrio/Sector de la dirección
*   - p_referencias: Referencias para el domiciliario (e.g., "Portón azul", "Al lado del parque")
*   - p_complemento: Información adicional (e.g., "Apto 301", "Casa 2", "Oficina 502")
*   - p_telefono_contacto: Teléfono específico para esta dirección
 *   - p_ind_principal: Indica si la dirección es principal (TRUE) o secundaria (FALSE) - OPCIONAL (DEFAULT: FALSE)
 *   - p_ind_activa: Indica si la dirección está activa (TRUE) o inactiva (FALSE) - OPCIONAL (DEFAULT: TRUE)
*   - p_usr_operacion: ID del usuario que realiza la operación
*
* RETORNA: BOOLEAN - TRUE si la operación fue exitosa, FALSE en caso contrario
*
* LÓGICA:
*   1. Validar todos los identificadores (usuario, dirección)
*   2. Validar que el nombre de la dirección sea válido
*   3. Validar que la dirección completa de la calle sea válida
*   4. Validar que la ciudad sea válida
*   5. Validar que el departamento/estado sea válido
*   6. Validar que el código postal sea válido
*   7. Validar que el barrio/sector sea válido
*
* MANEJO DE ERRORES:
*   - Captura cualquier excepción y realiza ROLLBACK
*   - Retorna mensaje de error descriptivo
*
* AUTOR: Sistema DB_Revital
* FECHA: 2025
*/
CREATE OR REPLACE FUNCTION fun_insert_direcciones(
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
    wusr_operacion tab_direcciones_usuario.usr_insert%TYPE
) RETURNS VARCHAR AS
$$
BEGIN
    -- VALIDACIÓN 1: ID de usuario
    IF wid_usuario IS NULL OR wid_usuario = 0 THEN
        RETURN 'Error: El ID de usuario es obligatorio y debe ser mayor a 0.';
    END IF;

    -- VALIDACIÓN 2: Nombre de la dirección
    IF wnom_direccion IS NULL OR wnom_direccion = '' OR LENGTH(TRIM(wnom_direccion)) < 3 THEN
        RETURN 'Error: El nombre de la dirección es obligatorio y debe tener al menos 3 caracteres.';
    END IF;

    -- VALIDACIÓN 3: Dirección completa de la calle
    IF wcalle_direccion IS NULL OR wcalle_direccion = '' OR LENGTH(TRIM(wcalle_direccion)) < 5 THEN
        RETURN 'Error: La calle de la dirección es obligatoria y debe tener al menos 5 caracteres.';
    END IF;

    -- VALIDACIÓN 4: Ciudad
    IF wciudad IS NULL OR wciudad = '' OR LENGTH(TRIM(wciudad)) < 3 THEN
        RETURN 'Error: La ciudad es obligatoria y debe tener al menos 3 caracteres.';
    END IF;

    -- VALIDACIÓN 5: Departamento/Estado
    IF wdepartamento IS NULL OR wdepartamento = '' OR LENGTH(TRIM(wdepartamento)) < 3 THEN
        RETURN 'Error: El departamento/estado es obligatorio y debe tener al menos 3 caracteres.';
    END IF;

    -- VALIDACIÓN 6: Código postal
    IF wcodigo_postal IS NULL OR wcodigo_postal = '' OR LENGTH(TRIM(wcodigo_postal)) < 3 THEN
        RETURN 'Error: El código postal es obligatorio y debe tener al menos 3 caracteres.';
    END IF;

    -- VALIDACIÓN 7: Barrio/Sector
    IF wbarrio IS NULL OR wbarrio = '' OR LENGTH(TRIM(wbarrio)) < 3 THEN
        RETURN 'Error: El barrio/sector es obligatorio y debe tener al menos 3 caracteres.';
    END IF;

    -- VALIDACIÓN 8: usr_operacion
    IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
        RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
    END IF;

    --INSERCIÓN: Crear nueva dirección de usuario con ID secuencial
    INSERT INTO tab_direcciones_usuario (
        id_direccion, id_usuario, nombre_direccion, calle_direccion, 
        ciudad, departamento, codigo_postal, barrio, referencias, 
        complemento, ind_principal, ind_activa, usr_insert
    )
    VALUES (
        (SELECT COALESCE(MAX(id_direccion), 0) + 1 FROM tab_direcciones_usuario),  -- id_direccion global único
        wid_usuario,                                                                    -- id_usuario
        wnom_direccion,                                                                -- nombre_direccion
        wcalle_direccion,                                                              -- calle_direccion
        wciudad,                                                                       -- ciudad
        wdepartamento,                                                                 -- departamento
        wcodigo_postal,                                                                -- codigo_postal
        wbarrio,                                                                       -- barrio
        wreferencias,                                                                  -- referencias
        wcomplemento,                                                                  -- complemento
        wind_principal,                                                                -- ind_principal
        wind_activa,                                                                  -- ind_activa
        wusr_operacion                                                                -- usr_insert
    );

    -- VERIFICACIÓN: Confirmar que la inserción fue exitosa
    IF FOUND THEN
        RAISE NOTICE 'Dirección insertada exitosamente: % por usuario ID: %', wnom_direccion, wusr_operacion;
        RETURN 'Dirección insertada correctamente';
    ELSE
        RAISE NOTICE 'Error: No se pudo insertar la dirección';
        RETURN 'Error al insertar la dirección';
    END IF;

    -- MANEJO DE ERRORES: Capturar excepciones específicas
EXCEPTION
    WHEN SQLSTATE '23503' THEN
        RETURN 'Error: El usuario especificado no existe o está inactivo.';
    WHEN OTHERS THEN
        RETURN 'Error inesperado: ' || SQLERRM;
        ROLLBACK;
END;
$$
LANGUAGE plpgsql;