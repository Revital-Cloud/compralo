/*
 * FUNCIÓN: fun_update_marca
 * 
 * DESCRIPCIÓN: Actualiza la información de una marca existente en el sistema
 *              con validación del nombre y opción de cambiar estado activo.
 * 
 * PARÁMETROS:
 *   - wid_marca: ID de la marca a actualizar (obligatorio)
 *   - wnom_marca: Nuevo nombre de la marca (obligatorio, mínimo 1 carácter)
 *   - wind_activo: Nuevo estado activo (opcional, mantiene actual si es NULL)
 *   - wusr_operacion: ID del usuario que realiza la operación (obligatorio, DECIMAL)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar que el nombre de marca sea válido
 *   2. Validar que el ID de usuario de operación sea válido
 *   3. Actualizar información de la marca
 *   4. Mantener estado actual si no se especifica nuevo estado
 *   5. Actualizar timestamp de modificación
 *   6. Confirmar éxito de la operación
 * 
 * MANEJO DE ERRORES:
 *   - Captura cualquier excepción y realiza ROLLBACK
 *   - Retorna mensaje de error descriptivo
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_update_marca(
    wid_marca tab_marcas.id_marca%TYPE,
    wnom_marca tab_marcas.nom_marca%TYPE,
    wind_activo tab_marcas.ind_activo%TYPE,
    wusr_operacion tab_marcas.usr_update%TYPE  -- Ahora es DECIMAL(10)
) RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: Nombre de la marca
        IF wnom_marca IS NULL OR wnom_marca = '' OR LENGTH(TRIM(wnom_marca)) < 1 THEN
            RETURN 'Error: El nombre de la marca es obligatorio y debe tener al menos 1 carácter.';
        END IF;

        -- VALIDACIÓN 2: ID de usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
            RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
        END IF;

        -- ACTUALIZACIÓN: Modificar información de la marca
        UPDATE tab_marcas SET 
            nom_marca = wnom_marca,                                 -- Nuevo nombre
            ind_activo = COALESCE(wind_activo, ind_activo),         -- Nuevo estado (mantiene actual si NULL)
            usr_update = wusr_operacion,                            -- ID del usuario que actualiza
            fec_update = NOW()                                      -- Timestamp de actualización
        WHERE id_marca = wid_marca;
        
        -- VERIFICACIÓN: Confirmar que la actualización fue exitosa
        IF FOUND THEN
            RAISE NOTICE 'Marca actualizada exitosamente: % por usuario ID: %', wnom_marca, wusr_operacion;
            RETURN 'Marca actualizada correctamente';
        ELSE
            RAISE NOTICE 'Error: Marca no encontrada o no se pudo actualizar';
            RETURN 'Error: Marca no encontrada o no se pudo actualizar';
        END IF;

    -- MANEJO DE ERRORES: Capturar excepciones inesperadas
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 'Error inesperado: ' || SQLERRM;
            ROLLBACK;
    END;
$$
LANGUAGE plpgsql;

-- Ejemplo de uso corregido (ahora con ID numérico)
SELECT fun_update_marca(1, 'Samsung Electronics', NULL, 1234567890);