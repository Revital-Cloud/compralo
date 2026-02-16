/*
 * Inserta una imagen en un grupo de variante (tab_product_variant_images).
 * is_primary: si TRUE, se puede desmarcar is_primary en otras del mismo grupo.
 */
CREATE OR REPLACE FUNCTION fun_insert_variant_group_image(
    p_variant_group_id BIGINT,
    p_image_url VARCHAR,
    p_is_primary BOOLEAN DEFAULT FALSE,
    p_sort_order INT DEFAULT 0
) RETURNS VARCHAR AS $$
DECLARE
    v_id BIGINT;
BEGIN
    IF p_variant_group_id IS NULL OR NOT EXISTS (SELECT 1 FROM tab_product_variant_groups WHERE id = p_variant_group_id) THEN
        RETURN 'Error: variant_group_id obligatorio y debe existir.';
    END IF;
    IF p_image_url IS NULL OR trim(p_image_url) = '' THEN
        RETURN 'Error: image_url obligatorio.';
    END IF;
    IF p_is_primary THEN
        UPDATE tab_product_variant_images SET is_primary = FALSE WHERE variant_group_id = p_variant_group_id;
    END IF;
    INSERT INTO tab_product_variant_images (variant_group_id, image_url, is_primary, sort_order, usr_insert, fec_insert)
    VALUES (p_variant_group_id, trim(p_image_url), COALESCE(p_is_primary, FALSE), COALESCE(p_sort_order, 0), 0, NOW())
    RETURNING id INTO v_id;
    RETURN 'OK:' || v_id;
EXCEPTION
    WHEN OTHERS THEN RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
