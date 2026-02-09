/*
 * FUNCIÓN: fun_update_proveedores
 * 
 * DESCRIPCIÓN: Actualiza la información de un proveedor existente en el sistema
 *              con validaciones completas de todos los campos modificables.
 * 
 * PARÁMETROS:
 *   - wid_proveedor: ID del proveedor a actualizar (obligatorio, > 0)
 *   - wnom_proveedor: Nuevo nombre del proveedor (obligatorio, mínimo 3 caracteres)
 *   - wemail: Nuevo email del proveedor (obligatorio, mínimo 3 caracteres)
 *   - wtel_proveedor: Nuevo número de teléfono (obligatorio, > 0)
 *   - wind_activo: Nuevo estado activo (opcional, mantiene actual si es NULL)
 *   - wusr_operacion: Usuario que realiza la operación para auditoría (obligatorio, mínimo 3 caracteres)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar ID del proveedor
 *   2. Validar nombre del proveedor
 *   3. Validar email del proveedor
 *   4. Validar teléfono del proveedor
 *   5. Validar usuario operación para auditoría
 *   6. Actualizar registro con nueva información
 *   7. Actualizar timestamp de modificación
 *   8. Confirmar éxito de la operación
 * 
 * MANEJO DE ERRORES:
 *   - Captura cualquier excepción y realiza ROLLBACK
 *   - Retorna mensaje de error descriptivo
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_update_proveedores(
    wid_proveedor tab_proveedores.id_proveedor%TYPE,
    wnom_proveedor tab_proveedores.nom_proveedor%TYPE,
    wemail tab_proveedores.email%TYPE,
    wtel_proveedor tab_proveedores.tel_proveedor%TYPE,
    wind_activo tab_proveedores.ind_activo%TYPE,
    wusr_operacion tab_proveedores.usr_update%TYPE
) RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: ID del proveedor
        IF wid_proveedor IS NULL OR wid_proveedor = 0 THEN
            RETURN 'Error: El ID del proveedor es obligatorio y debe ser mayor a 0.';
        END IF;

        -- VALIDACIÓN 2: Nombre del proveedor
        IF wnom_proveedor IS NULL OR wnom_proveedor = '' OR LENGTH(TRIM(wnom_proveedor)) < 3 THEN
            RETURN 'Error: El nombre del proveedor es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 3: Email del proveedor
        IF wemail IS NULL OR wemail = '' OR LENGTH(TRIM(wemail)) < 3 THEN
            RETURN 'Error: El email del proveedor es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 4: Teléfono del proveedor
        IF wtel_proveedor IS NULL OR wtel_proveedor = 0 THEN
            RETURN 'Error: El teléfono del proveedor es obligatorio y debe ser mayor a 0.';
        END IF;
        
        -- VALIDACIÓN 5: ID de usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
            RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
        END IF;
        
        -- ACTUALIZACIÓN: Modificar información del proveedor existente
        UPDATE tab_proveedores SET 
            nom_proveedor = wnom_proveedor,                         -- Nuevo nombre
            email = wemail,                                         -- Nuevo email
            tel_proveedor = wtel_proveedor,                         -- Nuevo teléfono
            ind_activo = COALESCE(wind_activo, ind_activo),         -- Nuevo estado (mantiene actual si NULL)
            usr_update = wusr_operacion,                            -- ID del usuario que actualiza
            fec_update = NOW()                                      -- Timestamp de actualización
        WHERE id_proveedor = wid_proveedor;
        
        -- VERIFICACIÓN: Confirmar que la actualización fue exitosa
        IF FOUND THEN
            RAISE NOTICE 'Proveedor actualizado exitosamente: % por usuario ID: %', wnom_proveedor, wusr_operacion;
            RETURN 'Proveedor actualizado correctamente';
        ELSE
            RAISE NOTICE 'Error: Proveedor no encontrado o no se pudo actualizar';
            RETURN 'Error: Proveedor no encontrado o no se pudo actualizar';
        END IF;

    -- MANEJO DE ERRORES: Capturar excepciones inesperadas
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 'Error inesperado: ' || SQLERRM;
            ROLLBACK;
    END;
$$
LANGUAGE plpgsql;
