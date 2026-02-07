/*
 * FUNCIÓN: fun_deactivate_activate_proveedores 
 * 
 * DESCRIPCIÓN: Activa o desactiva un proveedor del sistema mediante eliminación lógica.
 *              No elimina físicamente el registro, solo cambia su estado según el parámetro.
 * 
 * PARÁMETROS:
 *   - wid_proveedor: ID del proveedor a activar/desactivar (obligatorio)
 *   - wusr_operacion: Usuario que realiza la operación (obligatorio)
 *   - wactivar: BOOLEAN - TRUE para activar, FALSE para desactivar (obligatorio)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar usuario operación para auditoría
 *   2. Buscar proveedor por ID
 *   3. Verificar que el estado actual es diferente al solicitado
 *   4. Cambiar estado según wactivar (TRUE/FALSE)
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
CREATE OR REPLACE FUNCTION fun_deactivate_activate_proveedores(
    wid_proveedor tab_proveedores.id_proveedor%TYPE,
    wusr_operacion tab_proveedores.usr_update%TYPE,
    wactivar BOOLEAN
) RETURNS VARCHAR AS
$$
DECLARE
    v_estado_actual BOOLEAN;
    v_accion TEXT;
BEGIN
    -- VALIDACIÓN 1: ID de usuario operación para auditoría
    IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
        RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
    END IF;

    -- Obtener el estado actual del proveedor
    SELECT ind_activo INTO v_estado_actual
    FROM tab_proveedores
    WHERE id_proveedor = wid_proveedor;
    
    -- VALIDACIÓN: Verificar que el proveedor existe
    IF v_estado_actual IS NULL THEN
        RETURN 'Error: Proveedor no encontrado';
    END IF;
    
    -- VALIDACIÓN: Verificar que el estado es diferente al solicitado
    IF v_estado_actual = wactivar THEN
        RETURN FORMAT('Error: El proveedor ya está %s', 
                     CASE WHEN wactivar THEN 'activo' ELSE 'inactivo' END);
    END IF;
    
    -- Determinar el texto de la acción
    v_accion := CASE WHEN wactivar THEN 'activado' ELSE 'desactivado' END;

    -- ACTIVACIÓN/DESACTIVACIÓN: Cambiar estado del proveedor según wactivar
    UPDATE tab_proveedores SET 
        ind_activo = wactivar,
        usr_update = wusr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_proveedor = wid_proveedor;
    
    -- VERIFICACIÓN: Confirmar que la operación fue exitosa
    IF FOUND THEN
        RAISE NOTICE 'Proveedor %s exitosamente - ID: % por usuario ID: %', v_accion, wid_proveedor, wusr_operacion;
        RETURN FORMAT('Proveedor %s correctamente', v_accion);
    ELSE
        RAISE NOTICE 'No se pudo actualizar el proveedor - ID: %', wid_proveedor;
        RETURN 'Error: No se pudo actualizar el proveedor';
    END IF;

    -- MANEJO DE ERRORES: Capturar excepciones inesperadas
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 'Error inesperado: ' || SQLERRM;
            ROLLBACK;
END;
$$
LANGUAGE plpgsql;

-- Mantener compatibilidad con el nombre anterior
CREATE OR REPLACE FUNCTION fun_deactivate_proveedores(
    wid_proveedor tab_proveedores.id_proveedor%TYPE,
    wusr_operacion tab_proveedores.usr_update%TYPE
) RETURNS VARCHAR AS $$
BEGIN
    RETURN fun_deactivate_activate_proveedores(wid_proveedor, wusr_operacion, FALSE);
END;
$$ LANGUAGE plpgsql;

