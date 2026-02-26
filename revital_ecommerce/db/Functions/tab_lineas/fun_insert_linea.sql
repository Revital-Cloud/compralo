/*
 * FUNCIÓN: fun_insert_linea
 * 
 * DESCRIPCIÓN: Inserta una nueva línea de productos en el sistema asociada a una categoría.
 *              Genera automáticamente el ID secuencial de línea dentro de la categoría.
 * 
 * PARÁMETROS:
 *   - wid_categoria: ID de la categoría padre (obligatorio, > 0, debe existir y estar activa)
 *   - wnom_linea: Nombre de la línea (obligatorio, mínimo 3 caracteres)
 *   - wind_activo: Estado activo de la línea (opcional, default TRUE)
 *   - wusr_operacion: ID del usuario que realiza la operación para auditoría (obligatorio, DECIMAL)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar ID de categoría
 *   2. Validar nombre de línea
 *   3. Validar ID de usuario operación para auditoría
 *   4. Verificar que la categoría existe y está activa
 *   5. Generar ID secuencial de línea dentro de la categoría
 *   6. Insertar nueva línea
 *   7. Confirmar éxito de la operación
 * 
 * MANEJO DE ERRORES:
 *   - SQLSTATE '23503': Violación de clave foránea (categoría no existe)
 *   - SQLSTATE '23505': Violación de unicidad (línea ya existe)
 *   - SQLSTATE '23502': Violación de NOT NULL
 *   - OTHERS: Cualquier otra excepción con ROLLBACK
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_insert_linea(
    wid_categoria tab_lineas.id_categoria%TYPE,
    wnom_linea tab_lineas.nom_linea%TYPE,
    wusr_operacion tab_lineas.usr_insert%TYPE  -- Ahora es DECIMAL(10)
) RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: ID de categoría
        IF wid_categoria IS NULL OR wid_categoria = 0 THEN
            RETURN 'Error: El ID de categoría es obligatorio y debe ser mayor a 0.';
        END IF;
        
        -- VALIDACIÓN 2: Nombre de la línea
        IF wnom_linea IS NULL OR wnom_linea = '' OR LENGTH(TRIM(wnom_linea)) < 3 THEN
            RETURN 'Error: El nombre de la línea es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 3: ID de usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
            RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
        END IF;

        -- VALIDACIÓN 4: Verificar que la categoría exista y esté activa
        IF NOT EXISTS (SELECT 1 FROM tab_categorias WHERE id_categoria = wid_categoria AND ind_activo = TRUE) THEN
            RETURN 'Error: La categoría especificada no existe o está inactiva.';
        END IF;

        -- INSERCIÓN: Crear nueva línea con ID secuencial
        INSERT INTO tab_lineas (id_categoria, id_linea, nom_linea, usr_insert)
        VALUES (
            wid_categoria,                                      -- Categoría padre
            (SELECT COALESCE(MAX(tl.id_linea), 0) + 1 FROM tab_lineas tl WHERE tl.id_categoria = wid_categoria),  -- ID secuencial
            wnom_linea,                                         -- Nombre de la línea
            wusr_operacion                                      -- ID del usuario que realiza la inserción
        );

        -- VERIFICACIÓN: Confirmar que la inserción fue exitosa
        IF FOUND THEN
            RAISE NOTICE 'Línea insertada exitosamente: % por usuario ID: %', wnom_linea, wusr_operacion;
            RETURN 'Línea insertada correctamente';
        ELSE
            RAISE NOTICE 'Error: No se pudo insertar la línea';
            RETURN 'Error al insertar la línea';
        END IF;

    -- MANEJO DE ERRORES: Capturar excepciones específicas
    EXCEPTION
        WHEN SQLSTATE '23503' THEN
            RETURN 'Error: La categoría especificada no existe.';
        WHEN SQLSTATE '23505' THEN
            RETURN 'Error: La línea ya existe en esta categoría.';
        WHEN SQLSTATE '23502' THEN
            RETURN 'Error: Faltan campos obligatorios.';
        WHEN OTHERS THEN
            RETURN 'Error inesperado: ' || SQLERRM;
            ROLLBACK;
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
SELECT fun_insert_linea(1, 'Electrodomesticos', TRUE, 1234567890);
SELECT fun_insert_linea(1, 'Telefonia', TRUE, 1234567890);
SELECT fun_insert_linea(1, 'Computacion', TRUE, 1234567890);
SELECT fun_insert_linea(1, 'Audio', TRUE, 1234567890);
SELECT fun_insert_linea(1, 'Videojuegos', TRUE, 1234567890);
SELECT fun_insert_linea(2, 'Mujer', TRUE, 1234567890);
SELECT fun_insert_linea(2, 'Hombre', TRUE, 1234567890);
SELECT fun_insert_linea(2, 'Infantil', TRUE, 1234567890);
SELECT fun_insert_linea(2, 'Deportiva', TRUE, 1234567890);
SELECT fun_insert_linea(3, 'Muebles', TRUE, 1234567890);