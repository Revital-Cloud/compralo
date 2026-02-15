/*
 * FUNCIÓN: fun_insert_proveedores
 * 
 * DESCRIPCIÓN: Inserta un nuevo proveedor en el sistema con generación automática de ID.
 *              Valida información básica del proveedor antes de la inserción.
 * 
 * PARÁMETROS:
 *   - wnom_proveedor: Nombre del proveedor (obligatorio, mínimo 3 caracteres)
 *   - wemail: Correo electrónico del proveedor (obligatorio, mínimo 3 caracteres, único)
 *   - wtel_proveedor: Número de teléfono del proveedor (obligatorio, > 0)
 *   - wind_activo: Estado activo del proveedor (obligatorio)
 *   - wusr_operacion: Usuario que realiza la operación para auditoría
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar nombre del proveedor
 *   2. Validar email del proveedor
 *   3. Validar teléfono del proveedor
 *   4. Validar ID de usuario operación para auditoría
 *   5. Generar ID secuencial automático
 *   6. Insertar nuevo proveedor
 *   7. Confirmar éxito de la operación
 * 
 * MANEJO DE ERRORES:
 *   - SQLSTATE '23505': Violación de unicidad (email ya existe)
 *   - OTHERS: Cualquier otra excepción con ROLLBACK
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_insert_proveedores(
    wnom_proveedor tab_proveedores.nom_proveedor%TYPE,
    wemail tab_proveedores.email%TYPE,
    wtel_proveedor tab_proveedores.tel_proveedor%TYPE,
    wusr_operacion tab_proveedores.usr_insert%TYPE 
) RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: Nombre del proveedor
        IF wnom_proveedor IS NULL OR wnom_proveedor = '' OR LENGTH(TRIM(wnom_proveedor)) < 3 THEN
            RETURN 'Error: El nombre del proveedor es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 2: Email del proveedor
        IF wemail IS NULL OR wemail = '' OR LENGTH(TRIM(wemail)) < 3 THEN
            RETURN 'Error: El email del proveedor es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 3: Teléfono del proveedor
        IF wtel_proveedor IS NULL OR wtel_proveedor = 0 THEN
            RETURN 'Error: El teléfono del proveedor es obligatorio y debe ser mayor a 0.';
        END IF;

        -- VALIDACIÓN 4: ID de usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
            RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
        END IF;

        -- INSERCIÓN: Crear nuevo proveedor con ID secuencial
        INSERT INTO tab_proveedores (id_proveedor, nom_proveedor, email, tel_proveedor, usr_insert)
        VALUES (
            (SELECT COALESCE(MAX(tp.id_proveedor), 0) + 1 FROM tab_proveedores tp),  -- ID secuencial automático
            wnom_proveedor,                                     -- Nombre del proveedor
            wemail,                                             -- Email del proveedor
            wtel_proveedor,                                     -- Teléfono del proveedor
            wusr_operacion                                      -- ID del usuario que realiza la inserción
        );
        
        -- VERIFICACIÓN: Confirmar que la inserción fue exitosa
        IF FOUND THEN
            RAISE NOTICE 'Proveedor insertado exitosamente: % por usuario ID: %', wnom_proveedor, wusr_operacion;
            RETURN 'Proveedor insertado correctamente';
        ELSE
            RAISE NOTICE 'Error: No se pudo insertar el proveedor';
            RETURN 'Error al insertar el proveedor';
        END IF;
        
    -- MANEJO DE ERRORES: Capturar excepciones específicas
    EXCEPTION
        WHEN SQLSTATE '23505' THEN
            RETURN 'Error: El email del proveedor ya existe en el sistema.';
        WHEN OTHERS THEN
            RETURN 'Error inesperado: ' || SQLERRM;
            ROLLBACK;
    END;
$$
LANGUAGE plpgsql;
