/*
 * Actualiza un producto en la tabla products. Si cambia el nombre, se regenera el slug.
 */
CREATE OR REPLACE FUNCTION fun_update_producto(
    p_id DECIMAL,
    p_category_id DECIMAL DEFAULT NULL,
    p_name VARCHAR DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_id_marca DECIMAL DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL,
    p_usr_operacion DECIMAL(10) DEFAULT NULL,
    p_id_proveedor DECIMAL DEFAULT NULL
) RETURNS VARCHAR AS $$
DECLARE
    v_slug VARCHAR;
BEGIN
    IF p_id IS NULL OR NOT EXISTS (SELECT 1 FROM tab_products WHERE id = p_id) THEN
        RETURN 'Error: Producto no encontrado.';
    END IF;
    IF p_category_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tab_categories WHERE id = p_category_id) THEN
        RETURN 'Error: category_id no existe.';
    END IF;
    IF p_id_marca IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tab_marcas WHERE id_marca = p_id_marca) THEN
        RETURN 'Error: id_marca no existe.';
    END IF;
    IF p_id_proveedor IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tab_proveedores WHERE id_proveedor = p_id_proveedor) THEN
        RETURN 'Error: id_proveedor no existe.';
    END IF;
    IF p_name IS NOT NULL AND length(trim(p_name)) < 2 THEN
        RETURN 'Error: Nombre debe tener al menos 2 caracteres.';
    END IF;

    IF p_name IS NOT NULL THEN
        v_slug := fun_generate_unique_slug(trim(p_name), 'tab_products', p_id);
    ELSE
        SELECT slug INTO v_slug FROM tab_products WHERE id = p_id;
    END IF;

    UPDATE tab_products SET
        category_id = COALESCE(p_category_id, category_id),
        name = COALESCE(trim(p_name), name),
        slug = v_slug,
        description = CASE WHEN p_description IS NOT NULL THEN p_description ELSE description END,
        id_marca = CASE WHEN p_id_marca IS NOT NULL THEN p_id_marca ELSE id_marca END,
        is_active = COALESCE(p_is_active, is_active),
        usr_update = p_usr_operacion,
        fec_update = CURRENT_TIMESTAMP,
        id_proveedor = p_id_proveedor
    WHERE id = p_id;

    IF FOUND THEN RETURN 'Producto actualizado correctamente'; ELSE RETURN 'Error al actualizar'; END IF;
EXCEPTION
    WHEN unique_violation THEN RETURN 'Error: Slug duplicado.';
    WHEN OTHERS THEN RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
