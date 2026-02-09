/*
 * STORED PROCEDURE: fun_migrar_carrito_anonimo_a_usuario
 * 
 * DESCRIPCIÓN: Migra todos los productos de un carrito anónimo al carrito de un usuario 
 *              registrado. Se ejecuta cuando un usuario anónimo se registra o inicia sesión.
 * 
 * PARÁMETROS:
 *   - p_id_carrito_anonimo: ID del carrito anónimo (origen)
 *   - p_id_usuario: ID del usuario registrado (destino)
 *   - p_usr_operacion: Usuario que realiza la operación (para auditoría)
 * 
 * RETORNA: JSON con estructura:
 *   - success: boolean (true/false)
 *   - message: string (mensaje descriptivo)
 * 
 * PROCESO:
 *   1. Obtiene/crea carrito del usuario registrado
 *   2. Itera sobre productos del carrito anónimo
 *   3. Actualiza precios a valores actuales
 *   4. Transfiere productos (suma cantidades si ya existen)
 *   5. Elimina carrito anónimo
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_migrar_carrito_anonimo_a_usuario(
    p_id_carrito_anonimo tab_carritos.id_carrito%TYPE,
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_usr_operacion tab_carritos.usr_insert%TYPE
) RETURNS JSON AS $$
DECLARE
    -- Variables para el proceso de migración
    v_id_carrito_usuario tab_carritos.id_carrito%TYPE;  -- ID del carrito destino
    v_producto_record RECORD;                           -- Registro para iterar productos
    v_precio_actual DECIMAL(10,2);                      -- Precio actualizado del producto
BEGIN
    -- PASO 1: Obtener o crear carrito del usuario registrado
    v_id_carrito_usuario := fun_obtener_carrito_usuario(p_id_usuario, NULL);
    
    -- PASO 2: Migrar productos del carrito anónimo al carrito del usuario
    FOR v_producto_record IN 
        SELECT * FROM tab_carrito_productos WHERE id_carrito = p_id_carrito_anonimo
    LOOP
        -- PASO 2.1: Obtener precio actual del producto (puede haber cambiado)
        SELECT val_precio INTO v_precio_actual
        FROM tab_productos 
        WHERE id_categoria = v_producto_record.id_categoria_producto 
        AND id_linea = v_producto_record.id_linea_producto 
        AND id_sublinea = v_producto_record.id_sublinea_producto 
        AND id_producto = v_producto_record.id_producto
        AND ind_activo = TRUE;  -- Solo productos que siguen activos
        
        -- Si el producto ya no está activo, conservar precio del carrito anónimo
        v_precio_actual := COALESCE(v_precio_actual, v_producto_record.precio_unitario_carrito);
        
        -- PASO 2.2: Insertar producto en carrito del usuario (o actualizar si ya existe)
        INSERT INTO tab_carrito_productos (
            id_carrito, id_categoria_producto, id_linea_producto,
            id_sublinea_producto, id_producto, cantidad,
            precio_unitario_carrito, usr_insert, opciones_elegidas
        ) VALUES (
            v_id_carrito_usuario,
            v_producto_record.id_categoria_producto,
            v_producto_record.id_linea_producto,
            v_producto_record.id_sublinea_producto,
            v_producto_record.id_producto,
            v_producto_record.cantidad,
            v_precio_actual,
            p_usr_operacion,
            COALESCE(v_producto_record.opciones_elegidas, '{}'::JSONB)
        )
        ON CONFLICT (id_carrito, id_categoria_producto, id_linea_producto, id_sublinea_producto, id_producto, opciones_elegidas)
        DO UPDATE SET 
            cantidad = tab_carrito_productos.cantidad + v_producto_record.cantidad,
            precio_unitario_carrito = v_precio_actual,
            usr_update = p_usr_operacion;
    END LOOP;
    
    -- PASO 3: Limpiar carrito anónimo después de migración exitosa
    DELETE FROM tab_carrito_productos WHERE id_carrito = p_id_carrito_anonimo;  -- Eliminar productos
    DELETE FROM tab_carritos WHERE id_carrito = p_id_carrito_anonimo;           -- Eliminar carrito
    
    -- PASO 4: Retornar resultado exitoso
    RETURN json_build_object('success', true, 'message', 'Carrito migrado exitosamente');
END;
$$ LANGUAGE plpgsql; 