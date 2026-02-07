/*
 * FUNCIÓN: fun_update_sublinea
 * 
 * DESCRIPCIÓN: Actualiza la información de una sublínea existente en el sistema
 *              con validación del nombre y opción de cambiar estado activo.
 * 
 * PARÁMETROS:
 *   - wid_categoria: ID de la categoría de la sublínea (obligatorio, > 0)
 *   - wid_linea: ID de la línea de la sublínea (obligatorio, > 0)
 *   - wid_sublinea: ID de la sublínea a actualizar (obligatorio, > 0)
 *   - wnom_sublinea: Nuevo nombre de la sublínea (obligatorio, mínimo 3 caracteres)
 *   - wind_activo: Nuevo estado activo (opcional, mantiene actual si es NULL)
 *   - wusr_operacion: ID del usuario que realiza la operación para auditoría (obligatorio, DECIMAL)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar todos los identificadores (categoría, línea, sublínea)
 *   2. Validar que el nombre de sublínea sea válido
 *   3. Actualizar información de la sublínea específica
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
CREATE OR REPLACE FUNCTION fun_update_sublinea(
    wid_categoria tab_categorias.id_categoria%TYPE,
    wid_linea tab_lineas.id_linea%TYPE,
    wid_sublinea tab_sublineas.id_sublinea%TYPE,
    wnom_sublinea tab_sublineas.nom_sublinea%TYPE,
    wind_activo tab_sublineas.ind_activo%TYPE,
    wusr_operacion tab_sublineas.usr_update%TYPE  -- Ahora es DECIMAL(10)
) RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: ID de categoría
        IF wid_categoria IS NULL OR wid_categoria = 0 THEN
            RETURN 'Error: El ID de categoría es obligatorio y debe ser mayor a 0.';
        END IF;

        -- VALIDACIÓN 2: ID de línea
        IF wid_linea IS NULL OR wid_linea = 0 THEN
            RETURN 'Error: El ID de línea es obligatorio y debe ser mayor a 0.';
        END IF;

        -- VALIDACIÓN 3: ID de sublínea
        IF wid_sublinea IS NULL OR wid_sublinea = 0 THEN
            RETURN 'Error: El ID de sublínea es obligatorio y debe ser mayor a 0.';
        END IF;

        -- VALIDACIÓN 4: Nombre de la sublínea
        IF wnom_sublinea IS NULL OR wnom_sublinea = '' OR LENGTH(TRIM(wnom_sublinea)) < 3 THEN
            RETURN 'Error: El nombre de la sublínea es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 5: ID de usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
            RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
        END IF;

        -- ACTUALIZACIÓN: Modificar información de la sublínea específica
        UPDATE tab_sublineas
        SET nom_sublinea = wnom_sublinea,                           -- Nuevo nombre
            ind_activo = COALESCE(wind_activo, ind_activo),         -- Nuevo estado (mantiene actual si NULL)
            usr_update = wusr_operacion                            -- ID del usuario que actualiza
        WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND id_sublinea = wid_sublinea;

        -- VERIFICACIÓN: Confirmar que la actualización fue exitosa
        IF FOUND THEN
            RAISE NOTICE 'Sublínea actualizada exitosamente: % por usuario ID: %', wnom_sublinea, wusr_operacion;
            RETURN 'Sublínea actualizada correctamente';
        ELSE
            RAISE NOTICE 'Error: Sublínea no encontrada o no se pudo actualizar';
            RETURN 'Error: Sublínea no encontrada o no se pudo actualizar';
        END IF;

    -- MANEJO DE ERRORES: Capturar excepciones inesperadas
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 'Error inesperado: ' || SQLERRM;
            ROLLBACK;
    END;
$$
LANGUAGE plpgsql;

-- Ejemplos de uso corregidos (ahora con IDs numéricos)
SELECT fun_update_sublinea(1, 1, 1, 'Neveras', NULL, 1234567890);
SELECT fun_update_sublinea(1, 1, 2, 'Lavadoras', NULL, 1234567890);