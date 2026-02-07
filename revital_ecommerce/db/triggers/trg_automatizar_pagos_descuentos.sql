 /*
 * TRIGGERS: Automatización de Pagos y Control de Descuentos
 * 
 * DESCRIPCIÓN: Triggers que automatizan el marcado de órdenes como pagadas
 *              y controlan el uso inteligente de descuentos en tiempo real.
 *              Garantizan integridad y previenen abusos del sistema.
 * 
 * EVENTOS MONITOREADOS:
 *   - Actualización de pagos de MercadoPago (cuando se aprueban)
 *   - Aplicación de descuentos en órdenes
 *   - Creación de órdenes con descuentos
 *   - Cambios en configuración de descuentos
 * 
 * FUNCIONES EJECUTADAS:
 *   - fun_marcar_orden_pagada (marcado automático de pagos)
 *   - fun_incrementar_usos_descuento (control inteligente de descuentos)
 * 
 * CARACTERÍSTICAS:
 *   - Procesamiento en tiempo real
 *   - Validaciones automáticas
 *   - Prevención de fraudes
 *   - Logs detallados de operaciones
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */

-- =====================================================
-- FUNCIÓN: Marcar orden pagada automáticamente
-- =====================================================

/*
 * FUNCIÓN: fun_trigger_marcar_orden_pagada_auto
 * 
 * DESCRIPCIÓN: Función trigger que detecta cuando un pago externo (MercadoPago, etc.)
 *              es aprobado y marca automáticamente la orden como pagada.
 */
CREATE OR REPLACE FUNCTION fun_trigger_marcar_orden_pagada_auto()
RETURNS TRIGGER AS $$
DECLARE
    v_resultado JSON;
    v_orden_record RECORD;
BEGIN
    -- VERIFICAR: Solo procesar cuando el pago cambia a 'approved'
    IF NEW.mp_status = 'approved' AND (OLD.mp_status IS NULL OR OLD.mp_status != 'approved') THEN
        
        -- OBTENER: Información de la orden relacionada
        SELECT id_orden, ind_estado, val_total_pedido 
        INTO v_orden_record
        FROM tab_ordenes 
        WHERE id_orden = NEW.id_orden;
        
            -- VALIDAR: Solo procesar órdenes pendientes o pagadas
    IF v_orden_record.ind_estado IN (1, 2) THEN  -- 1=Pendiente, 2=Pagada
            
            BEGIN
                -- EJECUTAR: Marcar orden como pagada automáticamente
                SELECT fun_marcar_orden_pagada(
                    NEW.id_orden,                                        -- ID de la orden
                    'MERCADOPAGO',                                       -- Método de pago
                    NEW.mp_payment_id::TEXT,                            -- Referencia del pago
                    NEW.mp_transaction_amount,                          -- Monto pagado
                    CONCAT('Pago automático MP - ID: ', NEW.mp_payment_id, 
                        ' - Estado: ', NEW.mp_status),               -- Observaciones
                    COALESCE(NEW.usr_update, NEW.usr_insert)            -- Usuario operación
                ) INTO v_resultado;
                
                -- LOG: Resultado del proceso
                IF (v_resultado->>'success')::BOOLEAN THEN
                    RAISE NOTICE 'Orden % marcada como pagada automáticamente - MP Payment: %', 
                        NEW.id_orden, NEW.mp_payment_id;
                ELSE
                    RAISE WARNING 'Error al marcar orden % como pagada automáticamente: %', 
                        NEW.id_orden, (v_resultado->>'message')::TEXT;
                END IF;
                
            EXCEPTION
                WHEN OTHERS THEN
                    -- Log error pero no fallar la transacción del pago
                    RAISE WARNING 'Excepción al marcar orden % como pagada: % (SQL State: %)', 
                        NEW.id_orden, SQLERRM, SQLSTATE;
            END;
            
        ELSE
            RAISE NOTICE 'Orden % no marcada como pagada - Estado actual: %', 
                NEW.id_orden, v_orden_record.ind_estado;
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

