/*
 * Inserta un grupo de variante visual (ej. Color = Negro).
 * Un grupo = una galería de imágenes.
 */
CREATE OR REPLACE FUNCTION fun_insert_variant_group(
    p_product_id DECIMAL,
    p_dominant_attribute VARCHAR,
    p_dominant_value VARCHAR,
    p_is_active BOOLEAN DEFAULT TRUE
) RETURNS VARCHAR AS $$
DECLARE
    v_id BIGINT;
BEGIN
    IF p_product_id IS NULL OR NOT EXISTS (SELECT 1 FROM tab_products WHERE id = p_product_id) THEN
        RETURN 'Error: product_id obligatorio y debe existir.';
    END IF;
    IF trim(p_dominant_attribute) = '' OR trim(p_dominant_value) = '' THEN
        RETURN 'Error: dominant_attribute y dominant_value obligatorios.';
    END IF;
    INSERT INTO tab_product_variant_groups (product_id, dominant_attribute, dominant_value, is_active, usr_insert, fec_insert)
    VALUES (p_product_id, trim(p_dominant_attribute), trim(p_dominant_value), COALESCE(p_is_active, TRUE), 0, NOW())
    ON CONFLICT (product_id, dominant_value) DO UPDATE SET
        is_active = EXCLUDED.is_active,
        fec_update = NOW()
    RETURNING id INTO v_id;
    RETURN 'OK:' || v_id;
EXCEPTION
    WHEN OTHERS THEN RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
