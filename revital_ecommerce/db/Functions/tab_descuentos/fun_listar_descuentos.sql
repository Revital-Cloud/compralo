/*
 * FUNCIÓN: fun_listar_descuentos
 * 
 * DESCRIPCIÓN: Lista descuentos del sistema con filtros avanzados y información
 *              calculada como estado, porcentaje de uso y valor formateado.
 * 
 * PARÁMETROS:
 *   - p_activos_solamente: Filtrar solo activos (TRUE), solo inactivos (FALSE), o todos (NULL)
 *   - p_incluir_vencidos: Incluir descuentos vencidos (default TRUE)
 *   - p_busqueda_texto: Texto para buscar en nombre, descripción o código
 *   - p_tipo_aplicacion: Filtrar por tipo de aplicación específico
 *   - p_limit: Máximo número de registros a retornar (default 50)
 *   - p_offset: Número de registros a omitir para paginación (default 0)
 * 
 * RETORNA: TABLE - Tabla con información detallada de descuentos:
 *   - Información básica del descuento
 *   - Tipo y valor formateado
 *   - Estado calculado (Activo, Programado, Vencido, Agotado, Inactivo)
 *   - Porcentaje de uso vs máximo permitido
 *   - Configuraciones de combinación y restricciones
 * 
 * LÓGICA:
 *   1. Aplicar filtros opcionales de búsqueda
 *   2. Calcular estado dinámico según fechas y usos
 *   3. Formatear valores según tipo de cálculo
 *   4. Ordenar por prioridad de estado y fecha
 *   5. Aplicar paginación
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_listar_descuentos(
    p_activos_solamente BOOLEAN DEFAULT NULL,
    p_incluir_vencidos BOOLEAN DEFAULT TRUE,
    p_busqueda_texto VARCHAR DEFAULT NULL,
    p_tipo_aplicacion VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    id_descuento tab_descuentos.id_descuento%TYPE,
    nom_descuento tab_descuentos.nom_descuento%TYPE,
    des_descuento tab_descuentos.des_descuento%TYPE,
    tipo_calculo_texto VARCHAR,
    valor_mostrar VARCHAR,
    aplica_a tab_descuentos.aplica_a%TYPE,
    fec_inicio tab_descuentos.fec_inicio%TYPE,
    fec_fin tab_descuentos.fec_fin%TYPE,
    ind_activo tab_descuentos.ind_activo%TYPE,
    codigo_descuento tab_descuentos.codigo_descuento%TYPE,
    max_usos_total tab_descuentos.max_usos_total%TYPE,
    usos_actuales_total tab_descuentos.usos_actuales_total%TYPE,
    max_usos_por_usuario tab_descuentos.max_usos_por_usuario%TYPE,
    estado_descuento VARCHAR,
    porcentaje_uso VARCHAR,
    cantidad_minima_producto tab_descuentos.cantidad_minima_producto%TYPE,
    requiere_codigo tab_descuentos.requiere_codigo%TYPE
) AS $$
BEGIN
    -- CONSULTA: Obtener descuentos con información calculada y filtros
    RETURN QUERY
    SELECT 
        d.id_descuento,                                         -- ID del descuento
        d.nom_descuento,                                        -- Nombre del descuento
        d.des_descuento,                                        -- Descripción del descuento
        CASE 
            WHEN d.tipo_calculo THEN 'Porcentaje'
            ELSE 'Monto Fijo'
        END AS tipo_calculo_texto,                              -- Tipo de cálculo legible
        CASE 
            WHEN d.tipo_calculo THEN 
                CONCAT(d.val_porce_descuento::TEXT, '%')
            ELSE 
                CONCAT('$', d.val_monto_descuento::TEXT)
        END AS valor_mostrar,                                   -- Valor formateado para mostrar
        d.aplica_a,                                             -- Tipo de aplicación
        d.fec_inicio,                                           -- Fecha de inicio
        d.fec_fin,                                              -- Fecha de fin
        d.ind_activo,                                           -- Indicador activo
        d.codigo_descuento,                                     -- Código del descuento
        d.max_usos_total,                                       -- Máximo usos total
        d.usos_actuales_total,                                  -- Usos actuales total
        d.max_usos_por_usuario,                                 -- Máximo usos por usuario
        CASE 
            WHEN NOT d.ind_activo THEN 'Inactivo'
            WHEN CURRENT_DATE < d.fec_inicio THEN 'Programado'
            WHEN CURRENT_DATE > d.fec_fin THEN 'Vencido'
            WHEN d.max_usos_total IS NOT NULL AND d.usos_actuales_total >= d.max_usos_total THEN 'Agotado'
            ELSE 'Activo'
        END AS estado_descuento,                                -- Estado calculado dinámicamente
        CASE 
            WHEN d.max_usos_total IS NOT NULL AND d.max_usos_total > 0 THEN
                CONCAT(ROUND((d.usos_actuales_total::DECIMAL / d.max_usos_total::DECIMAL) * 100, 1)::TEXT, '%')
            ELSE 'Ilimitado'
        END AS porcentaje_uso,                                   -- Porcentaje de uso calculado
        d.cantidad_minima_producto,                               -- Cantidad mínima del producto
        d.requiere_codigo                                          -- Requiere código
    FROM tab_descuentos d
    WHERE 
        -- FILTRO 1: Estado activo/inactivo
        (p_activos_solamente IS NULL OR d.ind_activo = p_activos_solamente)
        -- FILTRO 2: Incluir o excluir vencidos
        AND (p_incluir_vencidos = TRUE OR d.fec_fin >= CURRENT_DATE)
        -- FILTRO 3: Búsqueda de texto en nombre, descripción o código
        AND (p_busqueda_texto IS NULL OR 
            LOWER(d.nom_descuento) LIKE LOWER('%' || p_busqueda_texto || '%') OR
            LOWER(d.des_descuento) LIKE LOWER('%' || p_busqueda_texto || '%') OR
            LOWER(d.codigo_descuento) LIKE LOWER('%' || p_busqueda_texto || '%'))
        -- FILTRO 4: Tipo de aplicación específico
        AND (p_tipo_aplicacion IS NULL OR d.aplica_a = p_tipo_aplicacion)
    ORDER BY 
        -- ORDENAMIENTO: Por prioridad de estado (activos primero)
        CASE 
            WHEN d.ind_activo AND CURRENT_DATE BETWEEN d.fec_inicio AND d.fec_fin 
                AND (d.max_usos_total IS NULL OR d.usos_actuales_total < d.max_usos_total) THEN 1  -- Activos válidos
            WHEN d.ind_activo AND CURRENT_DATE < d.fec_inicio THEN 2                              -- Programados
            WHEN NOT d.ind_activo THEN 3                                                          -- Inactivos
            WHEN CURRENT_DATE > d.fec_fin THEN 4                                                  -- Vencidos
            ELSE 5                                                                                 -- Otros
        END,
        d.fec_insert DESC                                       -- Más recientes primero
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql; 