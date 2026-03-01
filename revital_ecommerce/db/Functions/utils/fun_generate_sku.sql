/*
 * Genera un SKU único para una variante. Formato: SKU-<product_id>-<seq>.
 * p_product_id: producto; p_custom: si se pasa, se usa solo si no existe (validar longitud < 120).
 */
CREATE OR REPLACE FUNCTION fun_generate_sku(
    p_product_id DECIMAL,
    p_custom VARCHAR DEFAULT NULL
) RETURNS VARCHAR AS $$
DECLARE
    v_sku VARCHAR;
    v_seq INT;
BEGIN
    IF p_custom IS NOT NULL AND length(trim(p_custom)) > 0 AND length(trim(p_custom)) < 120 THEN
        IF NOT EXISTS (SELECT 1 FROM tab_product_variant_combinations WHERE sku = trim(p_custom)) THEN
            RETURN trim(p_custom);
        END IF;
    END IF;
    SELECT COUNT(1) + 1 INTO v_seq
    FROM tab_product_variant_combinations c
    JOIN tab_product_variant_groups g ON g.id = c.group_id
    WHERE g.product_id = p_product_id;
    v_sku := 'SKU-' || p_product_id || '-' || v_seq;
    IF length(v_sku) >= 120 THEN
        RAISE EXCEPTION 'SKU generado excede longitud permitida';
    END IF;
    RETURN v_sku;
END;
$$ LANGUAGE plpgsql;
