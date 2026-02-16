/*
 * Inserta un comentario/reseña sobre un producto en una orden.
 * Usa product_id (tabla products). La orden debe contener una variante de ese producto.
 */
CREATE OR REPLACE FUNCTION fun_insert_comentarios(
    wid_producto tab_comentarios.product_id%TYPE,
    wid_usuario tab_comentarios.id_usuario%TYPE,
    wid_orden tab_comentarios.id_orden%TYPE,
    wcomentario tab_comentarios.comentario%TYPE,
    wcalificacion tab_comentarios.calificacion%TYPE,
    wusr_operacion tab_comentarios.usr_insert%TYPE
) RETURNS VARCHAR AS $$
DECLARE
    v_id_comentario DECIMAL(10);
BEGIN
    IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
        RETURN 'Error: El usuario de operación es obligatorio.';
    END IF;
    IF wid_producto IS NULL OR wid_producto <= 0 THEN
        RETURN 'Error: El product_id es obligatorio.';
    END IF;
    IF wid_usuario IS NULL OR wid_usuario <= 0 THEN
        RETURN 'Error: El ID de usuario es obligatorio.';
    END IF;
    IF wcomentario IS NULL OR trim(wcomentario) = '' OR length(trim(wcomentario)) < 3 THEN
        RETURN 'Error: El comentario debe tener al menos 3 caracteres.';
    END IF;
    IF wcalificacion IS NULL OR wcalificacion < 1 OR wcalificacion > 5 THEN
        RETURN 'Error: La calificación debe estar entre 1 y 5.';
    END IF;
    IF wid_orden IS NULL OR wid_orden <= 0 THEN
        RETURN 'Error: El ID de orden es obligatorio.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM tab_ordenes
        WHERE id_orden = wid_orden AND id_usuario = wid_usuario AND ind_estado IN (2, 3)
    ) THEN
        RETURN 'Error: La orden no existe, no te pertenece o no está en estado válido para reseñar';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM tab_orden_productos op
        JOIN tab_product_variant_combinations pv ON pv.id = op.variant_id
        JOIN tab_product_variant_groups g ON g.id = pv.group_id
        WHERE op.id_orden = wid_orden AND g.product_id = wid_producto
    ) THEN
        RETURN 'Error: El producto no está incluido en esta orden';
    END IF;

    IF EXISTS (
        SELECT 1 FROM tab_comentarios
        WHERE product_id = wid_producto AND id_usuario = wid_usuario AND id_orden = wid_orden AND ind_activo = TRUE
    ) THEN
        RETURN 'Error: Ya has reseñado este producto en esta orden';
    END IF;

    v_id_comentario := (SELECT COALESCE(MAX(id_comentario), 0) + 1 FROM tab_comentarios);
    INSERT INTO tab_comentarios (id_comentario, product_id, id_usuario, id_orden, comentario, calificacion, usr_insert, fec_insert)
    VALUES (v_id_comentario, wid_producto, wid_usuario, wid_orden, trim(wcomentario), wcalificacion, wusr_operacion, NOW());

    IF FOUND THEN
        RETURN 'Comentario insertado correctamente';
    ELSE
        RETURN 'Error al insertar el comentario';
    END IF;
EXCEPTION
    WHEN foreign_key_violation THEN
        RETURN 'Error: Referencia a producto o usuario inexistente';
    WHEN unique_violation THEN
        RETURN 'Error: Ya existe una reseña para este producto en esta orden';
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
