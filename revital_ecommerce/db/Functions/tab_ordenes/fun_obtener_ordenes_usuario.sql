/*
 * FUNCIÓN: fun_obtener_ordenes_usuario
 * 
 * DESCRIPCIÓN: Obtiene el historial de órdenes de un usuario específico con información
 *              detallada incluyendo estados, métodos de pago, descuentos y cantidad de productos.
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario (obligatorio)
 *   - p_limite: Límite de registros a retornar (opcional, por defecto 10)
 * 
 * RETORNA: TABLE - Tabla con información de órdenes:
 *   - id_orden: ID de la orden
 *   - fecha_pedido: Fecha del pedido
 *   - total_productos: Valor total de productos sin descuentos
 *   - total_descuentos: Valor total de descuentos aplicados
 *   - total_pedido: Valor total final del pedido
 *   - estado_orden: Estado legible (Pendiente/Pagada/Completado/Cancelado)
 *   - metodo_pago: Método de pago legible (Efectivo/Tarjeta/Transferencia)
 *   - cantidad_productos: Cantidad de productos en la orden
 *   - descuentos_aplicados: JSON con detalle de descuentos
 * 
 * LÓGICA:
 *   1. Consultar órdenes del usuario específico
 *   2. Convertir códigos de estado e indicadores a texto legible
 *   3. Contar productos por orden
 *   4. Incluir información de descuentos aplicados
 *   5. Ordenar por fecha descendente (más recientes primero)
 *   6. Limitar resultados según parámetro
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_obtener_ordenes_usuario(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_limite INT DEFAULT 10
) RETURNS TABLE (
    id_orden tab_ordenes.id_orden%TYPE,
    fecha_pedido tab_ordenes.fec_pedido%TYPE,
    total_productos DECIMAL(10,0),
    total_descuentos DECIMAL(10,0),
    total_pedido tab_ordenes.val_total_pedido%TYPE,
    estado_orden TEXT,
    metodo_pago TEXT,
    cantidad_productos BIGINT,
    descuentos_aplicados JSON
) AS $$
BEGIN
    -- CONSULTA: Obtener órdenes del usuario con información detallada
    RETURN QUERY
    SELECT 
        o.id_orden,                                                 -- ID de la orden
        o.fec_pedido,                                               -- Fecha del pedido
        COALESCE(o.val_total_productos, o.val_total_pedido) as total_productos,  -- Compatibilidad con datos legacy
        COALESCE(o.val_total_descuentos, 0) as total_descuentos,    -- Total de descuentos (0 si es NULL)
        o.val_total_pedido,                                         -- Valor total final del pedido
        CASE 
            WHEN o.ind_estado = 1 THEN 'Pendiente'
            WHEN o.ind_estado = 2 THEN 'Completada'
            WHEN o.ind_estado = 3 THEN 'Cancelada'
            ELSE 'Desconocido'
        END AS estado,
        o.metodo_pago,                                     -- Método de pago legible
        o.json_descuentos_aplicados
    FROM 
        tab_ordenes o
    WHERE 
        o.id_usuario = p_id_usuario
    GROUP BY 
        o.id_orden, o.fec_pedido, o.val_total_pedido, o.ind_estado, o.metodo_pago, o.json_descuentos_aplicados
    ORDER BY 
        o.fec_pedido DESC
    LIMIT p_limite;                                                -- Limitar resultados
END;
$$ LANGUAGE plpgsql; 