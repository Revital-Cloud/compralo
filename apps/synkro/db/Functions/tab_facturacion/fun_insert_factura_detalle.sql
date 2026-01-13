/*
 * FUNCIÓN: fun_insert_factura_detalle
 * 
 * DESCRIPCIÓN: Inserta una nueva línea de detalle en una factura
 * 
 * PARÁMETROS:
 *   - p_id_factura: ID de la factura (obligatorio)
 *   - p_num_linea: Número de línea (obligatorio, o NULL para auto-generar)
 *   - p_concepto: Descripción del concepto (obligatorio)
 *   - p_cantidad: Cantidad (default: 1)
 *   - p_precio_unitario: Precio por unidad (obligatorio)
 *   - p_descuento_linea: Descuento aplicado a esta línea (default: 0)
 *   - p_impuesto_linea: Impuestos de esta línea (default: 0)
 *   - p_id_plan: ID del plan asociado (opcional)
 *   - p_id_instancia: ID de la instancia asociada (opcional)
 *   - p_metadata_json: Información adicional en JSON (opcional)
 *   - p_usr_insert: Usuario que crea el registro (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación e id_detalle
 * 
 * NOTA: Los totales (subtotal_linea, total_linea) se calculan automáticamente.
 *       Los totales de la cabecera se actualizan automáticamente mediante trigger.
 * 
 * AUTOR: Sistema DB_Synkro SaaS
 * FECHA: Diciembre 2025
 */
CREATE OR REPLACE FUNCTION fun_insert_factura_detalle(
    p_id_factura tab_facturacion_detalle.id_factura%TYPE,
    p_concepto tab_facturacion_detalle.concepto%TYPE,
    p_precio_unitario tab_facturacion_detalle.precio_unitario%TYPE,
    p_usr_insert tab_facturacion_detalle.usr_insert%TYPE,
    p_num_linea tab_facturacion_detalle.num_linea%TYPE DEFAULT NULL,
    p_cantidad tab_facturacion_detalle.cantidad%TYPE DEFAULT 1,
    p_descuento_linea tab_facturacion_detalle.descuento_linea%TYPE DEFAULT 0,
    p_impuesto_linea tab_facturacion_detalle.impuesto_linea%TYPE DEFAULT 0,
    p_id_plan tab_facturacion_detalle.id_plan%TYPE DEFAULT NULL,
    p_id_instancia tab_facturacion_detalle.id_instancia%TYPE DEFAULT NULL,
    p_metadata_json tab_facturacion_detalle.metadata_json%TYPE DEFAULT NULL
) RETURNS JSON AS
$$
DECLARE
    v_id_detalle DECIMAL(10,0);
    v_num_linea INTEGER;
    v_subtotal_linea DECIMAL(10,2);
    v_total_linea DECIMAL(10,2);
    v_factura_existe INTEGER;
    v_num_linea_existe INTEGER;
    v_max_num_linea INTEGER;
BEGIN
    -- Validación: ID de factura
    IF p_id_factura IS NULL OR p_id_factura <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El ID de la factura es obligatorio'
        );
    END IF;

    -- Validación: Concepto
    IF p_concepto IS NULL OR TRIM(p_concepto) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El concepto es obligatorio'
        );
    END IF;

    -- Validación: Precio unitario
    IF p_precio_unitario IS NULL OR p_precio_unitario <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El precio unitario es obligatorio y debe ser mayor a 0'
        );
    END IF;

    -- Validación: Cantidad
    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La cantidad debe ser mayor a 0'
        );
    END IF;

    -- Validación: Usuario
    IF p_usr_insert IS NULL OR TRIM(p_usr_insert) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario que crea el registro es obligatorio'
        );
    END IF;

    -- Validar que la factura existe
    SELECT COUNT(*) INTO v_factura_existe
    FROM tab_facturacion_cabecera
    WHERE id_factura = p_id_factura;

    IF v_factura_existe = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La factura no existe'
        );
    END IF;

    -- Generar número de línea si no se proporciona
    IF p_num_linea IS NULL THEN
        SELECT COALESCE(MAX(num_linea), 0) + 1 INTO v_max_num_linea
        FROM tab_facturacion_detalle
        WHERE id_factura = p_id_factura;
        
        v_num_linea := v_max_num_linea;
    ELSE
        v_num_linea := p_num_linea;
        
        -- Validar que el número de línea no existe
        SELECT COUNT(*) INTO v_num_linea_existe
        FROM tab_facturacion_detalle
        WHERE id_factura = p_id_factura
        AND num_linea = v_num_linea;
        
        IF v_num_linea_existe > 0 THEN
            RETURN json_build_object(
                'success', false,
                'message', 'Ya existe una línea con este número en la factura'
            );
        END IF;
    END IF;

    -- Calcular subtotal y total de la línea
    v_subtotal_linea := (p_cantidad * p_precio_unitario) - COALESCE(p_descuento_linea, 0);
    v_total_linea := v_subtotal_linea + COALESCE(p_impuesto_linea, 0);

    -- Insertar detalle de factura
    INSERT INTO tab_facturacion_detalle (
        id_factura,
        num_linea,
        concepto,
        cantidad,
        precio_unitario,
        descuento_linea,
        subtotal_linea,
        impuesto_linea,
        total_linea,
        id_plan,
        id_instancia,
        metadata_json,
        usr_insert,
        fec_insert
    ) VALUES (
        p_id_factura,
        v_num_linea,
        p_concepto,
        p_cantidad,
        p_precio_unitario,
        COALESCE(p_descuento_linea, 0),
        v_subtotal_linea,
        COALESCE(p_impuesto_linea, 0),
        v_total_linea,
        p_id_plan,
        p_id_instancia,
        p_metadata_json,
        p_usr_insert,
        CURRENT_TIMESTAMP
    ) RETURNING id_detalle INTO v_id_detalle;

    -- Los totales de la cabecera se actualizarán automáticamente por el trigger

    RETURN json_build_object(
        'success', true,
        'message', 'Línea de detalle insertada correctamente',
        'id_detalle', v_id_detalle,
        'num_linea', v_num_linea,
        'subtotal_linea', v_subtotal_linea,
        'total_linea', v_total_linea
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al insertar la línea de detalle: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql;
