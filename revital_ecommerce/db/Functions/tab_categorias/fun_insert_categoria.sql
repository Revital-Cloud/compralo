/*
 * FUNCIÓN: fun_insert_categoria
 * 
 * DESCRIPCIÓN: Inserta una nueva categoría en el sistema de clasificación de productos.
 *              Las categorías son el primer nivel de organización de productos.
 * 
 * PARÁMETROS:
 *   - wnom_categoria: Nombre de la categoría (obligatorio, mínimo 3 caracteres)
 *   - wusr_operacion: ID del usuario que realiza la operación (obligatorio, DECIMAL)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar nombre de categoría (longitud mínima)
 *   2. Validar ID de usuario operación para auditoría
 *   3. Generar ID secuencial automático
 *   4. Insertar categoría en la base de datos
 *   5. Confirmar éxito de la operación
 * 
 * MANEJO DE ERRORES:
 *   - Captura errores de integridad referencial
 *   - Manejo genérico de otros errores con ROLLBACK
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_insert_categoria
(
    wnom_categoria tab_categorias.nom_categoria%TYPE,
    wusr_operacion tab_categorias.usr_insert%TYPE
) RETURNS VARCHAR AS
$$
BEGIN
    -- VALIDACIÓN 1: Nombre de categoría obligatorio y con longitud mínima
    IF wnom_categoria IS NULL OR wnom_categoria = '' OR LENGTH(TRIM(wnom_categoria)) < 3 THEN
        RETURN 'Error: El nombre de la categoría es obligatorio y debe tener al menos 3 caracteres.';
    END IF;

    -- VALIDACIÓN 2: ID de usuario operación para auditoría
    IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
        RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
    END IF;

    -- INSERCIÓN: Crear nueva categoría con ID secuencial automático
    INSERT INTO tab_categorias (id_categoria, nom_categoria, usr_insert)
    VALUES (
        -- Generar ID secuencial automático
        (SELECT COALESCE(MAX(id_categoria),0) + 1 FROM tab_categorias), 
        wnom_categoria,     -- Nombre de la categoría
        wusr_operacion      -- ID del usuario que realiza la inserción
    );

    -- VERIFICACIÓN: Confirmar que la inserción fue exitosa
    IF FOUND THEN
        RAISE NOTICE 'Categoría insertada exitosamente: % por usuario ID: %', wnom_categoria, wusr_operacion;
        RETURN 'Categoría insertada correctamente';
    ELSE 	
        RAISE NOTICE 'Error: No se pudo insertar la categoría';
        RETURN 'Error al insertar la categoría';
    END IF;

-- MANEJO DE ERRORES: Capturar y manejar excepciones específicas
EXCEPTION
    WHEN SQLSTATE '23503' THEN
        -- Error de integridad referencial (foreign key constraint)
        RETURN 'Error: Violación de integridad referencial. Verifique las relaciones.';
    WHEN OTHERS THEN
        -- Manejo genérico de otros errores
        RETURN 'Error inesperado: ' || SQLERRM;
        ROLLBACK;
END;
$$
LANGUAGE plpgsql;


