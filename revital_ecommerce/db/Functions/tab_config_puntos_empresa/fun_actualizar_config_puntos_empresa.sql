/*
 * FUNCIÓN: fun_actualizar_config_puntos_empresa
 * 
 * DESCRIPCIÓN: Actualiza la configuración activa del sistema de puntos de la empresa.
 *              Permite modificar la relación pesos-puntos y su descripción.
 * 
 * PARÁMETROS:
 *   - p_id_config_puntos: ID de la configuración a actualizar (obligatorio, > 0)
 *   - p_nuevo_pesos_por_punto: Nuevo valor en pesos por punto (obligatorio, > 0)
 *   - p_descripcion: Nueva descripción de la configuración (opcional)
 *   - p_usr_operacion: Usuario que realiza la operación (obligatorio)
 * 
 * RETORNA: JSON - Objeto con resultado de la operación:
 *   - success: booleano indicando éxito
 *   - message: mensaje descriptivo
 *   - nuevo_valor: valor actualizado (si aplica)
 * 
 * LÓGICA:
 *   1. Validar que el ID de configuración sea válido
 *   2. Validar que el valor de pesos por punto sea positivo
 *   3. Validar que el usuario de operación sea válido
 *   4. Verificar que existe la configuración específica y está activa
 *   5. Actualizar configuración específica por ID
 *   6. Generar descripción automática si no se proporciona
 *   7. Retornar resultado de la operación
 * 
 * NOTA: Solo actualiza la configuración específica por ID y que esté activa
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_actualizar_config_puntos_empresa(
    p_id_config_puntos tab_config_puntos_empresa.id_config_puntos%TYPE,
    p_nuevo_pesos_por_punto tab_config_puntos_empresa.pesos_por_punto%TYPE,
    p_descripcion tab_config_puntos_empresa.descripcion%TYPE,
    p_usr_operacion tab_config_puntos_empresa.usr_update%TYPE
) RETURNS JSON AS $$
BEGIN
    -- VALIDACIÓN 1: ID de configuración es obligatorio
    IF p_id_config_puntos IS NULL OR p_id_config_puntos <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El ID de configuración es obligatorio y debe ser mayor a 0'
        );
    END IF;
    
    -- VALIDACIÓN 2: Valor de pesos por punto debe ser positivo
    IF p_nuevo_pesos_por_punto IS NULL OR p_nuevo_pesos_por_punto <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El valor de pesos por punto es obligatorio y debe ser mayor a 0'
        );
    END IF;
    
    -- VALIDACIÓN 3: Usuario operación para auditoría
    IF p_usr_operacion IS NULL OR p_usr_operacion <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario que realiza la operación es obligatorio para auditoría'
        );
    END IF;
    
    -- VALIDACIÓN 4: Verificar que existe la configuración específica y está activa
    IF NOT EXISTS (
        SELECT 1 FROM tab_config_puntos_empresa 
        WHERE id_config_puntos = p_id_config_puntos AND ind_activo = TRUE
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No existe una configuración activa con el ID especificado: ' || p_id_config_puntos,
            'sugerencia', 'Verifique el ID o ejecute fun_crear_config_puntos_empresa() para crear una nueva configuración'
        );
    END IF;
    
    -- ACTUALIZACIÓN: Modificar configuración específica del sistema de puntos
    UPDATE tab_config_puntos_empresa 
    SET 
        pesos_por_punto = p_nuevo_pesos_por_punto,                  -- Nuevo valor pesos por punto
        descripcion = COALESCE(                                     -- Nueva descripción
            p_descripcion, 
            'Actualizado: 1 punto por cada $' || p_nuevo_pesos_por_punto::TEXT || ' pesos'
        ),
        usr_update = p_usr_operacion,                               -- Usuario que actualiza
        fec_update = NOW()                                          -- Timestamp de actualización
    WHERE id_config_puntos = p_id_config_puntos                     -- Configuración específica por ID
      AND ind_activo = TRUE;                                        -- Y que esté activa (seguridad extra)
    
    -- VERIFICACIÓN: Confirmar que se actualizó al menos una fila
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se pudo actualizar la configuración de puntos'
        );
    END IF;
    
    -- RESPUESTA: Confirmar éxito con información actualizada
    RETURN json_build_object(
        'success', true,
        'message', 'Configuración de puntos actualizada exitosamente',
        'nuevo_valor', p_nuevo_pesos_por_punto,
        'descripcion_actualizada', COALESCE(
            p_descripcion, 
            'Actualizado: 1 punto por cada $' || p_nuevo_pesos_por_punto::TEXT || ' pesos'
        )
    );
-- MANEJO DE ERRORES: Capturar excepciones
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error inesperado al actualizar configuración: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- EJEMPLOS DE USO Y PRUEBAS
-- =============================================================

-- PASO 1: Verificar configuración actual y obtener ID
-- SELECT id_config_puntos, pesos_por_punto, descripcion 
-- FROM tab_config_puntos_empresa WHERE ind_activo = TRUE;

-- PASO 2: Actualizar configuración específica
-- Ejemplo 1: Actualizar configuración básica (usar ID real obtenido en PASO 1)
-- SELECT fun_actualizar_config_puntos_empresa(1, 500.00, NULL, 1000000000);

-- Ejemplo 2: Actualizar con descripción personalizada
-- SELECT fun_actualizar_config_puntos_empresa(1, 750.00, 'Actualización: 1 punto por cada $750 pesos gastados', 1000000000);

-- PASO 3: Verificar todas las configuraciones después de actualizar
-- SELECT id_config_puntos, pesos_por_punto, descripcion, ind_activo, fec_update 
-- FROM tab_config_puntos_empresa ORDER BY fec_insert DESC;

-- FUNCIÓN AUXILIAR: Para obtener ID de configuración activa
-- SELECT id_config_puntos FROM tab_config_puntos_empresa WHERE ind_activo = TRUE LIMIT 1;