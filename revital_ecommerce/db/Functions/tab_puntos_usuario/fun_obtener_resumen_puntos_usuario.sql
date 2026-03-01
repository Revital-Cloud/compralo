/*
 * FUNCIÓN: fun_obtener_resumen_puntos_usuario
 * 
 * DESCRIPCIÓN: Obtiene un resumen completo del estado de puntos de un usuario específico,
 *              incluyendo saldos, configuración y canjes disponibles.
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario (obligatorio)
 * 
 * RETORNA: JSON - Objeto completo con:
 *   - usuario: Información básica (id, nombre completo)
 *   - puntos: Saldos (disponibles, ganados, canjeados, valor en pesos)
 *   - fechas: Última acumulación y último canje
 *   - canjes_disponibles: Cantidad de canjes no utilizados
 *   - configuracion: Configuración actual del sistema (pesos por punto)
 * 
 * LÓGICA:
 *   1. Obtener información de puntos del usuario
 *   2. Crear registro básico si no existe
 *   3. Contar canjes disponibles no vencidos
 *   4. Obtener configuración actual de puntos
 *   5. Construir respuesta JSON estructurada
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_obtener_resumen_puntos_usuario(
    p_id_usuario tab_usuarios.id_usuario%TYPE 
) RETURNS JSON AS $$
DECLARE
    v_puntos_usuario RECORD;
    v_canjes_disponibles INT;
    v_config_puntos DECIMAL(10,2);
BEGIN
    -- CONSULTA: Obtener información completa de puntos del usuario
    SELECT 
        pu.id_usuario,
        pu.puntos_disponibles,
        pu.puntos_totales_ganados,
        pu.puntos_totales_canjeados,
        pu.fec_ultimo_canje,
        pu.usr_insert,
        pu.fec_insert,
        pu.usr_update,
        pu.fec_update,
        u.nom_usuario,
        u.ape_usuario
    INTO v_puntos_usuario
    FROM tab_puntos_usuario pu
    JOIN tab_usuarios u ON pu.id_usuario = u.id_usuario                -- JOIN para obtener nombre
    WHERE pu.id_usuario = p_id_usuario;
    
    -- PREPARACIÓN: Crear registro básico si no existe
    IF NOT FOUND THEN
        INSERT INTO tab_puntos_usuario (id_usuario, usr_insert)
        VALUES (p_id_usuario, p_usr_operacion)
        ON CONFLICT (id_usuario) DO NOTHING;                           -- No duplicar si ya existe
        
        -- Re-consultar información después de crear registro
        SELECT 
            pu.id_usuario,
            pu.puntos_disponibles,
            pu.puntos_totales_ganados,
            pu.puntos_totales_canjeados,
            pu.fec_ultimo_canje,
            pu.usr_insert,
            pu.fec_insert,
            pu.usr_update,
            pu.fec_update,
            u.nom_usuario,
            u.ape_usuario
        INTO v_puntos_usuario
        FROM tab_puntos_usuario pu
        JOIN tab_usuarios u ON pu.id_usuario = u.id_usuario
        WHERE pu.id_usuario = p_id_usuario;
    END IF;
    
    -- CONSULTA: Contar canjes disponibles (no utilizados y no vencidos)
    SELECT COUNT(1) INTO v_canjes_disponibles
    FROM tab_canjes_puntos_descuentos
    WHERE id_usuario = p_id_usuario                                    -- Del usuario específico
      AND ind_utilizado = FALSE                                        -- No utilizados
      AND (fec_expiracion_canje IS NULL OR fec_expiracion_canje >= CURRENT_DATE); -- No vencidos
    
    -- CONSULTA: Obtener configuración actual de puntos
    SELECT pesos_por_punto INTO v_config_puntos
    FROM tab_config_puntos_empresa
    WHERE ind_activo = TRUE
        AND fec_inicio_vigencia <= CURRENT_DATE
        AND (fec_fin_vigencia IS NULL OR fec_fin_vigencia >= CURRENT_DATE)
    ORDER BY fec_inicio_vigencia DESC
    LIMIT 1;
    
    -- VALIDACIÓN: Verificar que existe una configuración activa
    IF v_config_puntos IS NULL THEN
        v_config_puntos := 1000; -- Valor por defecto si no hay configuración
    END IF;
    
    -- CONSTRUCCIÓN: Crear respuesta JSON estructurada
    RETURN json_build_object(
        'usuario', json_build_object(                                  -- Información del usuario
            'id_usuario', v_puntos_usuario.id_usuario,
            'nombre_completo', v_puntos_usuario.nom_usuario || ' ' || v_puntos_usuario.ape_usuario
        ),
        'puntos', json_build_object(                                   -- Información de puntos
            'disponibles', v_puntos_usuario.puntos_disponibles,
            'totales_ganados', v_puntos_usuario.puntos_totales_ganados,
            'totales_canjeados', v_puntos_usuario.puntos_totales_canjeados,
            'valor_estimado_pesos', v_puntos_usuario.puntos_disponibles * v_config_puntos
        ),
        'fechas', json_build_object(                                   -- Fechas importantes
            'ultima_acumulacion', v_puntos_usuario.fec_ultima_acumulacion,
            'ultimo_canje', v_puntos_usuario.fec_ultimo_canje
        ),
        'canjes_disponibles', v_canjes_disponibles,                    -- Canjes no utilizados
        'configuracion', json_build_object(                            -- Configuración del sistema
            'pesos_por_punto', v_config_puntos
        )
    );
END;
$$ LANGUAGE plpgsql; 