/*
 * Inserta una imagen usando el modelo variant_groups + tab_product_variant_images.
 * p_variant_id NULL = imagen del producto (grupo "Sin color"); p_variant_id NOT NULL = grupo de esa combinación.
 */
CREATE OR REPLACE FUNCTION fun_insert_product_image(
    p_product_id DECIMAL,
    p_image_url VARCHAR,
    p_is_main BOOLEAN DEFAULT FALSE,
    p_sort_order INT DEFAULT 0,
    p_usr_operacion DECIMAL(10) DEFAULT NULL,
    p_variant_id DECIMAL DEFAULT NULL
) RETURNS VARCHAR AS $$
DECLARE
    v_id BIGINT;
    v_group_id BIGINT;
BEGIN
    IF p_product_id IS NULL OR NOT EXISTS (SELECT 1 FROM tab_products WHERE id = p_product_id) THEN
        RETURN 'Error: product_id obligatorio y debe existir.';
    END IF;
    IF p_image_url IS NULL OR trim(p_image_url) = '' THEN
        RETURN 'Error: image_url obligatorio.';
    END IF;

    IF p_variant_id IS NOT NULL THEN
        SELECT group_id INTO v_group_id FROM tab_product_variant_combinations WHERE id = p_variant_id LIMIT 1;
        IF v_group_id IS NULL THEN
            RETURN 'Error: variant_id (combination) no existe.';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM tab_product_variant_groups WHERE id = v_group_id AND product_id = p_product_id) THEN
            RETURN 'Error: la combinación no pertenece al producto.';
        END IF;
    ELSE
        SELECT id INTO v_group_id FROM tab_product_variant_groups WHERE product_id = p_product_id AND dominant_value = 'Sin color' LIMIT 1;
        IF v_group_id IS NULL THEN
            INSERT INTO tab_product_variant_groups (product_id, dominant_attribute, dominant_value, is_active, usr_insert, fec_insert)
            VALUES (p_product_id, 'color', 'Sin color', TRUE, COALESCE(p_usr_operacion, 0), NOW())
            RETURNING id INTO v_group_id;
        END IF;
    END IF;

    IF p_is_main THEN
        UPDATE tab_product_variant_images SET is_primary = FALSE WHERE variant_group_id = v_group_id;
    END IF;

    INSERT INTO tab_product_variant_images (variant_group_id, image_url, is_primary, sort_order, usr_insert, fec_insert)
    VALUES (v_group_id, trim(p_image_url), COALESCE(p_is_main, FALSE), COALESCE(p_sort_order, 0), COALESCE(p_usr_operacion, 0), NOW())
    RETURNING id INTO v_id;
    RETURN 'OK:' || v_id;
EXCEPTION
    WHEN OTHERS THEN RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
