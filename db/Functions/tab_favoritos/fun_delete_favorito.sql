/*
 * FUNCIÓN: fun_delete_favorito
 * 
 * DESCRIPCIÓN: Elimina un producto específico de la lista de favoritos de un usuario.
 *              Requiere la jerarquía completa del producto para eliminar el favorito exacto.
 * 
 * PARÁMETROS:
 *   - wid_usuario: ID del usuario (obligatorio)
 *   - wid_categoria_producto: ID de la categoría del producto (obligatorio)
 *   - wid_linea_producto: ID de la línea del producto (obligatorio)
 *   - wid_sublinea_producto: ID de la sublínea del producto (obligatorio)
 *   - wid_producto: ID del producto específico (obligatorio)
 *   - wusr_operacion: Usuario que realiza la operación (obligatorio)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar el usuario de operación para auditoría
 *   2. Eliminar favorito usando todos los identificadores
 *   3. Verificar si se eliminó algún registro
 *   4. Retornar mensaje de confirmación o error
 * 
 * NOTA: Eliminación física del registro, no lógica
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_delete_favorito(
    wid_usuario tab_favoritos.id_usuario%TYPE,
    wid_categoria_producto tab_favoritos.id_categoria_producto%TYPE,
    wid_linea_producto tab_favoritos.id_linea_producto%TYPE,
    wid_sublinea_producto tab_favoritos.id_sublinea_producto%TYPE,
    wid_producto tab_favoritos.id_producto%TYPE
) RETURNS VARCHAR AS
$$
    BEGIN

        -- ELIMINACIÓN: Remover favorito usando identificadores completos
        DELETE FROM tab_favoritos
            WHERE id_usuario = wid_usuario                          -- Usuario específico
            AND id_categoria_producto = wid_categoria_producto      -- Categoría del producto
            AND id_linea_producto = wid_linea_producto              -- Línea del producto
            AND id_sublinea_producto = wid_sublinea_producto        -- Sublínea del producto
            AND id_producto = wid_producto;                         -- Producto específico
            
        -- VERIFICACIÓN: Confirmar si se eliminó el favorito
        IF FOUND THEN
            RAISE NOTICE 'Favorito eliminado exitosamente por usuario %', wid_usuario;
            RETURN 'Favorito eliminado correctamente';
        ELSE
            RETURN 'Error: El favorito no existe o ya fue eliminado';
        END IF;
    END;
$$
LANGUAGE plpgsql; 
