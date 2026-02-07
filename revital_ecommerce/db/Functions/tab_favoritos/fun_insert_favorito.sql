/*
 * FUNCIÓN: fun_insert_favorito
 * 
 * DESCRIPCIÓN: Agrega un producto a la lista de favoritos de un usuario específico.
 *              Utiliza la jerarquía completa de producto (categoría->línea->sublínea->producto).
 * 
 * PARÁMETROS:
 *   - wid_usuario: ID del usuario (obligatorio)
 *   - wid_categoria_producto: ID de la categoría del producto (obligatorio)
 *   - wid_linea_producto: ID de la línea del producto (obligatorio)
 *   - wid_sublinea_producto: ID de la sublínea del producto (obligatorio)
 *   - wid_producto: ID del producto específico (obligatorio)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar que todos los parámetros sean obligatorios
 *   2. Insertar producto en favoritos del usuario
 *   3. Manejar casos de duplicados y referencias inválidas
 * 
 * MANEJO DE ERRORES:
 *   - unique_violation: Producto ya está en favoritos
 *   - foreign_key_violation: Usuario o producto no existe
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_insert_favorito(
    wid_usuario 			tab_favoritos.id_usuario%TYPE,
    wid_categoria_producto tab_favoritos.id_categoria_producto%TYPE,
    wid_linea_producto 		tab_favoritos.id_linea_producto%TYPE,
    wid_sublinea_producto 	tab_favoritos.id_sublinea_producto%TYPE,
    wid_producto 			tab_favoritos.id_producto%TYPE,
    wusr_operacion          tab_favoritos.usr_insert%TYPE
) RETURNS VARCHAR AS
$$
BEGIN
    -- VALIDACIÓN 1: Verificar que todos los parámetros sean obligatorios
    IF wid_usuario IS NULL OR wid_categoria_producto IS NULL OR wid_linea_producto IS NULL OR wid_sublinea_producto IS NULL OR wid_producto IS NULL THEN
        RETURN 'Error: Todos los datos son obligatorios (usuario, categoría, línea, sublínea, producto).';
    END IF;
    
    BEGIN
        -- INSERCIÓN: Agregar producto a favoritos del usuario
        INSERT INTO tab_favoritos (
            id_usuario,                     -- ID del usuario
            id_categoria_producto,          -- ID de categoría del producto
            id_linea_producto,              -- ID de línea del producto
            id_sublinea_producto,           -- ID de sublínea del producto
            id_producto,                    -- ID del producto específico
            usr_insert                     -- Usuario que realiza la operación
        ) VALUES (
            wid_usuario, 
            wid_categoria_producto, 
            wid_linea_producto, 
            wid_sublinea_producto, 
            wid_producto,
            wusr_operacion
        );
        RETURN 'Favorito agregado correctamente';
        
    -- MANEJO DE ERRORES: Excepciones específicas
    EXCEPTION 
        WHEN unique_violation THEN
            RETURN 'Error: El producto ya está en favoritos del usuario.';
        WHEN foreign_key_violation THEN
            RETURN 'Error: Usuario o producto no existe en el sistema.';
    END;
END;
$$
LANGUAGE plpgsql;

select * from tab_favoritos;
Select fun_insert_favorito(1099735379,1,1,4,1);
