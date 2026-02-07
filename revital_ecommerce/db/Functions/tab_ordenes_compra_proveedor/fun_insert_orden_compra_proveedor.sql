/*
 * FUNCIÓN: fun_insert_orden_compra_proveedor
 * 
 * DESCRIPCIÓN: Inserta un nuevo registro de orden de compra a proveedor en la tabla unificada.
 *              Genera automáticamente el ID de orden si no se proporciona.
 *              Valida que el producto exista antes de crear la orden.
 * 
 * PARÁMETROS:
 *   - p_id_orden_compra: ID de la orden de compra (opcional, se genera automáticamente si es NULL)
 *   - p_id_proveedor: ID del proveedor
 *   - p_fec_esperada_entrega: Fecha esperada de entrega
 *   - p_observaciones_orden: Observaciones de la orden (opcional)
 *   - p_id_categoria: ID categoría del producto
 *   - p_id_linea: ID línea del producto
 *   - p_id_sublinea: ID sublínea del producto
 *   - p_id_producto: ID del producto
 *   - p_cantidad_solicitada: Cantidad solicitada del producto
 *   - p_costo_unitario: Costo unitario del producto
 *   - p_observaciones_producto: Observaciones del producto (opcional)
 *   - p_usr_operacion: Usuario que realiza la operación
 * 
 * RETORNA: JSON con resultado:
 *   - success: boolean
 *   - message: string descriptivo
 *   - id_orden_compra: integer (ID de la orden generado o proporcionado)
 *   - producto_existe: boolean
 *   - accion_requerida: string (si producto no existe)
 * 
 * LÓGICA:
 *   1. Generar ID de orden automáticamente si no se proporciona
 *   2. Validar parámetros obligatorios
 *   3. Verificar que el proveedor existe
 *   4. Verificar que el producto existe
 *   5. Si producto no existe → retornar instrucciones para crearlo
 *   6. Si producto existe → insertar orden de compra
 *   7. Retornar resultado exitoso con ID generado
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_insert_orden_compra_proveedor(
    p_id_orden_compra tab_orden_compra_proveedor.id_orden_compra%TYPE,
    p_id_proveedor tab_orden_compra_proveedor.id_proveedor%TYPE,
    p_fec_esperada_entrega tab_orden_compra_proveedor.fec_esperada_entrega%TYPE,
    p_observaciones_orden tab_orden_compra_proveedor.observaciones_orden%TYPE,
    p_id_categoria tab_orden_compra_proveedor.id_categoria%TYPE,
    p_id_linea tab_orden_compra_proveedor.id_linea%TYPE,
    p_id_sublinea tab_orden_compra_proveedor.id_sublinea%TYPE,
    p_id_producto tab_orden_compra_proveedor.id_producto%TYPE,
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
    v_producto_nombre tab_productos.nom_producto%TYPE;
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
    
    -- VALIDACIÓN 3: Verificar que el producto existe
    SELECT EXISTS(
        SELECT 1 FROM tab_productos p 
        WHERE p.id_categoria = p_id_categoria 
          AND p.id_linea = p_id_linea 
          AND p.id_sublinea = p_id_sublinea 
          AND p.id_producto = p_id_producto
    ) INTO v_producto_existe;
    
    -- Si el producto existe, obtener su nombre
    IF v_producto_existe THEN
        SELECT nom_producto 
        FROM tab_productos p 
        WHERE p.id_categoria = p_id_categoria 
          AND p.id_linea = p_id_linea 
          AND p.id_sublinea = p_id_sublinea 
          AND p.id_producto = p_id_producto
        INTO v_producto_nombre;
    END IF;
    
    -- SI EL PRODUCTO NO EXISTE: Retornar instrucciones para crearlo
    IF NOT v_producto_existe THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El producto especificado no existe. Debe crearlo primero usando fun_insert_producto',
            'producto_existe', false,
            'accion_requerida', 'CREAR_PRODUCTO_PRIMERO',
            'producto_solicitado', json_build_object(
                'id_categoria', p_id_categoria,
                'id_linea', p_id_linea,
                'id_sublinea', p_id_sublinea,
                'id_producto', p_id_producto
            ),
            'instrucciones', 'Ejecute fun_insert_producto() para crear el producto antes de generar la orden de compra'
        );
    END IF;
    
    -- VALIDACIÓN 4: Verificar que no exista duplicado (cada orden es para UN solo producto)
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
    
    -- INSERCIÓN: Crear orden de compra a proveedor
    INSERT INTO tab_orden_compra_proveedor (
        id_orden_compra,
        id_proveedor,
        fec_esperada_entrega,
        observaciones_orden,
        id_categoria,
        id_linea,
        id_sublinea,
        id_producto,
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
        p_id_categoria,
        p_id_linea,
        p_id_sublinea,
        p_id_producto,
        p_cantidad_solicitada,
        p_cantidad_recibida,
        p_costo_unitario,
        p_ind_estado_producto,
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
            'id_categoria', p_id_categoria,
            'id_linea', p_id_linea,
            'id_sublinea', p_id_sublinea,
            'id_producto', p_id_producto,
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