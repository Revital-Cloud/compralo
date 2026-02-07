/*
 * FUNCIÓN: fun_obtener_historial_puntos
 * 
 * DESCRIPCIÓN: Obtiene el historial completo de movimientos de puntos de un usuario
 *              incluyendo acumulaciones, canjes y detalles de descuentos aplicados.
 *              Retorna un objeto JSON con el resultado.
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario (obligatorio)
 * 
 * RETORNA: JSON - Objeto con el historial de puntos:
 *   - success: boolean
 *   - id_usuario: ID del usuario consultado
 *   - historial: array de objetos, cada uno con:
 *     - id_movimiento_puntos: ID único del movimiento
 *     - tipo_movimiento_codigo: Código numérico del tipo (1=Acumulación, 2=Canje, 3=Expiración)
 *     - tipo_movimiento_descripcion: Descripción legible del tipo de movimiento
 *     - cantidad_puntos: Cantidad de puntos del movimiento (+ acumulación, - canje/expiración)
 *     - puntos_disponibles_anterior: Saldo anterior al movimiento
 *     - puntos_disponibles_actual: Saldo después del movimiento
 *     - descripcion: Descripción detallada del movimiento
 *     - fec_movimiento: Fecha y hora del movimiento
 *     - id_orden_origen: ID de orden que generó puntos (si aplica)
 *     - id_descuento_canjeado: ID del descuento canjeado (si aplica)
 *     - nombre_descuento: Nombre del descuento canjeado (si aplica)
 * 
 * LÓGICA:
 *   1. Consultar movimientos de puntos del usuario específico
 *   2. Construir un array JSON con los resultados
 *   3. Envolver el array en un objeto JSON de respuesta
 * 
 * CASOS DE USO:
 *   - Mostrar historial de puntos en perfil de usuario
 *   - Auditoría de movimientos de puntos
 *   - Reportes de actividad del sistema de lealtad
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */

-- Función para obtener historial de movimientos de puntos
CREATE OR REPLACE FUNCTION fun_obtener_historial_puntos(
    p_id_usuario tab_usuarios.id_usuario%TYPE
) RETURNS JSON AS $$
DECLARE
    v_historial_json JSON;
BEGIN
    -- Construir el array JSON de movimientos
    SELECT json_agg(
        json_build_object(
            'id_movimiento_puntos', mp.id_movimiento_puntos,
            'tipo_movimiento_codigo', mp.tipo_movimiento,
            'tipo_movimiento_descripcion', CASE mp.tipo_movimiento
                WHEN 1 THEN 'Acumulación'
                WHEN 2 THEN 'Canje'
                WHEN 3 THEN 'Expiración'
                ELSE 'Tipo Desconocido'
            END,
            'cantidad_puntos', mp.cantidad_puntos,
            'puntos_disponibles_anterior', mp.puntos_disponibles_anterior,
            'puntos_disponibles_actual', mp.puntos_disponibles_actual,
            'descripcion', mp.descripcion,
            'fec_movimiento', mp.fec_insert,
            'id_orden_origen', mp.id_orden_origen,
            'id_descuento_canjeado', mp.id_descuento_canjeado,
            'nombre_descuento', d.nom_descuento
        ) ORDER BY mp.fec_insert DESC, mp.id_movimiento_puntos DESC
    )
    INTO v_historial_json
    FROM tab_movimientos_puntos mp
    LEFT JOIN tab_descuentos d ON mp.id_descuento_canjeado = d.id_descuento
    WHERE mp.id_usuario = p_id_usuario;

    -- Envolver el array en un objeto de respuesta
    RETURN json_build_object(
        'success', true,
        'id_usuario', p_id_usuario,
        'historial', COALESCE(v_historial_json, '[]'::JSON)
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al obtener el historial de puntos: ' || SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql; 