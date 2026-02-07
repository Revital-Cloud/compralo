/*
 * FUNCIÓN: fun_eliminar_producto_carrito
 * 
 * DESCRIPCIÓN: Elimina productos del carrito de un usuario. Permite eliminar cantidad
 *              específica o eliminar completamente el producto del carrito.
 *              Maneja tanto usuarios registrados como anónimos.
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario registrado (opcional para usuarios anónimos)
 *   - p_session_id: ID de sesión para usuarios anónimos (opcional)
 *   - p_id_categoria: ID de categoría del producto (obligatorio, > 0)
 *   - p_id_linea: ID de línea del producto (obligatorio, > 0)
 *   - p_id_sublinea: ID de sublínea del producto (obligatorio, > 0)
 *   - p_id_producto: ID específico del producto (obligatorio, > 0)
 *   - p_cantidad: Cantidad a eliminar (opcional, si NULL elimina todo el producto)
 *   - p_usr_operacion: Usuario que realiza la operación (opcional - usa p_id_usuario por defecto)
 * 
 * RETORNA: JSON - Objeto con resultado de la operación:
 *   - success: Indicador de éxito (true/false)
 *   - message: Mensaje descriptivo del resultado
 *   - id_carrito: ID del carrito afectado
 *   - cantidad_eliminada: Cantidad realmente eliminada
 *   - cantidad_restante: Cantidad que queda en el carrito (0 si se eliminó completamente)
 * 
 * LÓGICA:
 *   1. Validar parámetros obligatorios
 *   2. Obtener carrito del usuario (registrado o anónimo)
 *   3. Verificar que el producto esté en el carrito
 *   4. Determinar cantidad a eliminar (específica o total)
 *   5. Actualizar o eliminar registro según corresponda
 *   6. Actualizar timestamp del carrito
 *   7. Retornar resultado con detalles
 * 
 * CASOS DE USO:
 *   - Eliminar producto completamente: p_cantidad = NULL
 *   - Reducir cantidad específica: p_cantidad = número positivo
 *   - Gestión de carrito en frontend de e-commerce
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_eliminar_producto_carrito(
    p_id_usuario tab_usuarios.id_usuario%TYPE,        -- Usuario registrado
    p_session_id tab_carritos.session_id%TYPE,        -- Usuario anónimo
    p_id_categoria tab_productos.id_categoria%TYPE,                -- Categoría del producto
    p_id_linea tab_productos.id_linea%TYPE,                        -- Línea del producto
    p_id_sublinea tab_productos.id_sublinea%TYPE,                  -- Sublínea del producto
    p_id_producto tab_productos.id_producto%TYPE,                  -- ID específico del producto
    p_cantidad tab_carrito_productos.cantidad%TYPE,   -- Cantidad a eliminar (NULL = todo)
    p_usr_operacion tab_carrito_productos.usr_update%TYPE -- Usuario que realiza la operación
) RETURNS JSON AS $$
DECLARE
    -- Variables para el proceso
    v_id_carrito tab_carritos.id_carrito%TYPE;                     -- ID del carrito del usuario
    v_cantidad_actual tab_carrito_productos.cantidad%TYPE;         -- Cantidad actual en carrito
    v_cantidad_eliminar tab_carrito_productos.cantidad%TYPE;       -- Cantidad que se va a eliminar
    v_cantidad_restante tab_carrito_productos.cantidad%TYPE;       -- Cantidad que quedará
    v_producto_existe BOOLEAN := FALSE;                            -- Verificar si producto existe en carrito
    v_usr_operacion_final tab_carrito_productos.usr_update%TYPE;   -- Usuario final para auditoría
BEGIN
    -- VALIDACIÓN 1: Al menos un identificador de usuario
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
    
    -- VALIDACIÓN 2: Identificadores del producto obligatorios
    IF p_id_categoria IS NULL OR p_id_categoria <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de categoría es obligatorio y debe ser mayor a 0');
    END IF;
    
    IF p_id_linea IS NULL OR p_id_linea <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de línea es obligatorio y debe ser mayor a 0');
    END IF;
    
    IF p_id_sublinea IS NULL OR p_id_sublinea <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de sublínea es obligatorio y debe ser mayor a 0');
    END IF;
    
    IF p_id_producto IS NULL OR p_id_producto <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de producto es obligatorio y debe ser mayor a 0');
    END IF;
    
    -- VALIDACIÓN 3: Cantidad a eliminar (si se especifica debe ser positiva)
    IF p_cantidad IS NOT NULL AND p_cantidad <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'La cantidad a eliminar debe ser mayor a 0');
    END IF;
    
    -- PASO 1: Obtener carrito del usuario (registrado o anónimo)
    v_id_carrito := fun_obtener_carrito_usuario(p_id_usuario, p_session_id);
    
    -- PASO 2: Verificar que el producto esté en el carrito y obtener cantidad actual
    SELECT cantidad, TRUE INTO v_cantidad_actual, v_producto_existe
    FROM tab_carrito_productos
    WHERE id_carrito = v_id_carrito
    AND id_categoria_producto = p_id_categoria
    AND id_linea_producto = p_id_linea
    AND id_sublinea_producto = p_id_sublinea
    AND id_producto = p_id_producto;
    
    -- Validar que el producto existe en el carrito
    IF NOT v_producto_existe THEN
        RETURN json_build_object('success', false, 'message', 'El producto no está en el carrito');
    END IF;
    
    -- PASO 3: Determinar cantidad a eliminar
    IF p_cantidad IS NULL THEN
        -- Eliminar todo el producto
        v_cantidad_eliminar := v_cantidad_actual;
        v_cantidad_restante := 0;
    ELSE
        -- Eliminar cantidad específica
        IF p_cantidad >= v_cantidad_actual THEN
            -- Si se pide eliminar más de lo que hay, eliminar todo
            v_cantidad_eliminar := v_cantidad_actual;
            v_cantidad_restante := 0;
        ELSE
            -- Eliminar solo la cantidad especificada
            v_cantidad_eliminar := p_cantidad;
            v_cantidad_restante := v_cantidad_actual - p_cantidad;
        END IF;
    END IF;
    
    -- PASO 4: Actualizar o eliminar registro según corresponda
    IF v_cantidad_restante = 0 THEN
        -- Eliminar completamente el producto del carrito
        DELETE FROM tab_carrito_productos
        WHERE id_carrito = v_id_carrito
        AND id_categoria_producto = p_id_categoria
        AND id_linea_producto = p_id_linea
        AND id_sublinea_producto = p_id_sublinea
        AND id_producto = p_id_producto;
    ELSE
        -- Actualizar cantidad restante
        UPDATE tab_carrito_productos
        SET cantidad = v_cantidad_restante,
            usr_update = v_usr_operacion_final
        WHERE id_carrito = v_id_carrito
        AND id_categoria_producto = p_id_categoria
        AND id_linea_producto = p_id_linea
        AND id_sublinea_producto = p_id_sublinea
        AND id_producto = p_id_producto;
    END IF;
    
    -- PASO 5: Actualizar fecha de modificación del carrito principal
    UPDATE tab_carritos 
    SET fec_update = NOW(),            -- Última modificación
        usr_update = v_usr_operacion_final  -- Usuario que actualiza
    WHERE id_carrito = v_id_carrito;
    
    -- PASO 6: Retornar resultado exitoso con detalles
    RETURN json_build_object(
        'success', true, 
        'message', CASE 
            WHEN v_cantidad_restante = 0 THEN 'Producto eliminado completamente del carrito'
            ELSE 'Cantidad reducida en el carrito'
        END,
        'id_carrito', v_id_carrito,
        'cantidad_eliminada', v_cantidad_eliminar,
        'cantidad_restante', v_cantidad_restante
    );
END;
$$ LANGUAGE plpgsql; 