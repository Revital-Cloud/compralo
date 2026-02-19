/*
 * VISTA: vw_resumen_puntos_usuario
 * 
 * DESCRIPCIÓN: Vista que proporciona un resumen completo de puntos por usuario cliente,
 *              incluyendo saldos, fechas importantes y canjes disponibles.
 * 
 * CAMPOS RETORNADOS:
 *   - id_usuario: ID del usuario
 *   - nom_usuario: Nombre del usuario
 *   - ape_usuario: Apellido del usuario
 *   - email_usuario: Email del usuario
 *   - puntos_disponibles: Puntos disponibles para usar (0 si no tiene)
 *   - puntos_totales_ganados: Total histórico de puntos ganados (0 si no tiene)
 *   - puntos_totales_canjeados: Total histórico de puntos canjeados (0 si no tiene)
 *   - fec_ultima_acumulacion: Fecha de última acumulación de puntos
 *   - fec_ultimo_canje: Fecha de último canje realizado
 *   - canjes_disponibles: Cantidad de canjes no utilizados y vigentes
 * 
 * FILTROS: Solo usuarios con rol de cliente (id_rol = 2)
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE VIEW vw_resumen_puntos_usuario AS
SELECT 
    u.id_usuario,                                                      -- ID del usuario
    u.nom_usuario,                                                     -- Nombre del usuario
    u.ape_usuario,                                                     -- Apellido del usuario
    u.email_usuario,                                                   -- Email del usuario
    COALESCE(pu.puntos_disponibles, 0) as puntos_disponibles,          -- Puntos disponibles (0 por defecto)
    COALESCE(pu.puntos_totales_ganados, 0) as puntos_totales_ganados,  -- Total ganados histórico
    COALESCE(pu.puntos_totales_canjeados, 0) as puntos_totales_canjeados, -- Total canjeados histórico
    (SELECT MAX(mp.fec_insert) FROM tab_movimientos_puntos mp          -- Fecha última acumulación (tipo 1)
     WHERE mp.id_usuario = u.id_usuario AND mp.tipo_movimiento = 1) as fec_ultima_acumulacion,
    pu.fec_ultimo_canje,                                               -- Fecha último canje
    COUNT(cpd.id_canje) as canjes_disponibles                          -- Cantidad canjes disponibles
FROM tab_usuarios u
LEFT JOIN tab_puntos_usuario pu ON u.id_usuario = pu.id_usuario       -- LEFT JOIN para incluir usuarios sin puntos
LEFT JOIN tab_canjes_puntos_descuentos cpd ON (                       -- LEFT JOIN para contar canjes válidos
    u.id_usuario = cpd.id_usuario 
    AND cpd.ind_utilizado = FALSE                                      -- No utilizados
    AND (cpd.fec_expiracion_canje IS NULL OR cpd.fec_expiracion_canje >= CURRENT_DATE) -- No vencidos
)
WHERE u.id_rol = 2                                                    -- FILTRO: Solo clientes
GROUP BY u.id_usuario, u.nom_usuario, u.ape_usuario, u.email_usuario, -- Agrupar por datos del usuario
         pu.puntos_disponibles, pu.puntos_totales_ganados, pu.puntos_totales_canjeados,
         pu.fec_ultimo_canje;
