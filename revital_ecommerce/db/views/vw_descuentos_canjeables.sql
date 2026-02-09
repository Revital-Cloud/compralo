/*
 * VISTA: vw_descuentos_canjeables
 * 
 * DESCRIPCIÓN: Vista que muestra todos los descuentos que pueden ser canjeados
 *              por puntos, con información formateada y estado de vigencia.
 * 
 * CAMPOS RETORNADOS:
 *   - id_descuento: ID del descuento
 *   - nom_descuento: Nombre del descuento
 *   - des_descuento: Descripción del descuento
 *   - costo_puntos_canje: Puntos requeridos para canjear
 *   - valor_descuento: Valor formateado (% o $)
 *   - aplica_a: Tipo de aplicación del descuento
 *   - fec_inicio: Fecha de inicio de vigencia
 *   - fec_fin: Fecha de fin de vigencia
 *   - ind_activo: Indicador si está activo
 *   - estado_vigencia: Estado calculado (Vigente/Programado/Vencido)
 * 
 * FILTROS: Solo descuentos canjeables por puntos (ind_canjeable_puntos = TRUE)
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE VIEW vw_descuentos_canjeables AS
SELECT 
    d.id_descuento,                                                    -- ID del descuento
    d.nom_descuento,                                                   -- Nombre del descuento
    d.des_descuento,                                                   -- Descripción del descuento
    d.costo_puntos_canje,                                              -- Puntos requeridos para canje
    CASE                                                               -- Valor formateado del descuento
        WHEN d.tipo_calculo THEN CONCAT(d.val_porce_descuento::TEXT, '%')      -- Porcentual
        ELSE CONCAT('$', d.val_monto_descuento::TEXT)                           -- Monto fijo
    END AS valor_descuento,
    d.aplica_a,                                                        -- Tipo de aplicación
    d.fec_inicio,                                                      -- Fecha inicio vigencia
    d.fec_fin,                                                         -- Fecha fin vigencia
    d.ind_activo,                                                      -- Indicador activo
    CASE                                                               -- Estado calculado de vigencia
        WHEN d.fec_inicio IS NULL AND d.fec_fin IS NULL THEN 'Vigente'  -- Sin fechas = siempre vigente para canje
        WHEN CURRENT_DATE BETWEEN d.fec_inicio AND d.fec_fin THEN 'Vigente'    -- En período válido
        WHEN d.fec_inicio IS NOT NULL AND CURRENT_DATE < d.fec_inicio THEN 'Programado'  -- Aún no inicia
        ELSE 'Vencido'                                                          -- Ya venció
    END AS estado_vigencia
FROM tab_descuentos d
WHERE d.ind_canjeable_puntos = TRUE;                                   -- Solo descuentos canjeables por puntos