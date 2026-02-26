/*
 * FUNCIÓN: fun_insert_sublinea
 * 
 * DESCRIPCIÓN: Inserta una nueva sublínea de productos en el sistema asociada a una línea específica.
 *              Genera automáticamente el ID secuencial de sublínea dentro de la línea.
 * 
 * PARÁMETROS:
 *   - wid_categoria: ID de la categoría padre (obligatorio, > 0)
 *   - wid_linea: ID de la línea padre (obligatorio, > 0, debe existir y estar activa)
 *   - wnom_sublinea: Nombre de la sublínea (obligatorio, mínimo 3 caracteres)
 *   - wind_activo: Estado activo de la sublínea (opcional, default TRUE)
 *   - wusr_operacion: ID del usuario que realiza la operación para auditoría (obligatorio, DECIMAL)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar ID de categoría
 *   2. Validar ID de línea
 *   3. Validar nombre de sublínea
 *   4. Validar ID de usuario operación para auditoría
 *   5. Verificar que la línea existe y está activa
 *   6. Generar ID secuencial de sublínea dentro de la línea
 *   7. Insertar nueva sublínea
 *   8. Confirmar éxito de la operación
 * 
 * MANEJO DE ERRORES:
 *   - SQLSTATE '23503': Violación de clave foránea (línea no existe)
 *   - OTHERS: Cualquier otra excepción con ROLLBACK
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_insert_sublinea(
    wid_categoria tab_sublineas.id_categoria%TYPE,
    wid_linea tab_sublineas.id_linea%TYPE,
    wnom_sublinea tab_sublineas.nom_sublinea%TYPE,
    wusr_operacion tab_sublineas.usr_insert%TYPE  -- Ahora es DECIMAL(10)
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

    -- VALIDACIÓN 3: Nombre de la sublínea
    IF wnom_sublinea IS NULL OR wnom_sublinea = '' OR LENGTH(TRIM(wnom_sublinea)) < 3 THEN
        RETURN 'Error: El nombre de la sublínea es obligatorio y debe tener al menos 3 caracteres.';
    END IF;

    -- VALIDACIÓN 4: ID de usuario operación para auditoría
    IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
        RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
    END IF;

    -- VALIDACIÓN 5: Verificar que la línea exista y esté activa
    IF NOT EXISTS (SELECT 1 FROM tab_lineas WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND ind_activo = TRUE) THEN
        RETURN 'Error: La línea especificada no existe o está inactiva.';
    END IF;

    -- INSERCIÓN: Crear nueva sublínea con ID secuencial
    INSERT INTO tab_sublineas (id_categoria, id_linea, id_sublinea, nom_sublinea, usr_insert)
    VALUES (
        wid_categoria,                                          -- Categoría padre
        wid_linea,                                              -- Línea padre
        (SELECT COALESCE(MAX(ts.id_sublinea), 0) + 1 FROM tab_sublineas ts WHERE ts.id_categoria = wid_categoria AND ts.id_linea = wid_linea),  -- ID secuencial
        wnom_sublinea,                                          -- Nombre de la sublínea
        wusr_operacion                                          -- ID del usuario que realiza la inserción
    );

    -- VERIFICACIÓN: Confirmar que la inserción fue exitosa
    IF FOUND THEN
        RAISE NOTICE 'Sublínea insertada exitosamente: % por usuario ID: %', wnom_sublinea, wusr_operacion;
        RETURN 'Sublínea insertada correctamente';
    ELSE
        RAISE NOTICE 'Error: No se pudo insertar la sublínea';
        RETURN 'Error al insertar la sublínea';
    END IF;

-- MANEJO DE ERRORES: Capturar excepciones específicas
EXCEPTION
    WHEN SQLSTATE '23503' THEN
        RETURN 'Error: La línea especificada no existe.';
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
    id_sublinea,
    nom_sublinea,
    ind_activo,
    usr_insert,
    fec_insert,
    usr_update,
    fec_update
FROM tab_sublineas;
SELECT fun_insert_sublinea(1, 1, 'Neveras', TRUE, 1234567890);
SELECT fun_insert_sublinea(1, 1, 'Lavadoras', TRUE, 1234567890);
SELECT fun_insert_sublinea(1, 1, 'Secadoras', TRUE, 1234567890);
SELECT fun_insert_sublinea(1, 1, 'Aspiradoras', TRUE, 1234567890);
SELECT fun_insert_sublinea(1, 1, 'Microondas', TRUE, 1234567890);
SELECT fun_insert_sublinea(2, 1, 'Vestidos', TRUE, 1234567890);
SELECT fun_insert_sublinea(2, 1, 'Pantalones', TRUE, 1234567890);
SELECT fun_insert_sublinea(2, 1, 'Camisetas', TRUE, 1234567890);
SELECT fun_insert_sublinea(2, 1, 'Zapatos', TRUE, 1234567890);
SELECT fun_insert_sublinea(2, 1, 'Accesorios', TRUE, 1234567890);


