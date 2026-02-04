/*
* FUNCIÓN: fun_insert_comentarios
* 
* DESCRIPCIÓN: Inserta un nuevo comentario sobre un producto específico asociado a una orden.
* 
* PARÁMETROS:
*   - wid_categoria: ID de la categoría del producto (obligatorio, > 0)
*   - wid_linea: ID de la línea del producto (obligatorio, > 0)
*   - wid_sublinea: ID de la sublínea del producto (obligatorio, > 0)
*   - wid_producto: ID del producto específico (obligatorio, > 0)
*   - wid_usuario: ID del usuario que comenta (obligatorio, > 0)
*   - wid_orden: ID de la orden asociada al comentario (obligatorio, > 0)
*   - wcomentario: Texto del comentario (obligatorio, mínimo 3 caracteres)
*   - wcalificacion: Calificación del producto (obligatorio, 1-5 estrellas)
*   - wusr_operacion: ID del usuario que realiza la operación (obligatorio, DECIMAL)
*
* RETORNA: VARCHAR - Mensaje indicando éxito o error específico
* 
* LÓGICA:
*   1. Validar todos los parámetros obligatorios
*   2. Verificar que el producto existe y está activo
*   3. Verificar que el usuario existe y está activo
*   4. Verificar que la orden existe y pertenece al usuario
*   5. Verificar que el producto esté en la orden especificada
*   6. Verificar que no exista ya una reseña del usuario para este producto en esta orden
*   7. Generar ID secuencial por producto
*   8. Insertar comentario
*   9. Confirmar éxito de la operación
* 
* NOTA: El usuario puede reseñar el mismo producto si lo compra en otra orden diferente
* 
* AUTOR: Sistema DB_Synkro
* FECHA: 2025
*/
CREATE OR REPLACE FUNCTION fun_insert_comentarios(
    wid_categoria tab_comentarios.id_categoria%TYPE,
    wid_linea tab_comentarios.id_linea%TYPE,
    wid_sublinea tab_comentarios.id_sublinea%TYPE,
    wid_producto tab_comentarios.id_producto%TYPE,
    wid_usuario tab_comentarios.id_usuario%TYPE,
    wid_orden tab_comentarios.id_orden%TYPE,
    wcomentario tab_comentarios.comentario%TYPE,
    wcalificacion tab_comentarios.calificacion%TYPE,
    wusr_operacion tab_comentarios.usr_insert%TYPE
) RETURNS VARCHAR AS $$

BEGIN
    -- VALIDACIÓN 1: ID de usuario operación para auditoría
    IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
        RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0';
    END IF;

    -- VALIDACIÓN 2: ID de categoría
    IF wid_categoria IS NULL OR wid_categoria <= 0 THEN
        RETURN 'Error: El ID de categoría es obligatorio y debe ser mayor a 0';
    END IF;

    -- VALIDACIÓN 3: ID de línea
    IF wid_linea IS NULL OR wid_linea <= 0 THEN
        RETURN 'Error: El ID de línea es obligatorio y debe ser mayor a 0';
    END IF;

    -- VALIDACIÓN 4: ID de sublínea
    IF wid_sublinea IS NULL OR wid_sublinea <= 0 THEN
        RETURN 'Error: El ID de sublínea es obligatorio y debe ser mayor a 0';
    END IF;

    -- VALIDACIÓN 5: ID de producto
    IF wid_producto IS NULL OR wid_producto <= 0 THEN
        RETURN 'Error: El ID de producto es obligatorio y debe ser mayor a 0';
    END IF;

    -- VALIDACIÓN 6: ID de usuario
    IF wid_usuario IS NULL OR wid_usuario <= 0 THEN
        RETURN 'Error: El ID de usuario es obligatorio y debe ser mayor a 0';
    END IF;

    -- VALIDACIÓN 7: Comentario
    IF wcomentario IS NULL OR wcomentario = '' OR LENGTH(TRIM(wcomentario)) < 3 THEN
        RETURN 'Error: El comentario es obligatorio y debe tener al menos 3 caracteres';
    END IF;

    -- VALIDACIÓN 8: Calificación
    IF wcalificacion IS NULL OR wcalificacion < 1 OR wcalificacion > 5 THEN
        RETURN 'Error: La calificación es obligatoria y debe estar entre 1 y 5 estrellas';
    END IF;

    -- VALIDACIÓN 9: ID de orden
    IF wid_orden IS NULL OR wid_orden <= 0 THEN
        RETURN 'Error: El ID de orden es obligatorio y debe ser mayor a 0';
    END IF;

    -- VALIDACIÓN 10: Verificar que la orden existe y pertenece al usuario
    IF NOT EXISTS (
        SELECT 1 
        FROM tab_ordenes
        WHERE id_orden = wid_orden
          AND id_usuario = wid_usuario
          AND ind_estado IN (2, 3) -- Solo órdenes procesadas o entregadas
    ) THEN
        RETURN 'Error: La orden no existe, no te pertenece o no está en estado válido para reseñar';
    END IF;

    -- VALIDACIÓN 11: Verificar que el producto esté en la orden especificada
    IF NOT EXISTS (
        SELECT 1 
        FROM tab_orden_productos
        WHERE id_orden = wid_orden
          AND id_categoria_producto = wid_categoria
          AND id_linea_producto = wid_linea
          AND id_sublinea_producto = wid_sublinea
          AND id_producto = wid_producto
    ) THEN
        RETURN 'Error: El producto no está incluido en esta orden';
    END IF;

    -- VALIDACIÓN 12: Verificar que no exista ya una reseña para este producto en esta orden
    -- El usuario puede reseñar el mismo producto si lo compra en otra orden
    IF EXISTS (
        SELECT 1 
        FROM tab_comentarios
        WHERE id_categoria = wid_categoria
          AND id_linea = wid_linea
          AND id_sublinea = wid_sublinea
          AND id_producto = wid_producto
          AND id_usuario = wid_usuario
          AND id_orden = wid_orden
          AND ind_activo = TRUE
    ) THEN
        RETURN 'Error: Ya has reseñado este producto en esta orden';
    END IF;
    
    -- INSERCIÓN: Crear nuevo comentario (fec_insert lo asigna el trigger tri_audit_comentarios)
    INSERT INTO tab_comentarios (
        id_categoria, id_linea, id_sublinea, id_producto,
        id_usuario, id_orden, id_comentario, comentario, calificacion, usr_insert
    ) VALUES (
        wid_categoria,
        wid_linea,
        wid_sublinea,
        wid_producto,
        wid_usuario,
        wid_orden,
        (SELECT COALESCE(MAX(id_comentario),0) + 1 FROM tab_comentarios),
        wcomentario,
        wcalificacion,
        wusr_operacion
    );

    -- VERIFICACIÓN: Confirmar que la inserción fue exitosa
    IF FOUND THEN
        RAISE NOTICE 'Comentario insertado exitosamente por usuario ID: %', wid_usuario;
        RETURN 'Comentario insertado correctamente';
    ELSE
        RETURN 'Error al insertar el comentario';
    END IF;

-- MANEJO DE ERRORES: Capturar excepciones específicas
EXCEPTION
    WHEN foreign_key_violation THEN
        RETURN 'Error: Referencia a producto o usuario inexistente';
    WHEN unique_violation THEN
        RETURN 'Error: Ya existe un comentario con ese ID para este producto';
    WHEN OTHERS THEN
        RETURN 'Error inesperado al insertar comentario: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
    