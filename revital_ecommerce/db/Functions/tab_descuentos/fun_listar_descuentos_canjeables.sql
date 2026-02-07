/*
 * FUNCIÓN: fun_listar_descuentos_canjeables
 * 
 * DESCRIPCIÓN: Lista descuentos que pueden ser canjeados por puntos,
 *              verificando si el usuario tiene suficientes puntos para cada uno.
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario para verificar puntos (opcional)
 *   - p_limit: Máximo número de registros a retornar (default 20)
 *   - p_offset: Número de registros a omitir para paginación (default 0)
 * 
 * RETORNA: TABLE - Tabla con descuentos canjeables:
 *   - Información básica del descuento
 *   - Costo en puntos para canjear
 *   - Indicador si el usuario puede canjearlo
 *   - Puntos disponibles del usuario
 * 
 * LÓGICA:
 *   1. Obtener puntos disponibles del usuario (si se especifica)
 *   2. Filtrar descuentos canjeables (ind_canjeable_puntos), sin exigir ind_activo
 *   3. Vigencia: fechas NULL = siempre vigente para canje; con fechas = CURRENT_DATE entre ellas
 *   4. Calcular si usuario puede canjear cada descuento
 *   5. Ordenar por costo de puntos ascendente
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_listar_descuentos_canjeables(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    id_descuento tab_descuentos.id_descuento%TYPE,
    nom_descuento tab_descuentos.nom_descuento%TYPE,
    des_descuento tab_descuentos.des_descuento%TYPE,
    costo_puntos_canje tab_descuentos.costo_puntos_canje%TYPE,
    tipo_calculo_texto TEXT,
    valor_descuento TEXT,
    aplica_a tab_descuentos.aplica_a%TYPE,
    fec_inicio tab_descuentos.fec_inicio%TYPE,
    fec_fin tab_descuentos.fec_fin%TYPE,
    puede_canjear BOOLEAN,
    puntos_usuario INT
) AS $$
DECLARE
    v_puntos_usuario INT := 0;
BEGIN
    -- PASO 1: Obtener puntos disponibles del usuario (si se especifica)
    IF p_id_usuario IS NOT NULL THEN
        -- Usar COALESCE para manejar casos donde el usuario no existe en tab_puntos_usuario
        SELECT COALESCE(
            (SELECT puntos_disponibles FROM tab_puntos_usuario WHERE id_usuario = p_id_usuario),
            0
        ) INTO v_puntos_usuario;
    END IF;
    
    -- CONSULTA: Obtener descuentos canjeables con validación de puntos
    RETURN QUERY
    SELECT 
        d.id_descuento,                                         -- ID del descuento
        d.nom_descuento,                                        -- Nombre del descuento
        d.des_descuento,                                        -- Descripción del descuento
        d.costo_puntos_canje,                                   -- Puntos requeridos para canje
        CASE 
            WHEN d.tipo_calculo THEN 'Porcentaje'
            ELSE 'Monto Fijo'
        END AS tipo_calculo_texto,                              -- Tipo de cálculo legible
        CASE 
            WHEN d.tipo_calculo THEN 
                CONCAT(d.val_porce_descuento::TEXT, '%')
            ELSE 
                CONCAT('$', d.val_monto_descuento::TEXT)
        END AS valor_descuento,                                 -- Valor del descuento formateado
        d.aplica_a,                                             -- Tipo de aplicación
        d.fec_inicio,                                           -- Fecha de inicio
        d.fec_fin,                                              -- Fecha de fin
        CASE 
            WHEN p_id_usuario IS NULL THEN NULL
            ELSE (v_puntos_usuario >= d.costo_puntos_canje)
        END AS puede_canjear,                                   -- Si el usuario puede canjearlo
        CASE 
            WHEN p_id_usuario IS NULL THEN NULL
            ELSE v_puntos_usuario
        END AS puntos_usuario                                   -- Puntos disponibles del usuario
    FROM tab_descuentos d
    WHERE d.ind_canjeable_puntos = TRUE                         -- Solo descuentos canjeables por puntos
      AND ( (d.fec_inicio IS NULL AND d.fec_fin IS NULL) OR (d.fec_inicio IS NOT NULL AND d.fec_fin IS NOT NULL AND CURRENT_DATE BETWEEN d.fec_inicio AND d.fec_fin) )
    ORDER BY d.costo_puntos_canje ASC, d.fec_insert DESC;       -- Más baratos primero, más recientes después                 -- Paginación
END;
$$ LANGUAGE plpgsql; 