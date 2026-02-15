/*
 * Inserta una imagen en tab_product_images.
 * p_variant_id NULL = imagen del producto; p_variant_id NOT NULL = imagen de la variante.
 * Si is_main = TRUE: para producto (variant_id NULL) quita is_main de otras del mismo producto con variant_id NULL;
 * para variante quita is_main de otras de la misma variante.
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
    v_id DECIMAL(10);
    v_usr DECIMAL(10);
    v_variant_product_id DECIMAL(10);
BEGIN
    v_usr := COALESCE(p_usr_operacion, 0);
    IF p_product_id IS NULL OR NOT EXISTS (SELECT 1 FROM tab_products WHERE id = p_product_id) THEN
        RETURN 'Error: product_id obligatorio y debe existir.';
    END IF;
    IF p_image_url IS NULL OR trim(p_image_url) = '' THEN
        RETURN 'Error: image_url obligatorio.';
    END IF;
    IF p_variant_id IS NOT NULL THEN
        SELECT product_id INTO v_variant_product_id FROM tab_product_variants WHERE id = p_variant_id LIMIT 1;
        IF v_variant_product_id IS NULL THEN
            RETURN 'Error: variant_id no existe.';
        END IF;
        IF v_variant_product_id != p_product_id THEN
            RETURN 'Error: la variante no pertenece al producto.';
        END IF;
    END IF;
    v_id := (SELECT COALESCE(MAX(id), 0) + 1 FROM tab_product_images);
    IF p_is_main THEN
        IF p_variant_id IS NULL THEN
            UPDATE tab_product_images SET is_main = FALSE, usr_update = v_usr, fec_update = CURRENT_TIMESTAMP
            WHERE product_id = p_product_id AND variant_id IS NULL;
        ELSE
            UPDATE tab_product_images SET is_main = FALSE, usr_update = v_usr, fec_update = CURRENT_TIMESTAMP
            WHERE variant_id = p_variant_id;
        END IF;
    END IF;
    INSERT INTO tab_product_images (id, product_id, image_url, is_main, sort_order, usr_insert, variant_id)
    VALUES (v_id, p_product_id, trim(p_image_url), COALESCE(p_is_main, FALSE), COALESCE(p_sort_order, 0), v_usr, p_variant_id);
    RETURN 'OK:' || v_id;
EXCEPTION
    WHEN OTHERS THEN RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
