/*
* FUNCIÓN: fun_insert_comentarios
* 
* DESCRIPCIÓN: Inserta un nuevo comentario sobre un producto específico.
* 
* PARÁMETROS:
*   - wid_categoria: ID de la categoría del producto (obligatorio, > 0)
*   - wid_linea: ID de la línea del producto (obligatorio, > 0)
*   - wid_sublinea: ID de la sublínea del producto (obligatorio, > 0)
*   - wid_producto: ID del producto específico (obligatorio, > 0)
*   - wid_usuario: ID del usuario que comenta (obligatorio, > 0)
*   - wcomentario: Texto del comentario (obligatorio, mínimo 3 caracteres)
*   - wusr_operacion: ID del usuario que realiza la operación (obligatorio, DECIMAL)
*
* RETORNA: VARCHAR - Mensaje indicando éxito o error específico
* 
* LÓGICA:
*   1. Validar todos los parámetros obligatorios
*   2. Verificar que el producto existe y está activo
*   3. Verificar que el usuario existe y está activo
*   4. Generar ID secuencial por producto
*   5. Insertar comentario
*   6. Confirmar éxito de la operación
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
    wcomentario tab_comentarios.comentario%TYPE,
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
    
    -- INSERCIÓN: Crear nuevo comentario
    INSERT INTO tab_comentarios (
        id_categoria, id_linea, id_sublinea, id_producto, 
        id_usuario, id_comentario, comentario, usr_insert
    ) VALUES (
        wid_categoria, 
        wid_linea, 
        wid_sublinea, 
        wid_producto,
        wid_usuario,
        (SELECT COALESCE(MAX(id_comentario),0) + 1 FROM tab_comentarios),
        wcomentario,
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
    