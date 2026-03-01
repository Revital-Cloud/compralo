/*
 * FUNCIÓN: fun_crear_config_puntos_empresa
 * 
 * DESCRIPCIÓN: Crea la configuración inicial del sistema de puntos de la empresa.
 *              Esta función debe ejecutarse al configurar el sistema por primera vez.
 * 
 * PARÁMETROS:
 *   - p_pesos_por_punto: Valor en pesos por punto (obligatorio, > 0)
 *   - p_descripcion: Descripción de la configuración (opcional)
 *   - p_usr_operacion: Usuario que realiza la operación (obligatorio, DECIMAL)
 * 
 * RETORNA: JSON - Objeto con resultado de la operación:
 *   - success: booleano indicando éxito
 *   - message: mensaje descriptivo
 *   - config_id: ID de la configuración creada
 *   - valor_configurado: valor configurado
 * 
 * LÓGICA:
 *   1. Validar que no exista ya una configuración activa
 *   2. Validar parámetros de entrada
 *   3. Desactivar cualquier configuración previa (por seguridad)
 *   4. Crear nueva configuración activa
 *   5. Retornar resultado de la operación
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_crear_config_puntos_empresa(
    p_pesos_por_punto DECIMAL(10,2),
    p_descripcion VARCHAR,
    p_usr_operacion tab_config_puntos_empresa.usr_insert%TYPE
) RETURNS JSON AS $$
DECLARE
    v_config_existente INTEGER;
    v_nuevo_id INTEGER;
    v_descripcion_final VARCHAR;
BEGIN
    -- VALIDACIÓN 1: Verificar si ya existe una configuración activa
    SELECT COUNT(1) INTO v_config_existente 
    FROM tab_config_puntos_empresa 
    WHERE ind_activo = TRUE;
    
    IF v_config_existente > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Ya existe una configuración activa. Use la función de actualización en su lugar.',
            'sugerencia', 'Ejecute fun_actualizar_config_puntos_empresa() para modificar la configuración existente'
        );
    END IF;
    
    -- VALIDACIÓN 2: Valor de pesos por punto debe ser positivo
    IF p_pesos_por_punto IS NULL OR p_pesos_por_punto <= 0 THEN
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

    
    -- PREPARAR: Descripción final
    v_descripcion_final := COALESCE(
        p_descripcion, 
        'Configuración inicial: 1 punto por cada $' || p_pesos_por_punto::TEXT || ' pesos gastados'
    );
    
    -- INSERCIÓN: Crear nueva configuración activa
    INSERT INTO tab_config_puntos_empresa (
        pesos_por_punto,
        ind_activo,
        descripcion,
        fec_inicio_vigencia,
        fec_fin_vigencia,
        usr_insert
    ) VALUES (
        p_pesos_por_punto,          -- Valor pesos por punto
        TRUE,                       -- Configuración activa
        v_descripcion_final,        -- Descripción
        CURRENT_DATE,               -- Vigente desde hoy
        NULL,                       -- Sin fecha fin (indefinida)
        p_usr_operacion            -- Usuario que crea
    ) RETURNING id_config_puntos INTO v_nuevo_id;
    
    -- VERIFICACIÓN: Confirmar que se insertó correctamente
    IF v_nuevo_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al crear la configuración de puntos'
        );
    END IF;
    
    -- RESPUESTA: Confirmar éxito con información de la configuración creada
    RETURN json_build_object(
        'success', true,
        'message', 'Configuración de puntos creada exitosamente',
        'config_id', v_nuevo_id,
        'valor_configurado', p_pesos_por_punto,
        'descripcion', v_descripcion_final,
        'fecha_vigencia', CURRENT_DATE
    );
    
-- MANEJO DE ERRORES: Capturar excepciones
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error inesperado al crear configuración: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- EJEMPLOS DE USO Y PRUEBAS
-- =============================================================

-- Ejemplo 1: Crear configuración básica (1 punto por cada $1000 pesos)
-- SELECT fun_crear_config_puntos_empresa(1000.00, NULL, 1000000000);

-- Ejemplo 2: Crear configuración con descripción personalizada
-- SELECT fun_crear_config_puntos_empresa(500.00, 'Promoción especial: 1 punto por cada $500 pesos', 1000000000);

-- Verificar configuración creada
-- SELECT 
--   id_config_puntos,
--   pesos_por_punto,
--   ind_activo,
--   descripcion,
--   fec_inicio_vigencia,
--   fec_fin_vigencia,
--   usr_insert,
--   fec_insert,
--   usr_update,
--   fec_update
-- FROM tab_config_puntos_empresa WHERE ind_activo = TRUE; 