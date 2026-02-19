/*
 * FUNCIÓN: fun_insert_marca
 * 
 * DESCRIPCIÓN: Inserta una nueva marca en el sistema con ID generado automáticamente.
 *              Las marcas son utilizadas para clasificar productos.
 * 
 * PARÁMETROS:
 *   - wnom_marca: Nombre de la marca (obligatorio, mínimo 1 carácter)
 *   - wind_activo: Estado activo de la marca (opcional, default TRUE)
 *   - wusr_operacion: ID del usuario que realiza la operación (obligatorio, DECIMAL)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar nombre de marca (longitud mínima)
 *   2. Validar ID de usuario operación para auditoría
 *   3. Generar ID secuencial automático
 *   4. Insertar marca en la base de datos
 *   5. Confirmar éxito de la operación
 * 
 * MANEJO DE ERRORES:
 *   - Captura cualquier excepción y realiza ROLLBACK
 *   - Retorna mensaje de error descriptivo
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_insert_marca(
    wnom_marca tab_marcas.nom_marca%TYPE,
    wusr_operacion tab_marcas.usr_insert%TYPE  -- Ahora es DECIMAL(10)
) RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: Nombre de marca obligatorio y con longitud mínima
        IF wnom_marca IS NULL OR wnom_marca = '' OR LENGTH(TRIM(wnom_marca)) < 1 THEN
            RETURN 'Error: El nombre de la marca es obligatorio y debe tener al menos 1 carácter.';
        END IF;

        -- VALIDACIÓN 2: ID de usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
            RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
        END IF;

        -- INSERCIÓN: Crear nueva marca con ID secuencial automático
        INSERT INTO tab_marcas (id_marca, nom_marca, usr_insert)
        VALUES (
            (SELECT COALESCE(MAX(tm.id_marca), 0) + 1 FROM tab_marcas tm),  -- ID generado automáticamente
            wnom_marca,                                                    -- Nombre de la marca
            wusr_operacion                                                  -- ID del usuario que realiza la inserción
        );

        -- VERIFICACIÓN: Confirmar que la inserción fue exitosa
        IF FOUND THEN
            RAISE NOTICE 'Marca insertada exitosamente: % por usuario ID: %', wnom_marca, wusr_operacion;
            RETURN 'Marca insertada correctamente';
        ELSE
            RAISE NOTICE 'Error: No se pudo insertar la marca';
            RETURN 'Error al insertar la marca';
        END IF;

    -- MANEJO DE ERRORES: Capturar excepciones específicas
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 'Error inesperado: ' || SQLERRM;
            ROLLBACK;
    END;
$$
LANGUAGE plpgsql;
