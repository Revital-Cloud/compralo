/*
 * TRIGGER FUNCTION: trg_acumular_puntos_orden
 * 
 * DESCRIPCIÓN: Función trigger que acumula puntos automáticamente cuando una orden
 *              cambia su estado a PAGADA (estado 2). La acumulación se hace cuando
 *              el usuario efectivamente paga, no cuando se entrega.
 * 
 * PARÁMETROS: Ninguno (usa NEW y OLD del trigger automáticamente)
 * 
 * RETORNA: TRIGGER - Registro NEW para continuar con la operación
 * 
 * LÓGICA:
 *   1. Verificar si la orden cambió a estado PAGADA (2)
 *   2. Validar que el estado anterior no era PAGADA
 *   3. Ejecutar acumulación de puntos automáticamente
 *   4. Retornar registro para continuar operación
 * 
 * DISPARADO POR: UPDATE en tabla tab_ordenes
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION trg_acumular_puntos_orden()
RETURNS TRIGGER AS $$
BEGIN
    -- En UPDATE, solo acumular si antes no estaba pagada (evitar doble acumulación)
    IF TG_OP = 'UPDATE' AND OLD.ind_estado = 2 THEN
        RETURN NEW;
    END IF;
    -- INSERT con ind_estado=2 o UPDATE de no-pagada a pagada: acumular puntos
    PERFORM fun_acumular_puntos_compra(
        NEW.id_usuario,                                            -- Usuario de la orden
        NEW.id_orden,                                               -- ID de la orden
        NEW.val_total_productos,                                    -- Valor ANTES de descuentos (para incentivar compras)
        COALESCE(NEW.usr_update, NEW.usr_insert)                    -- Usuario que actualiza/inserta
    );
    
    -- LOG: Registrar acumulación de puntos
    RAISE NOTICE 'Puntos acumulados automáticamente para usuario % en orden %', 
        NEW.id_usuario, NEW.id_orden;
    
    -- RETORNO: Continuar con la operación normal
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;