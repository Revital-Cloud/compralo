/*
 * FUNCIÓN: fun_calcular_puntos_por_compra
 * 
 * DESCRIPCIÓN: Calcula la cantidad de puntos que debe recibir un usuario basado
 *              en el valor total de su compra y la configuración activa de puntos.
 * 
 * PARÁMETROS:
 *   - p_valor_compra: Valor total de la compra realizada
 * 
 * RETORNA: INTEGER - Cantidad de puntos ganados (siempre número entero)
 * 
 * LÓGICA:
 *   1. Obtener configuración activa de puntos de la empresa
 *   2. Aplicar fórmula: puntos = FLOOR(valor_compra / pesos_por_punto)
 *   3. Retornar cantidad de puntos (división entera, sin decimales)
 * 
 * EJEMPLO:
 *   - Si pesos_por_punto = 1000 y valor_compra = 2500
 *   - Puntos ganados = FLOOR(2500 / 1000) = 2 puntos
 * 
 * DEPENDENCIAS:
 *   - tab_config_puntos_empresa: Para obtener configuración activa vigente
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_calcular_puntos_por_compra(
    p_valor_compra tab_ordenes.val_total_pedido%TYPE
) RETURNS INT AS $$
DECLARE
    -- Variables para el cálculo
    v_pesos_por_punto DECIMAL(10,2);                   -- Configuración activa de pesos por punto
    puntos_ganados INT;                                 -- Puntos calculados a otorgar
BEGIN
    -- PASO 1: Obtener configuración activa de puntos de la empresa
    -- Buscar la configuración que esté activa y vigente
    SELECT pesos_por_punto INTO v_pesos_por_punto
    FROM tab_config_puntos_empresa
    WHERE ind_activo = TRUE
        AND fec_inicio_vigencia <= CURRENT_DATE
        AND (fec_fin_vigencia IS NULL OR fec_fin_vigencia >= CURRENT_DATE)
    ORDER BY fec_inicio_vigencia DESC
    LIMIT 1;
    
    -- VALIDACIÓN: Verificar que existe una configuración activa
    IF v_pesos_por_punto IS NULL THEN
        RAISE EXCEPTION 'No se encontró configuración activa de puntos para la empresa';
    END IF;
    
    -- PASO 2: Calcular puntos usando división entera (sin decimales)
    -- Fórmula: cantidad_puntos = valor_compra ÷ pesos_por_punto (redondeado hacia abajo)
    puntos_ganados := FLOOR(p_valor_compra / v_pesos_por_punto);
    
    -- PASO 3: Retornar cantidad de puntos ganados
    RETURN puntos_ganados;
END;
$$ LANGUAGE plpgsql; 