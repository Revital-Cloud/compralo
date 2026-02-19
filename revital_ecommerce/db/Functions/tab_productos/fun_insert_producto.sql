/*
 * Inserta un producto en la tabla products (slug único generado desde nombre).
 * No inserta variantes ni imágenes; usar fun_insert_product_variant y fun_insert_product_image.
 */
CREATE OR REPLACE FUNCTION fun_insert_producto(
    p_category_id DECIMAL,
    p_name VARCHAR,
    p_description TEXT DEFAULT NULL,
    p_id_marca DECIMAL DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT TRUE,
    p_usr_operacion DECIMAL(10) DEFAULT NULL,
    p_id_proveedor DECIMAL DEFAULT NULL
) RETURNS VARCHAR AS $$
DECLARE
    v_id DECIMAL(10);
    v_slug VARCHAR;
    v_usr DECIMAL(10);
BEGIN
    v_usr := COALESCE(p_usr_operacion, 0);
    IF p_category_id IS NULL OR NOT EXISTS (SELECT 1 FROM tab_categories WHERE id = p_category_id) THEN
        RETURN 'Error: category_id obligatorio y debe existir.';
    END IF;
    IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
        RETURN 'Error: El nombre es obligatorio (mín. 2 caracteres).';
    END IF;
    IF p_id_marca IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tab_marcas WHERE id_marca = p_id_marca) THEN
        RETURN 'Error: id_marca no existe.';
    END IF;
    IF p_id_proveedor IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tab_proveedores WHERE id_proveedor = p_id_proveedor) THEN
        RETURN 'Error: id_proveedor no existe.';
    END IF;

    v_id := (SELECT COALESCE(MAX(id), 0) + 1 FROM tab_products);
    v_slug := fun_generate_unique_slug(p_name, 'tab_products', NULL);

    INSERT INTO tab_products (id, category_id, name, slug, description, id_marca, is_active, usr_insert, id_proveedor)
    VALUES (v_id, p_category_id, trim(p_name), v_slug, p_description, p_id_marca, COALESCE(p_is_active, TRUE), v_usr, p_id_proveedor);

    RETURN 'OK:' || v_id;
EXCEPTION
    WHEN unique_violation THEN RETURN 'Error: Slug duplicado.';
    WHEN OTHERS THEN RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
