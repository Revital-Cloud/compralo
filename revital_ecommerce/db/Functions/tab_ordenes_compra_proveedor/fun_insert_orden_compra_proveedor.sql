/*
 * FUNCIÓN: fun_insert_orden_compra_proveedor
 *
 * DESCRIPCIÓN: Inserta un nuevo registro de orden de compra a proveedor.
 *              Genera automáticamente el ID de orden si no se proporciona.
 *              Valida que el producto exista (products) antes de crear la orden.
 *              Modelo actual: product_id + variant_id (opcional).
 *
 * PARÁMETROS:
 *   - p_id_orden_compra: ID de la orden de compra (opcional, se genera si es NULL)
 *   - p_id_proveedor: ID del proveedor
 *   - p_fec_esperada_entrega: Fecha esperada de entrega
 *   - p_observaciones_orden: Observaciones de la orden (opcional)
 *   - p_product_id: ID del producto (products.id)
 *   - p_variant_id: ID de la variante (opcional, product_variants.id)
 *   - p_cantidad_solicitada: Cantidad solicitada
 *   - p_cantidad_recibida: Cantidad recibida (default 0)
 *   - p_costo_unitario: Costo unitario
 *   - p_ind_estado_producto: Estado del producto (1-4)
 *   - p_observaciones_producto: Observaciones del producto (opcional)
 *   - p_usr_operacion: Usuario que realiza la operación
 *
 * RETORNA: JSON con success, message, id_orden_compra, producto_info, etc.
 *
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_insert_orden_compra_proveedor(
    p_id_orden_compra tab_orden_compra_proveedor.id_orden_compra%TYPE,
    p_id_proveedor tab_orden_compra_proveedor.id_proveedor%TYPE,
    p_fec_esperada_entrega tab_orden_compra_proveedor.fec_esperada_entrega%TYPE,
    p_observaciones_orden tab_orden_compra_proveedor.observaciones_orden%TYPE,
    p_product_id tab_orden_compra_proveedor.product_id%TYPE,
    p_variant_id tab_orden_compra_proveedor.variant_id%TYPE,
    p_cantidad_solicitada tab_orden_compra_proveedor.cantidad_solicitada%TYPE,
    p_cantidad_recibida tab_orden_compra_proveedor.cantidad_recibida%TYPE,
    p_costo_unitario tab_orden_compra_proveedor.costo_unitario%TYPE,
    p_ind_estado_producto tab_orden_compra_proveedor.ind_estado_producto%TYPE,
    p_observaciones_producto tab_orden_compra_proveedor.observaciones_producto%TYPE,
    p_usr_operacion tab_orden_compra_proveedor.usr_insert%TYPE
) RETURNS JSON AS $$
DECLARE
    v_id_orden_compra tab_orden_compra_proveedor.id_orden_compra%TYPE;
    v_proveedor_existe BOOLEAN := FALSE;
    v_producto_existe BOOLEAN := FALSE;
    v_variant_valida BOOLEAN := TRUE;
    v_producto_nombre tab_products.name%TYPE;
    v_inicio_proceso TIMESTAMP := NOW();
BEGIN
    -- GENERACIÓN AUTOMÁTICA DE ID_ORDEN_COMPRA si no se proporciona
    IF p_id_orden_compra IS NULL THEN
        SELECT COALESCE(MAX(id_orden_compra), 0) + 1
        FROM tab_orden_compra_proveedor
        INTO v_id_orden_compra;
    ELSE
        v_id_orden_compra := p_id_orden_compra;
    END IF;

    -- VALIDACIÓN 1: Parámetros obligatorios
    IF v_id_orden_compra <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al generar ID de orden de compra',
            'campo_error', 'id_orden_compra'
        );
    END IF;

    IF p_id_proveedor IS NULL OR p_id_proveedor <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El ID del proveedor es obligatorio y debe ser mayor a 0',
            'campo_error', 'id_proveedor'
        );
    END IF;

    IF p_fec_esperada_entrega IS NULL OR p_fec_esperada_entrega <= CURRENT_DATE THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La fecha esperada de entrega debe ser posterior a la fecha actual',
            'campo_error', 'fec_esperada_entrega'
        );
    END IF;

    IF p_product_id IS NULL OR p_product_id <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El ID del producto es obligatorio y debe ser mayor a 0',
            'campo_error', 'product_id'
        );
    END IF;

    IF p_cantidad_solicitada IS NULL OR p_cantidad_solicitada <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La cantidad solicitada es obligatoria y debe ser mayor a 0',
            'campo_error', 'cantidad_solicitada'
        );
    END IF;

    IF p_costo_unitario IS NULL OR p_costo_unitario <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El costo unitario es obligatorio y debe ser mayor a 0',
            'campo_error', 'costo_unitario'
        );
    END IF;

    IF p_usr_operacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario que realiza la operación es obligatorio para auditoría',
            'campo_error', 'usr_operacion'
        );
    END IF;

    -- VALIDACIÓN 2: Verificar que el proveedor existe
    SELECT EXISTS(
        SELECT 1 FROM tab_proveedores
        WHERE id_proveedor = p_id_proveedor
          AND ind_activo = TRUE
    ) INTO v_proveedor_existe;

    IF NOT v_proveedor_existe THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El proveedor especificado no existe o está inactivo',
            'campo_error', 'id_proveedor',
            'id_proveedor', p_id_proveedor
        );
    END IF;

    -- VALIDACIÓN 3: Verificar que el producto existe (tabla tab_products)
    SELECT EXISTS(
        SELECT 1 FROM tab_products p
        WHERE p.id = p_product_id
          AND p.is_active = TRUE
    ) INTO v_producto_existe;

    IF v_producto_existe THEN
        SELECT p.name FROM tab_products p WHERE p.id = p_product_id INTO v_producto_nombre;
    END IF;

    -- Si se indicó variante, validar que exista y pertenezca al producto
    IF p_variant_id IS NOT NULL AND p_variant_id > 0 THEN
        SELECT EXISTS(
            SELECT 1 FROM tab_product_variant_combinations c
            JOIN tab_product_variant_groups g ON g.id = c.group_id
            WHERE c.id = p_variant_id
              AND g.product_id = p_product_id
              AND c.is_active = TRUE
        ) INTO v_variant_valida;
        IF NOT v_variant_valida THEN
            RETURN json_build_object(
                'success', false,
                'message', 'La variante no existe, no pertenece al producto o está inactiva',
                'campo_error', 'variant_id',
                'product_id', p_product_id,
                'variant_id', p_variant_id
            );
        END IF;
    END IF;

    -- SI EL PRODUCTO NO EXISTE: Retornar instrucciones
    IF NOT v_producto_existe THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El producto especificado no existe. Debe crearlo primero.',
            'producto_existe', false,
            'accion_requerida', 'CREAR_PRODUCTO_PRIMERO',
            'producto_solicitado', json_build_object('product_id', p_product_id),
            'instrucciones', 'Cree el producto en la tabla tab_products antes de generar la orden de compra'
        );
    END IF;

    -- VALIDACIÓN 4: Verificar que no exista duplicado (PK id_orden_compra)
    IF EXISTS(
        SELECT 1 FROM tab_orden_compra_proveedor
        WHERE id_orden_compra = v_id_orden_compra
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Ya existe una orden de compra con el ID especificado',
            'campo_error', 'orden_duplicada',
            'id_orden_compra', v_id_orden_compra
        );
    END IF;

    -- INSERCIÓN: Crear orden de compra a proveedor (schema: product_id, variant_id)
    INSERT INTO tab_orden_compra_proveedor (
        id_orden_compra,
        id_proveedor,
        fec_esperada_entrega,
        observaciones_orden,
        product_id,
        variant_id,
        cantidad_solicitada,
        cantidad_recibida,
        costo_unitario,
        ind_estado_producto,
        observaciones_producto,
        usr_insert
    ) VALUES (
        v_id_orden_compra,
        p_id_proveedor,
        p_fec_esperada_entrega,
        p_observaciones_orden,
        p_product_id,
        p_variant_id,
        p_cantidad_solicitada,
        COALESCE(p_cantidad_recibida, 0),
        p_costo_unitario,
        COALESCE(p_ind_estado_producto, 1),
        p_observaciones_producto,
        p_usr_operacion
    );

    -- RESULTADO EXITOSO
    RETURN json_build_object(
        'success', true,
        'message', 'Orden de compra a proveedor creada exitosamente',
        'id_orden_compra', v_id_orden_compra,
        'id_orden_compra_generado', CASE WHEN p_id_orden_compra IS NULL THEN true ELSE false END,
        'producto_existe', true,
        'producto_info', json_build_object(
            'product_id', p_product_id,
            'variant_id', p_variant_id,
            'nombre', v_producto_nombre,
            'cantidad_solicitada', p_cantidad_solicitada,
            'costo_unitario', p_costo_unitario,
            'subtotal', p_cantidad_solicitada * p_costo_unitario
        ),
        'tiempo_procesamiento', (NOW() - v_inicio_proceso),
        'timestamp', NOW()
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error inesperado al crear orden de compra: ' || SQLERRM,
            'sql_state', SQLSTATE,
            'tiempo_procesamiento', (NOW() - v_inicio_proceso)
        );
END;
$$ LANGUAGE plpgsql;
