/*
 * FUNCIÓN: fun_insert_producto
 * 
 * DESCRIPCIÓN: Inserta un nuevo producto en el catálogo del sistema con todas las 
 *              validaciones necesarias y generación automática de ID secuencial.
 *              ACTUALIZADA para soportar múltiples imágenes en formato JSONB.
 * 
 * PARÁMETROS:
 *   - wid_categoria: ID de la categoría del producto (obligatorio, > 0)
 *   - wid_linea: ID de la línea del producto (obligatorio, > 0)
 *   - wid_sublinea: ID de la sublínea del producto (obligatorio, > 0)
 *   - wnom_producto: Nombre del producto (obligatorio, mínimo 3 caracteres)
 *   - wspcf_producto: Especificaciones del producto en formato JSON (obligatorio)
 *   - wimg_producto: Estructura JSONB de imágenes del producto (opcional)
 *   - wval_precio: Precio del producto (obligatorio, > 0)
 *   - wid_proveedor: ID del proveedor (obligatorio, > 0)
 *   - wid_marca: ID de la marca (obligatorio, > 0)
 *   - wnum_stock: Cantidad inicial en stock (obligatorio, >= 0)
 *   - wusr_operacion: Usuario que realiza la operación (obligatorio)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar todos los campos obligatorios
 *   2. Verificar que el producto no exista previamente
 *   3. Generar ID secuencial automático por categoría/línea/sublínea
 *   4. Insertar producto en la base de datos
 *   5. Confirmar éxito de la operación
 * 
 * NOTA: El ID del producto se genera automáticamente como secuencial
 *       dentro de cada combinación categoría+línea+sublínea
 * 
 * CAMBIOS: img_producto ahora es JSONB para soportar múltiples imágenes
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_insert_producto(
    wid_categoria tab_categorias.id_categoria%TYPE,
    wid_linea tab_lineas.id_linea%TYPE,
    wid_sublinea tab_sublineas.id_sublinea%TYPE,
    wnom_producto tab_productos.nom_producto%TYPE,
    wspcf_producto tab_productos.spcf_producto%TYPE,
    wimg_producto tab_productos.img_producto%TYPE,  -- ✅ CAMBIADO: Ahora es JSONB para múltiples imágenes
    wval_precio tab_productos.val_precio%TYPE,
    wid_proveedor tab_proveedores.id_proveedor%TYPE,
    wid_marca tab_marcas.id_marca%TYPE,
    wnum_stock tab_productos.num_stock%TYPE,
    wusr_operacion tab_productos.usr_insert%TYPE
) RETURNS VARCHAR AS
$$
    DECLARE
        v_producto_existe INTEGER;
        v_img_producto JSONB;
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

        -- VALIDACIÓN 9: Stock inicial del producto
        IF wnum_stock IS NULL OR wnum_stock < 0 THEN
            RETURN 'Error: El stock inicial no puede ser nulo ni negativo.';
        END IF;
        
        -- VALIDACIÓN 11: Verificar si el producto ya existe
        SELECT COUNT(*)
        INTO v_producto_existe
        FROM tab_productos
        WHERE id_categoria = wid_categoria
          AND id_linea = wid_linea
          AND id_sublinea = wid_sublinea
          AND UPPER(TRIM(nom_producto)) = UPPER(TRIM(wnom_producto))
          AND ind_activo = TRUE;
        
        IF v_producto_existe > 0 THEN
            RETURN 'Error: Ya existe un producto con el mismo nombre en esta categoría/línea/sublínea.';
        END IF;

        -- VALIDACIÓN 12: Procesar imagen (opcional)
        IF wimg_producto IS NULL THEN
            v_img_producto := '{}'::jsonb;  -- Estructura vacía si no hay imagen
        ELSE
            v_img_producto := wimg_producto;  -- Usar la estructura JSONB proporcionada
        END IF;
        
        -- INSERCIÓN: Crear nuevo producto en el catálogo
        INSERT INTO tab_productos (
            id_categoria,     -- Categoría del producto
            id_linea,         -- Línea del producto
            id_sublinea,      -- Sublínea del producto
            id_producto,      -- ID secuencial generado automáticamente
            nom_producto,     -- Nombre del producto
            spcf_producto,    -- Especificaciones en JSON
            img_producto,     -- Estructura JSONB de imágenes
            val_precio,       -- Precio del producto
            id_proveedor,     -- Proveedor del producto
            id_marca,         -- Marca del producto
            num_stock,        -- Stock inicial
            usr_insert
        ) VALUES (
            wid_categoria,
            wid_linea,
            wid_sublinea,
            -- Generar ID secuencial automático dentro de la categoría/línea/sublínea
            (SELECT COALESCE(MAX(id_producto), 0) + 1 
             FROM tab_productos 
             WHERE id_sublinea = wid_sublinea 
               AND id_linea = wid_linea 
               AND id_categoria = wid_categoria),
            wnom_producto,
            wspcf_producto,
            v_img_producto,   -- ✅ Usar la variable procesada
            wval_precio,
            wid_proveedor,
            wid_marca,
            wnum_stock,
            wusr_operacion
        );

        -- VERIFICACIÓN: Confirmar que la inserción fue exitosa
        IF FOUND THEN
            RAISE NOTICE 'Producto insertado exitosamente: %', wnom_producto;
            RETURN 'Producto insertado correctamente';
        ELSE
            RAISE NOTICE 'Error: No se pudo insertar el producto';
            RETURN 'Error al insertar el producto';
        END IF;
    END;
$$
LANGUAGE plpgsql;

-- Ejemplos de uso corregidos con todos los parámetros:
-- (id_categoria, id_linea, id_sublinea, nom_producto, spcf_producto, img_producto, val_precio, id_proveedor, id_marca, num_stock, usr_operacion)

SELECT fun_insert_producto(
    1, 1, 4,
    'Producto 4',
    '{"color": "rojo", "talla": "M"}'::jsonb,
    'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
    100, 1, 4, 100, 1000000000
);

-- SELECT fun_insert_producto(1, 1, 1, 'Producto 2', '{"color": "azul", "talla": "L"}', 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png', 200, 2, 2, 200, 1000000000);
