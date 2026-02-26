/*
 * FUNCIÓN: fun_update_linea
 * 
 * DESCRIPCIÓN: Actualiza la información de una línea existente en el sistema
 *              con validación del nombre y opción de cambiar estado activo.
 * 
 * PARÁMETROS:
 *   - wid_categoria: ID de la categoría de la línea (obligatorio)
 *   - wid_linea: ID de la línea a actualizar (obligatorio)
 *   - wnom_linea: Nuevo nombre de la línea (obligatorio, mínimo 3 caracteres)
 *   - wind_activo: Nuevo estado activo (opcional, mantiene actual si es NULL)
 *   - wusr_operacion: ID del usuario que realiza la operación (obligatorio, DECIMAL)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar que el nombre de línea sea válido
 *   2. Validar que el ID de usuario de operación sea válido
 *   3. Actualizar información de la línea específica
 *   4. Mantener estado actual si no se especifica nuevo estado
 *   5. Actualizar timestamp de modificación
 *   6. Confirmar éxito de la operación
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_update_linea(
    wid_categoria tab_lineas.id_categoria%TYPE,
    wid_linea tab_lineas.id_linea%TYPE,
    wnom_linea tab_lineas.nom_linea%TYPE,
    wind_activo tab_lineas.ind_activo%TYPE,
    wusr_operacion tab_lineas.usr_update%TYPE  -- Ahora es DECIMAL(10)
) RETURNS VARCHAR AS
$$
BEGIN
    -- VALIDACIÓN 1: Nombre de la línea
    IF wnom_linea IS NULL OR wnom_linea = '' OR LENGTH(TRIM(wnom_linea)) < 3 THEN
        RETURN 'Error: El nombre de la línea es obligatorio y debe tener al menos 3 caracteres.';
    END IF;

    -- VALIDACIÓN 2: ID de usuario operación para auditoría
    IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
        RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
    END IF;

    -- ACTUALIZACIÓN: Modificar información de la línea específica
    UPDATE tab_lineas SET 
        nom_linea = wnom_linea,                                 -- Nuevo nombre
        ind_activo = COALESCE(wind_activo, ind_activo),         -- Nuevo estado (mantiene actual si NULL)
        usr_update = wusr_operacion,                            -- ID del usuario que actualiza
        fec_update = NOW()                                      -- Timestamp de actualización
    WHERE id_categoria = wid_categoria AND id_linea = wid_linea;
    
    -- VERIFICACIÓN: Confirmar que la actualización fue exitosa
    IF FOUND THEN
        RAISE NOTICE 'Línea actualizada exitosamente: % por usuario ID: %', wnom_linea, wusr_operacion;
        RETURN 'Línea actualizada correctamente';
    ELSE
        RAISE NOTICE 'Error: Línea no encontrada o no se pudo actualizar';
        RETURN 'Error: Línea no encontrada o no se pudo actualizar';
    END IF;
END;
$$
LANGUAGE plpgsql;

-- Ejemplos de uso corregidos (ahora con IDs numéricos)
SELECT 
    id_categoria,
    id_linea,
    nom_linea,
    ind_activo,
    usr_insert,
    fec_insert,
    usr_update,
    fec_update
FROM tab_lineas;
SELECT fun_update_linea(1, 1, 'Electrodomesticos', TRUE, 1234567890);
SELECT fun_update_linea(2, 1, 'Women', NULL, 1234567890);

