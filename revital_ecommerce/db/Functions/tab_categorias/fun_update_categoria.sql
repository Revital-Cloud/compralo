/*
 * FUNCIÓN: fun_update_categoria
 * 
 * DESCRIPCIÓN: Actualiza la información de una categoría existente en el sistema
 *              con validación del nombre y opción de cambiar estado activo.
 * 
 * PARÁMETROS:
 *   - wid_categoria: ID de la categoría a actualizar (obligatorio)
 *   - wnom_categoria: Nuevo nombre de la categoría (obligatorio, mínimo 3 caracteres)
 *   - wind_activo: Nuevo estado activo (opcional, mantiene actual si es NULL)
 *   - wusr_operacion: ID del usuario que realiza la operación para auditoría (obligatorio, DECIMAL)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar que el nombre de categoría sea válido
 *   2. Validar que el ID de usuario de operación sea válido
 *   3. Actualizar información de la categoría
 *   4. Mantener estado actual si no se especifica nuevo estado
 *   5. Actualizar timestamp de modificación
 *   6. Confirmar éxito de la operación
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_update_categoria(
    wid_categoria tab_categorias.id_categoria%TYPE,
    wnom_categoria tab_categorias.nom_categoria%TYPE,
    wind_activo tab_categorias.ind_activo%TYPE,
    wusr_operacion tab_categorias.usr_update%TYPE  -- Ahora es DECIMAL(10)
) RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: Nombre de la categoría
        IF wnom_categoria IS NULL OR wnom_categoria = '' OR LENGTH(TRIM(wnom_categoria)) < 3 THEN
            RETURN 'Error: El nombre de la categoría es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 2: ID de usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
            RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
        END IF;

        -- ACTUALIZACIÓN: Modificar información de la categoría
        UPDATE tab_categorias SET 
            nom_categoria = wnom_categoria,                         -- Nuevo nombre
            ind_activo = COALESCE(wind_activo, ind_activo),         -- Nuevo estado (mantiene actual si NULL)
            usr_update = wusr_operacion,                            -- ID del usuario que actualiza
            fec_update = NOW()                                      -- Timestamp de actualización
        WHERE id_categoria = wid_categoria;
        
        -- VERIFICACIÓN: Confirmar que la actualización fue exitosa
        IF FOUND THEN
            RAISE NOTICE 'Categoría actualizada exitosamente: % por usuario ID: %', wnom_categoria, wusr_operacion;
            RETURN 'Categoría actualizada correctamente';
        ELSE 	
            RAISE NOTICE 'Error: Categoría no encontrada o no se pudo actualizar';
            RETURN 'Error: Categoría no encontrada o no se pudo actualizar';
        END IF;
    END;
$$
LANGUAGE plpgsql;

-- Ejemplo de uso corregido (ahora con ID numérico)
SELECT * FROM tab_categorias;
SELECT fun_update_categoria(1, 'Nueva Categoria', TRUE, 1234567890);

