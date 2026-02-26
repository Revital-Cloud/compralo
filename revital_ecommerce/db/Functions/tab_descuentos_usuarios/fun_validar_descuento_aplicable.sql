/*
 * FUNCIÓN: fun_validar_descuento_aplicable
 * 
 * DESCRIPCIÓN: Valida si un descuento específico puede ser aplicado a un usuario
 *              considerando todas las restricciones y condiciones configuradas.
 *              Soporta tanto usuarios registrados como usuarios anónimos.
 * 
 * PARÁMETROS:
 *   - p_id_descuento: ID del descuento a validar
 *   - p_id_usuario: ID del usuario que intenta usar el descuento (NULL para usuarios anónimos)
 *   - p_codigo_ingresado: Código de cupón ingresado (opcional)
 *   - p_usr_insert: Usuario que realiza la validación (auditoría, opcional)
 * 
 * RETORNA: BOOLEAN 
 *   - TRUE: El descuento es aplicable
 *   - FALSE: El descuento NO es aplicable por alguna restricción
 * 
 * VALIDACIONES REALIZADAS:
 *   1. Existencia del descuento
 *   2. Estado activo
 *   3. Vigencia de fechas
 *   4. Código de cupón (si es requerido)
 *   5. Límites de uso total
 *   6. Límites de uso por usuario (solo usuarios registrados)
 *   7. Restricciones de días de la semana
 *   8. Restricciones de horarios
 *   9. Validación de primera compra (solo usuarios registrados)
 *   10. Validación de cumpleaños (solo usuarios registrados)
 * 
 * NOTA: Para usuarios anónimos (p_id_usuario = NULL), se omiten validaciones
 *       que requieren historial de usuario como primera compra, cumpleaños,
 *       y límites de uso por usuario.
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_validar_descuento_aplicable(
    p_id_descuento tab_descuentos.id_descuento%TYPE,
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_codigo_ingresado tab_descuentos.codigo_descuento%TYPE,
    p_usr_insert tab_descuentos_usuarios.usr_insert%TYPE 
) RETURNS BOOLEAN AS $$
DECLARE
    -- Variables para el proceso de validación
    v_descuento RECORD;                     -- Información completa del descuento
    v_usos_usuario INT;                     -- Contador de usos del usuario
    v_dia_actual VARCHAR(1);                -- Día actual de la semana (L,M,X,J,V,S,D)
    v_hora_actual TIME;                     -- Hora actual del sistema
    v_es_primera_compra BOOLEAN;            -- Indicador si es primera compra del usuario
BEGIN
    -- PASO 1: Obtener información relevante del descuento (evitar SELECT *)
    SELECT 
        id_descuento,
        ind_activo,
        fec_inicio,
        fec_fin,
        requiere_codigo,
        codigo_descuento,
        id_usuario_destino,
        max_usos_total,
        usos_actuales_total,
        max_usos_por_usuario,
        dias_semana_aplica,
        horas_inicio,
        horas_fin,
        solo_primera_compra,
        ind_es_para_cumpleanos
    INTO v_descuento
    FROM tab_descuentos 
    WHERE id_descuento = p_id_descuento;

    -- VALIDACIÓN 1: Verificar existencia del descuento
    IF v_descuento IS NULL THEN
        RETURN FALSE;
    END IF;

    -- VALIDACIÓN 2: Verificar que el descuento esté activo
    IF NOT v_descuento.ind_activo THEN
        RETURN FALSE;
    END IF;

    -- VALIDACIÓN 3: Verificar vigencia de fechas (inicio y fin)
    IF CURRENT_DATE NOT BETWEEN v_descuento.fec_inicio AND v_descuento.fec_fin THEN
        RETURN FALSE;
    END IF;

    -- VALIDACIÓN 4: Verificar código de cupón si es requerido (comparación sin distinguir mayúsculas)
    IF v_descuento.requiere_codigo AND (
        p_codigo_ingresado IS NULL OR TRIM(COALESCE(p_codigo_ingresado, '')) = ''
        OR UPPER(TRIM(p_codigo_ingresado)) != UPPER(TRIM(COALESCE(v_descuento.codigo_descuento, '')))
    ) THEN
        RETURN FALSE;
    END IF;

    -- VALIDACIÓN 4b: Si el cupón es personal (id_usuario_destino), solo ese usuario puede usarlo
    IF v_descuento.id_usuario_destino IS NOT NULL THEN
        IF p_id_usuario IS NULL THEN
            RETURN FALSE;  /* Usuario anónimo no puede usar cupón personal */
        END IF;
        IF p_id_usuario IS DISTINCT FROM v_descuento.id_usuario_destino THEN
            RETURN FALSE;  /* Otro usuario no puede usar este cupón */
        END IF;
    END IF;

    -- VALIDACIÓN 5: Verificar límite de usos totales del descuento
    IF v_descuento.max_usos_total IS NOT NULL AND v_descuento.usos_actuales_total >= v_descuento.max_usos_total THEN
        RETURN FALSE;
    END IF;

    -- VALIDACIÓN 6: Verificar límite de usos por usuario específico
    -- Solo aplica para usuarios registrados
    IF v_descuento.max_usos_por_usuario IS NOT NULL AND p_id_usuario IS NOT NULL THEN
        -- Consultar cuántas veces ha usado este descuento el usuario
        SELECT COALESCE(veces_usado, 0) INTO v_usos_usuario 
        FROM tab_descuentos_usuarios 
        WHERE id_descuento = p_id_descuento AND id_usuario = p_id_usuario;

        -- Verificar si ya alcanzó el límite personal
        IF COALESCE(v_usos_usuario, 0) >= v_descuento.max_usos_por_usuario THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- VALIDACIÓN 7: Verificar restricciones de días de la semana
    IF v_descuento.dias_semana_aplica IS NOT NULL THEN
        -- Convertir día actual a formato de letra (L,M,X,J,V,S,D)
        v_dia_actual := CASE EXTRACT('DOW' FROM CURRENT_DATE)
            WHEN 1 THEN 'L' WHEN 2 THEN 'M' WHEN 3 THEN 'X' 
            WHEN 4 THEN 'J' WHEN 5 THEN 'V' WHEN 6 THEN 'S' WHEN 0 THEN 'D'
        END;

        -- Verificar si el día actual está en la lista de días permitidos
        IF POSITION(v_dia_actual IN v_descuento.dias_semana_aplica) = 0 THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- VALIDACIÓN 8: Verificar restricciones de horarios
    IF v_descuento.horas_inicio IS NOT NULL AND v_descuento.horas_fin IS NOT NULL THEN
        v_hora_actual := CURRENT_TIME;
        -- Verificar si la hora actual está dentro del rango permitido
        IF v_hora_actual NOT BETWEEN v_descuento.horas_inicio AND v_descuento.horas_fin THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- VALIDACIÓN 9: Verificar si es descuento exclusivo para primera compra
    -- Solo aplica para usuarios registrados
    IF v_descuento.solo_primera_compra THEN
        -- Usuarios anónimos no pueden tener "primera compra" (no tienen historial)
        IF p_id_usuario IS NULL THEN
            RETURN FALSE;
        END IF;
        
        -- Verificar si el usuario no tiene órdenes previas
        SELECT NOT EXISTS (
            SELECT 1 FROM tab_ordenes WHERE id_usuario = p_id_usuario
        ) INTO v_es_primera_compra;
        
        -- Si no es primera compra, el descuento no aplica
        IF NOT v_es_primera_compra THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- VALIDACIÓN 10: Verificar si es descuento especial de cumpleaños
    -- Solo aplica para usuarios registrados
    IF v_descuento.ind_es_para_cumpleanos THEN
        -- Usuarios anónimos no tienen fecha de nacimiento
        IF p_id_usuario IS NULL THEN
            RETURN FALSE;
        END IF;
        
        -- Verificar si hoy es el cumpleaños del usuario
        IF NOT EXISTS (
            SELECT 1 FROM tab_usuarios 
            WHERE id_usuario = p_id_usuario 
            AND fec_nacimiento IS NOT NULL
            AND EXTRACT('MONTH' FROM fec_nacimiento) = EXTRACT('MONTH' FROM CURRENT_DATE)
            AND EXTRACT('DAY' FROM fec_nacimiento) = EXTRACT('DAY' FROM CURRENT_DATE)
        ) THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- RESULTADO: Si llegó hasta aquí, el descuento es válido y aplicable
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql; 