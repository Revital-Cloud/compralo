/*
 * FUNCIÓN: fun_deactivate_comentarios
 * 
 * DESCRIPCIÓN: Desactiva lógicamente un comentario específico
 * 
 * PARÁMETROS:
 *   - wid_categoria: ID de la categoría del producto
 *   - wid_linea: ID de la línea del producto
 *   - wid_sublinea: ID de la sublínea del producto
 *   - wid_producto: ID del producto
 *   - wid_comentario: ID del comentario a desactivar
 *   - wusr_operacion: Usuario que realiza la operación
 *
 * RETORNA: VARCHAR - Mensaje indicando éxito o error
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_deactivate_comentarios(
    wid_categoria tab_comentarios.id_categoria%TYPE,
    wid_linea tab_comentarios.id_linea%TYPE,
    wid_sublinea tab_comentarios.id_sublinea%TYPE,
    wid_producto tab_comentarios.id_producto%TYPE,
    wid_usuario tab_comentarios.id_usuario%TYPE,
    wid_comentario tab_comentarios.id_comentario%TYPE,
    wusr_operacion tab_comentarios.usr_update%TYPE
) RETURNS VARCHAR AS $$
BEGIN
    -- VALIDACIÓN 1: Usuario operación para auditoría
    IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
        RETURN 'Error: El usuario que realiza la operación es obligatorio para auditoría';
    END IF;

    -- VALIDACIÓN 2: Validar IDs obligatorios
    IF wid_categoria IS NULL OR wid_categoria <= 0 THEN
        RETURN 'Error: El ID de categoría es obligatorio y debe ser mayor a 0';
    END IF;

    IF wid_linea IS NULL OR wid_linea <= 0 THEN
        RETURN 'Error: El ID de línea es obligatorio y debe ser mayor a 0';
    END IF;

    IF wid_sublinea IS NULL OR wid_sublinea <= 0 THEN
        RETURN 'Error: El ID de sublínea es obligatorio y debe ser mayor a 0';
    END IF;

    IF wid_producto IS NULL OR wid_producto <= 0 THEN
        RETURN 'Error: El ID de producto es obligatorio y debe ser mayor a 0';
    END IF;

    IF wid_usuario IS NULL OR wid_usuario <= 0 THEN
        RETURN 'Error: El ID de usuario es obligatorio y debe ser mayor a 0';
    END IF;

    IF wid_comentario IS NULL OR wid_comentario <= 0 THEN
        RETURN 'Error: El ID de comentarios es obligatorio y debe ser mayor a 0';
    END IF;


    -- OPERACIÓN: Desactivar el comentario
    UPDATE tab_comentarios SET 
        ind_activo = FALSE,
        usr_update = wusr_operacion,
        fec_update = NOW()
    WHERE id_categoria = wid_categoria 
    AND id_linea = wid_linea 
    AND id_sublinea = wid_sublinea 
    AND id_producto = wid_producto 
    AND id_usuario = wid_usuario
    AND id_comentario = wid_comentario
    AND ind_activo = TRUE;

    -- VERIFICACIÓN: Confirmar que la actualización fue exitosa
    IF FOUND THEN
        RAISE NOTICE 'Comentario desactivado exitosamente - ID: %', wid_comentario;
        RETURN 'Comentario desactivado correctamente';
    ELSE
        RETURN 'Error: No se encontró el comentario activo especificado';
    END IF;

-- MANEJO DE ERRORES
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error inesperado al desactivar comentario: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;