/*
 * Desactiva lógicamente un comentario. Identificado por id_comentario, product_id y usuario.
 */
CREATE OR REPLACE FUNCTION fun_deactivate_comentarios(
    wid_producto tab_comentarios.product_id%TYPE,
    wid_usuario tab_comentarios.id_usuario%TYPE,
    wid_comentario tab_comentarios.id_comentario%TYPE,
    wusr_operacion tab_comentarios.usr_update%TYPE
) RETURNS VARCHAR AS $$
BEGIN
    IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
        RETURN 'Error: El usuario de operación es obligatorio';
    END IF;
    IF wid_producto IS NULL OR wid_producto <= 0 THEN
        RETURN 'Error: El product_id es obligatorio';
    END IF;
    IF wid_usuario IS NULL OR wid_usuario <= 0 THEN
        RETURN 'Error: El ID de usuario es obligatorio';
    END IF;
    IF wid_comentario IS NULL OR wid_comentario <= 0 THEN
        RETURN 'Error: El ID de comentario es obligatorio';
    END IF;

    UPDATE tab_comentarios SET
        ind_activo = FALSE,
        usr_update = wusr_operacion,
        fec_update = NOW()
    WHERE product_id = wid_producto
      AND id_usuario = wid_usuario
      AND id_comentario = wid_comentario
      AND ind_activo = TRUE;

    IF FOUND THEN
        RETURN 'Comentario desactivado correctamente';
    ELSE
        RETURN 'Error: No se encontró el comentario activo especificado';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
