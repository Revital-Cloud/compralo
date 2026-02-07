/*
 * FUNCIÓN: fun_registrar_uso_descuento
 * 
 * DESCRIPCIÓN: Registra el uso de un descuento por un usuario específico,
 *              manteniendo contadores individuales y totales.
 * 
 * PARÁMETROS:
 *   - p_id_descuento: ID del descuento utilizado (obligatorio)
 *   - p_id_usuario: ID del usuario que usa el descuento (obligatorio)
 * 
 * RETORNA: BOOLEAN - TRUE si se registró exitosamente, FALSE en caso de error
 * 
 * LÓGICA:
 *   1. Verificar si ya existe registro de uso del usuario
 *   2. Si existe: incrementar contador de usos y actualizar fecha
 *   3. Si no existe: crear nuevo registro de uso
 *   4. Actualizar contador total de usos del descuento
 *   5. Actualizar timestamp de modificación
 * 
 * MANEJO DE ERRORES:
 *   - Captura cualquier excepción SQL
 *   - Retorna FALSE en caso de error
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_registrar_uso_descuento(
    p_id_descuento tab_descuentos.id_descuento%TYPE,
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_usr_operacion tab_descuentos_usuarios.usr_insert%TYPE
) RETURNS BOOLEAN AS $$
DECLARE
    v_existe_registro BOOLEAN := FALSE;
BEGIN
    -- VERIFICACIÓN: Comprobar si ya existe registro del usuario usando este descuento
    SELECT EXISTS(
        SELECT 1 FROM tab_descuentos_usuarios 
        WHERE id_descuento = p_id_descuento AND id_usuario = p_id_usuario
    ) INTO v_existe_registro;
    
    IF v_existe_registro THEN
        -- ACTUALIZACIÓN: Incrementar contador existente
        UPDATE tab_descuentos_usuarios 
        SET veces_usado = veces_usado + 1,                      -- Incrementar contador de usos
            usr_update = p_usr_operacion,                       -- Usuario que actualiza
            fec_update = NOW()                                  -- Fecha de actualización
        WHERE id_descuento = p_id_descuento AND id_usuario = p_id_usuario;
    ELSE
        -- INSERCIÓN: Crear nuevo registro de uso
        INSERT INTO tab_descuentos_usuarios (
            id_descuento,                                       -- ID del descuento
            id_usuario,                                         -- ID del usuario
            veces_usado,                                        -- Iniciar en 1
            usr_insert                                          -- Usuario que crea el registro
        ) VALUES (
            p_id_descuento, 
            p_id_usuario, 
            1, 
            p_usr_operacion
        );
    END IF;
    
    -- ACTUALIZACIÓN: Incrementar contador total de usos del descuento
    UPDATE tab_descuentos 
    SET usos_actuales_total = usos_actuales_total + 1,         -- Incrementar contador total
        usr_update = p_usr_operacion,                           -- Usuario que actualiza
        fec_update = NOW()                                      -- Actualizar timestamp
    WHERE id_descuento = p_id_descuento;
    
    RETURN TRUE;
    
-- MANEJO DE ERRORES: Capturar cualquier excepción
EXCEPTION 
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql; 