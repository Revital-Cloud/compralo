/*
 * STORED PROCEDURE: fun_agregar_producto_carrito
 * 
 * DESCRIPCIÓN: Agrega un producto al carrito del usuario o actualiza la cantidad si ya existe.
 *              Realiza validaciones de existencia, stock y estado del producto.
 *              Maneja tanto usuarios registrados como anónimos.
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario registrado (opcional para usuarios anónimos)
 *   - p_session_id: ID de sesión para usuarios anónimos (opcional)
 *   - p_id_categoria: ID de la categoría del producto
 *   - p_id_linea: ID de la línea del producto
 *   - p_id_sublinea: ID de la sublínea del producto
 *   - p_id_producto: ID específico del producto
 *   - p_cantidad: Cantidad del producto a agregar
 *   - p_usr_operacion: Usuario que realiza la operación (opcional - usa p_id_usuario por defecto)
 * 
 * RETORNA: JSON con estructura:
 *   - success: boolean (true/false)
 *   - message: string (mensaje descriptivo)
 *   - id_carrito: integer (ID del carrito, solo en éxito)
 * 
 * VALIDACIONES:
 *   1. Producto existe y está activo
 *   2. Stock suficiente disponible
 *   3. Carrito válido del usuario
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_agregar_producto_carrito(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_session_id tab_carritos.session_id%TYPE,
    p_id_categoria tab_productos.id_categoria%TYPE,
    p_id_linea tab_productos.id_linea%TYPE,
    p_id_sublinea tab_productos.id_sublinea%TYPE,
    p_id_producto tab_productos.id_producto%TYPE,
    p_cantidad tab_carrito_productos.cantidad%TYPE,
    p_usr_operacion tab_carrito_productos.usr_insert%TYPE
) RETURNS JSON AS $$
DECLARE
    -- Variables para el proceso
    v_id_carrito tab_carritos.id_carrito%TYPE;              -- ID del carrito del usuario
    v_precio_actual tab_productos.val_precio%TYPE;          -- Precio actual del producto
    v_stock_disponible tab_productos.num_stock%TYPE;        -- Stock disponible del producto
    v_cantidad_actual tab_carrito_productos.cantidad%TYPE;  -- Cantidad actual en carrito (si existe)
    v_usr_operacion_final tab_carrito_productos.usr_insert%TYPE; -- Usuario final para auditoría
BEGIN
    -- PASO 1: Validar parámetros y determinar usuario de auditoría
    IF p_id_usuario IS NULL AND p_session_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Debe proporcionar id_usuario o session_id');
    END IF;
    
    -- Determinar usuario para auditoría
    IF p_usr_operacion IS NOT NULL THEN
        v_usr_operacion_final := p_usr_operacion;  -- Usar el proporcionado
    ELSIF p_id_usuario IS NOT NULL THEN
        v_usr_operacion_final := p_id_usuario;     -- Usar el ID del usuario logueado
    ELSE
        -- Para usuarios anónimos, usar un ID temporal basado en el hash del session_id
        v_usr_operacion_final := ABS(hashtext(p_session_id))::DECIMAL(10);
    END IF;
    
    -- PASO 2: Validar que el producto existe, está activo y obtener precio y stock
    SELECT val_precio, num_stock INTO v_precio_actual, v_stock_disponible
    FROM tab_productos 
    WHERE id_categoria = p_id_categoria 
    AND id_linea = p_id_linea 
    AND id_sublinea = p_id_sublinea 
    AND id_producto = p_id_producto
    AND ind_activo = TRUE;  -- Filtrar solo productos activos
    
    -- Validar si el producto fue encontrado
    IF v_precio_actual IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Producto no encontrado o no está disponible');
    END IF;
    
    -- PASO 3: Obtener o crear carrito del usuario (registrado o anónimo)
    v_id_carrito := fun_obtener_carrito_usuario(p_id_usuario, p_session_id);
    
    -- PASO 4: Verificar si el producto ya está en el carrito
    SELECT cantidad INTO v_cantidad_actual
    FROM tab_carrito_productos
    WHERE id_carrito = v_id_carrito
    AND id_categoria_producto = p_id_categoria
    AND id_linea_producto = p_id_linea
    AND id_sublinea_producto = p_id_sublinea
    AND id_producto = p_id_producto;
    
    -- PASO 5: Validar que hay stock suficiente (cantidad actual + nueva cantidad)
    IF (COALESCE(v_cantidad_actual, 0) + p_cantidad) > v_stock_disponible THEN
        RETURN json_build_object('success', false, 'message', 'Stock insuficiente');
    END IF;
    
    -- PASO 6: Insertar nuevo producto o actualizar cantidad si ya existe
    INSERT INTO tab_carrito_productos (
        id_carrito, id_categoria_producto, id_linea_producto, 
        id_sublinea_producto, id_producto, cantidad, 
        precio_unitario_carrito, usr_insert
    ) VALUES (
        v_id_carrito,                    -- ID del carrito
        p_id_categoria,                  -- Categoría del producto
        p_id_linea,                      -- Línea del producto
        p_id_sublinea,                   -- Sublínea del producto
        p_id_producto,                   -- ID específico del producto
        p_cantidad,                      -- Cantidad a agregar
        v_precio_actual,                 -- Precio actual del producto
        v_usr_operacion_final            -- Usuario que realiza la operación
    )
    -- Si el producto ya existe en el carrito, actualizar cantidad y precio
    ON CONFLICT (id_carrito, id_categoria_producto, id_linea_producto, id_sublinea_producto, id_producto)
    DO UPDATE SET 
        cantidad = tab_carrito_productos.cantidad + p_cantidad,  -- Sumar a la cantidad existente
        precio_unitario_carrito = v_precio_actual,               -- Actualizar precio actual
        usr_update = v_usr_operacion_final;                      -- Usuario que actualiza
    
    -- PASO 7: Actualizar fecha de modificación del carrito principal
    UPDATE tab_carritos 
    SET fec_update = NOW(),            -- Última modificación
        usr_update = v_usr_operacion_final  -- Usuario que modifica
    WHERE id_carrito = v_id_carrito;
    
    -- PASO 8: Retornar resultado exitoso
    RETURN json_build_object(
        'success', true, 
        'message', 'Producto agregado al carrito', 
        'id_carrito', v_id_carrito
    );
END;
$$ LANGUAGE plpgsql; 