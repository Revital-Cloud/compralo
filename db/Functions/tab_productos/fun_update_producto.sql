/*
 * FUNCIÓN: fun_update_producto
 * 
 * DESCRIPCIÓN: Actualiza la información de un producto existente en el catálogo
 *              con validaciones completas de todos los campos modificables.
 * 
 * PARÁMETROS:
 *   - wid_categoria: ID de categoría del producto (obligatorio, > 0)
 *   - wid_linea: ID de línea del producto (obligatorio, > 0)
 *   - wid_sublinea: ID de sublínea del producto (obligatorio, > 0)
 *   - wid_producto: ID específico del producto (obligatorio, > 0)
 *   - wnom_producto: Nuevo nombre del producto (obligatorio, mínimo 3 caracteres)
 *   - wspcf_producto: Nuevas especificaciones en JSON (obligatorio)
 *   - wimg_producto: Nueva URL de imagen (opcional)
 *   - wval_precio: Nuevo precio (obligatorio, > 0)
 *   - wid_proveedor: Nuevo proveedor (obligatorio, > 0)
 *   - wid_marca: Nueva marca (obligatorio, > 0)
 *   - wnum_stock: Nuevo stock (obligatorio, >= 0)
 *   - wind_activo: Nuevo estado activo (opcional, default TRUE)
 *   - wusr_operacion: Usuario que realiza la operación para auditoría (obligatorio)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar identificadores del producto (categoría, línea, sublínea, producto)
 *   2. Validar nuevos datos del producto
 *   3. Actualizar registro existente
 *   4. Confirmar éxito de la operación
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_update_producto(
    wid_categoria tab_categorias.id_categoria%TYPE,
    wid_linea tab_lineas.id_linea%TYPE,
    wid_sublinea tab_sublineas.id_sublinea%TYPE,
    wid_producto tab_productos.id_producto%TYPE,
    wnom_producto tab_productos.nom_producto%TYPE,
    wspcf_producto tab_productos.spcf_producto%TYPE,
    wimg_producto tab_productos.img_producto%TYPE,
    wval_precio tab_productos.val_precio%TYPE,
    wid_proveedor tab_proveedores.id_proveedor%TYPE,
    wid_marca tab_marcas.id_marca%TYPE,
    wnum_stock tab_productos.num_stock%TYPE,
    wind_activo tab_productos.ind_activo%TYPE,
    wusr_operacion tab_productos.usr_update%TYPE
) RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: Categoría del producto
        IF wid_categoria IS NULL OR wid_categoria = 0 THEN
            RETURN 'Error: El ID de categoría es obligatorio y debe ser mayor a 0.';
        END IF;

        -- VALIDACIÓN 2: Línea del producto
        IF wid_linea IS NULL OR wid_linea = 0 THEN
            RETURN 'Error: El ID de línea es obligatorio y debe ser mayor a 0.';
        END IF;

        -- VALIDACIÓN 3: Sublínea del producto
        IF wid_sublinea IS NULL OR wid_sublinea = 0 THEN
            RETURN 'Error: El ID de sublínea es obligatorio y debe ser mayor a 0.';
        END IF;

        -- VALIDACIÓN 4: Nombre del producto
        IF wnom_producto IS NULL OR wnom_producto = '' OR LENGTH(TRIM(wnom_producto)) < 3 THEN
            RETURN 'Error: El nombre del producto es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 5: Especificaciones del producto
        IF wspcf_producto IS NULL THEN
            RETURN 'Error: Las especificaciones del producto son obligatorias.';
        END IF;

        -- VALIDACIÓN 6: Precio del producto
        IF wval_precio IS NULL OR wval_precio <= 0 THEN
            RETURN 'Error: El precio del producto es obligatorio y debe ser mayor a 0.';
        END IF;

        -- VALIDACIÓN 7: Proveedor del producto
        IF wid_proveedor IS NULL OR wid_proveedor = 0 THEN
            RETURN 'Error: El ID del proveedor es obligatorio y debe ser mayor a 0.';
        END IF;
        
        -- VALIDACIÓN 8: Marca del producto
        IF wid_marca IS NULL OR wid_marca = 0 THEN
            RETURN 'Error: El ID de la marca es obligatorio y debe ser mayor a 0.';
        END IF;

        -- VALIDACIÓN 9: Stock del producto
        IF wnum_stock IS NULL OR wnum_stock < 0 THEN
            RETURN 'Error: El stock del producto no puede ser nulo ni negativo.';
        END IF;
        
        -- VALIDACIÓN 10: ID de usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
            RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
        END IF;
        
        -- ACTUALIZACIÓN: Modificar información del producto existente
        UPDATE tab_productos    
        SET nom_producto = wnom_producto,                       -- Nuevo nombre
            spcf_producto = wspcf_producto,                     -- Nuevas especificaciones JSON
            img_producto = wimg_producto,                       -- Nueva URL de imagen
            val_precio = wval_precio,                           -- Nuevo precio
            id_proveedor = wid_proveedor,                       -- Nuevo proveedor
            id_marca = wid_marca,                               -- Nueva marca
            num_stock = wnum_stock,                             -- Nuevo stock
            ind_activo = wind_activo,                           -- Nuevo estado activo
            usr_update = wusr_operacion,                        -- ID del usuario que actualiza
            fec_update = NOW()                                  -- Timestamp de actualización
        WHERE id_categoria = wid_categoria AND id_linea = wid_linea AND id_sublinea = wid_sublinea AND id_producto = wid_producto;

        -- VERIFICACIÓN: Confirmar que la actualización fue exitosa
        IF FOUND THEN
            RAISE NOTICE 'Producto actualizado exitosamente: % por usuario ID: %', wnom_producto, wusr_operacion;
            RETURN 'Producto actualizado correctamente';
        ELSE
            RAISE NOTICE 'Error: Producto no encontrado o no se pudo actualizar';
            RETURN 'Error: Producto no encontrado o no se pudo actualizar';
        END IF;
    END;
$$
LANGUAGE plpgsql;

-- Ejemplo de uso corregido (ahora con ID numérico)
-- SELECT fun_update_producto(1, 1, 1, 1, 'Producto 1', '{"color": "rojo", "talla": "M"}', 'https://ejemplo.com/imagen.jpg', 100, 1, 1, 100, TRUE, 1234567890);
