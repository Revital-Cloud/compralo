/*
 * TABLA UNIFICADA: tab_orden_compra_proveedor
 * 
 * DESCRIPCIÓN: Tabla que unifica la información de órdenes de compra a proveedores
 *              con sus detalles de productos. Reemplaza la relación 1:N entre
 *              tab_ordenes_compra_proveedor y tab_detalle_orden_compra_proveedor.
 * 
 * CARACTERÍSTICAS:
 *   - Una fila por cada producto en cada orden de compra
 *   - Información completa de orden + detalle del producto
 *   - Trigger automático para actualizar stock al confirmar recepción
 *   - Control de estados por producto individual
 * 
 * ESTADOS DEL PRODUCTO EN ORDEN:
 *   1 = Solicitado    (producto pedido, pendiente de entrega)
 *   2 = Parcial       (entrega parcial recibida)  
 *   3 = Recibido      (producto completamente recibido) ← ACTUALIZA STOCK
 *   4 = Cancelado     (producto cancelado de la orden)
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */

-- Eliminar tabla antigua si existe (migración)
DROP TABLE IF EXISTS tab_orden_compra_proveedor CASCADE;

-- Crear nueva tabla unificada
CREATE TABLE IF NOT EXISTS tab_orden_compra_proveedor (
    -- === IDENTIFICADORES ===
    id_orden_compra_producto    SERIAL PRIMARY KEY,                    -- ID único del registro
    
    -- === INFORMACIÓN DE LA ORDEN (ex tab_ordenes_compra_proveedor) ===
    id_orden_compra             DECIMAL(10) NOT NULL,                  -- ID de la orden de compra
    id_proveedor                DECIMAL(10) NOT NULL,                  -- Proveedor de la orden
    fec_orden_compra            DATE NOT NULL DEFAULT CURRENT_DATE,    -- Fecha de la orden
    fec_esperada_entrega        DATE NOT NULL,                         -- Fecha esperada de entrega
    observaciones_orden         VARCHAR,                               -- Observaciones generales
    
    -- === INFORMACIÓN DEL PRODUCTO (ex tab_detalle_orden_compra_proveedor) ===
    id_categoria                DECIMAL(10) NOT NULL,                  -- ID categoría del producto
    id_linea                    DECIMAL(10) NOT NULL,                  -- ID línea del producto  
    id_sublinea                 DECIMAL(10) NOT NULL,                  -- ID sublínea del producto
    id_producto                 DECIMAL(10) NOT NULL,                  -- ID del producto
    
    -- === CANTIDADES Y COSTOS ===
    cantidad_solicitada         INT NOT NULL CHECK (cantidad_solicitada > 0),     -- Cantidad pedida
    cantidad_recibida           INT NOT NULL DEFAULT 0 CHECK (cantidad_recibida >= 0), -- Cantidad recibida
    costo_unitario              DECIMAL(10,2) NOT NULL CHECK (costo_unitario >= 0),    -- Costo por unidad
    subtotal_producto           DECIMAL(12,2) GENERATED ALWAYS AS (cantidad_solicitada * costo_unitario) STORED, -- Subtotal calculado
    
    -- === ESTADOS Y CONTROL ===
    ind_estado_producto         DECIMAL(1) NOT NULL DEFAULT 1 CHECK (ind_estado_producto BETWEEN 1 AND 4), -- Estado del producto
    fec_recepcion_completa      TIMESTAMP WITHOUT TIME ZONE,          -- Fecha cuando se completó recepción
    observaciones_producto      VARCHAR,                               -- Observaciones específicas del producto
    
    -- === CAMPOS DE AUDITORÍA ===
    usr_insert                  DECIMAL(10) NOT NULL,                  -- Usuario que crea
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(), -- Fecha creación
    usr_update                  DECIMAL(10),                          -- Usuario que actualiza
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,          -- Fecha actualización
    
    -- === FOREIGN KEYS ===
    FOREIGN KEY (id_proveedor) REFERENCES tab_proveedores(id_proveedor),
    FOREIGN KEY (id_categoria, id_linea, id_sublinea, id_producto) 
        REFERENCES tab_productos(id_categoria, id_linea, id_sublinea, id_producto),
    
    -- === CONSTRAINTS ===
    CONSTRAINT chk_cantidad_recibida_limite CHECK (cantidad_recibida <= cantidad_solicitada),
    CONSTRAINT chk_fec_esperada_futura CHECK (fec_esperada_entrega >= fec_orden_compra),
    CONSTRAINT chk_recepcion_completa_coherente CHECK (
        (ind_estado_producto = 3 AND fec_recepcion_completa IS NOT NULL) OR
        (ind_estado_producto != 3 AND fec_recepcion_completa IS NULL)
    ),
    
    -- Evitar duplicados: mismo producto en la misma orden de compra
    CONSTRAINT uq_orden_producto_proveedor UNIQUE (id_orden_compra, id_categoria, id_linea, id_sublinea, id_producto)
);

-- === ÍNDICES PARA OPTIMIZACIÓN ===
CREATE INDEX IF NOT EXISTS idx_orden_compra_proveedor_orden 
    ON tab_orden_compra_proveedor(id_orden_compra, id_proveedor);

CREATE INDEX IF NOT EXISTS idx_orden_compra_proveedor_producto 
    ON tab_orden_compra_proveedor(id_categoria, id_linea, id_sublinea, id_producto);

CREATE INDEX IF NOT EXISTS idx_orden_compra_proveedor_estado 
    ON tab_orden_compra_proveedor(ind_estado_producto, fec_esperada_entrega);

CREATE INDEX IF NOT EXISTS idx_orden_compra_proveedor_proveedor_fecha 
    ON tab_orden_compra_proveedor(id_proveedor, fec_orden_compra DESC);

-- === COMENTARIOS DE DOCUMENTACIÓN ===
COMMENT ON TABLE tab_orden_compra_proveedor IS 
'Tabla unificada de órdenes de compra a proveedores con detalles de productos';

COMMENT ON COLUMN tab_orden_compra_proveedor.ind_estado_producto IS 
'Estado: 1=Solicitado, 2=Parcial, 3=Recibido (actualiza stock), 4=Cancelado';

COMMENT ON COLUMN tab_orden_compra_proveedor.subtotal_producto IS 
'Calculado automáticamente: cantidad_solicitada * costo_unitario';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Tabla tab_orden_compra_proveedor creada exitosamente';
    RAISE NOTICE '📦 Unifica órdenes de compra + detalles de productos';
    RAISE NOTICE '🔄 Lista para triggers de actualización de stock';
END $$; 