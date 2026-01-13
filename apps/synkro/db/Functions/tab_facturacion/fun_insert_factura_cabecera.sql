/*
 * FUNCIÓN: fun_insert_factura_cabecera
 * 
 * DESCRIPCIÓN: Inserta una nueva cabecera de factura en el sistema
 * 
 * PARÁMETROS:
 *   - p_id_suscripcion: ID de la suscripción asociada (obligatorio)
 *   - p_identificacion_fiscal_cliente: Identificación fiscal del cliente (obligatorio)
 *   - p_num_factura: Número de factura único (obligatorio, o NULL para generar automáticamente)
 *   - p_moneda: Moneda de la factura (default: 'USD')
 *   - p_estado_pago: Estado del pago (default: 'pendiente')
 *   - p_metodo_pago: Método de pago (opcional)
 *   - p_fecha_emision: Fecha de emisión (default: CURRENT_TIMESTAMP)
 *   - p_fecha_vencimiento: Fecha de vencimiento (opcional)
 *   - p_periodo_facturado_desde: Inicio del período facturado (opcional)
 *   - p_periodo_facturado_hasta: Fin del período facturado (opcional)
 *   - p_referencia_pago: Referencia de pago externa (opcional)
 *   - p_notas: Notas adicionales (opcional)
 *   - p_usr_insert: Usuario que crea el registro (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación e id_factura
 * 
 * NOTA: Los totales (subtotal, impuestos, descuentos, total) se calculan
 *       automáticamente desde el detalle mediante triggers
 * 
 * AUTOR: Sistema DB_Synkro SaaS
 * FECHA: Diciembre 2025
 */
CREATE OR REPLACE FUNCTION fun_insert_factura_cabecera(
    p_id_suscripcion tab_facturacion_cabecera.id_suscripcion%TYPE,
    p_identificacion_fiscal_cliente tab_facturacion_cabecera.identificacion_fiscal_cliente%TYPE,
    p_usr_insert tab_facturacion_cabecera.usr_insert%TYPE,
    p_num_factura tab_facturacion_cabecera.num_factura%TYPE DEFAULT NULL,
    p_moneda tab_facturacion_cabecera.moneda%TYPE DEFAULT 'USD',
    p_estado_pago tab_facturacion_cabecera.estado_pago%TYPE DEFAULT 'pendiente',
    p_metodo_pago tab_facturacion_cabecera.metodo_pago%TYPE DEFAULT NULL,
    p_fecha_emision tab_facturacion_cabecera.fecha_emision%TYPE DEFAULT CURRENT_TIMESTAMP,
    p_fecha_vencimiento tab_facturacion_cabecera.fecha_vencimiento%TYPE DEFAULT NULL,
    p_periodo_facturado_desde tab_facturacion_cabecera.periodo_facturado_desde%TYPE DEFAULT NULL,
    p_periodo_facturado_hasta tab_facturacion_cabecera.periodo_facturado_hasta%TYPE DEFAULT NULL,
    p_referencia_pago tab_facturacion_cabecera.referencia_pago%TYPE DEFAULT NULL,
    p_notas tab_facturacion_cabecera.notas%TYPE DEFAULT NULL
) RETURNS JSON AS
$$
DECLARE
    v_id_factura DECIMAL(10,0);
    v_num_factura VARCHAR;
    v_num_factura_existe INTEGER;
    v_suscripcion_existe INTEGER;
    v_cliente_existe INTEGER;
BEGIN
    -- Validación: ID de suscripción
    IF p_id_suscripcion IS NULL OR p_id_suscripcion <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El ID de la suscripción es obligatorio'
        );
    END IF;

    -- Validación: Identificación fiscal del cliente
    IF p_identificacion_fiscal_cliente IS NULL OR TRIM(p_identificacion_fiscal_cliente) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La identificación fiscal del cliente es obligatoria'
        );
    END IF;

    -- Validación: Usuario
    IF p_usr_insert IS NULL OR TRIM(p_usr_insert) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario que crea el registro es obligatorio'
        );
    END IF;

    -- Validar que la suscripción existe
    SELECT COUNT(*) INTO v_suscripcion_existe
    FROM tab_suscripciones
    WHERE id_suscripcion = p_id_suscripcion;

    IF v_suscripcion_existe = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La suscripción no existe'
        );
    END IF;

    -- Validar que el cliente existe
    SELECT COUNT(*) INTO v_cliente_existe
    FROM tab_clientes
    WHERE identificacion_fiscal = p_identificacion_fiscal_cliente;

    IF v_cliente_existe = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El cliente no existe'
        );
    END IF;

    -- Generar número de factura si no se proporciona
    IF p_num_factura IS NULL OR TRIM(p_num_factura) = '' THEN
        v_num_factura := fn_generar_num_factura();
    ELSE
        v_num_factura := p_num_factura;
        
        -- Validar unicidad de número de factura
        SELECT COUNT(*) INTO v_num_factura_existe
        FROM tab_facturacion_cabecera
        WHERE num_factura = v_num_factura;
        
        IF v_num_factura_existe > 0 THEN
            RETURN json_build_object(
                'success', false,
                'message', 'Ya existe una factura con este número'
            );
        END IF;
    END IF;

    -- Insertar cabecera de factura
    INSERT INTO tab_facturacion_cabecera (
        id_suscripcion,
        identificacion_fiscal_cliente,
        num_factura,
        subtotal,
        impuestos,
        descuentos,
        total,
        moneda,
        estado_pago,
        metodo_pago,
        fecha_emision,
        fecha_vencimiento,
        periodo_facturado_desde,
        periodo_facturado_hasta,
        referencia_pago,
        notas,
        usr_insert,
        fec_insert
    ) VALUES (
        p_id_suscripcion,
        p_identificacion_fiscal_cliente,
        v_num_factura,
        0, -- Se calculará desde el detalle
        0,
        0,
        0,
        p_moneda,
        p_estado_pago,
        p_metodo_pago,
        p_fecha_emision,
        p_fecha_vencimiento,
        p_periodo_facturado_desde,
        p_periodo_facturado_hasta,
        p_referencia_pago,
        p_notas,
        p_usr_insert,
        CURRENT_TIMESTAMP
    ) RETURNING id_factura INTO v_id_factura;

    RETURN json_build_object(
        'success', true,
        'message', 'Cabecera de factura insertada correctamente',
        'id_factura', v_id_factura,
        'num_factura', v_num_factura
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al insertar la cabecera de factura: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql;
