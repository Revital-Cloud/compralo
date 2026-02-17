/*
 * Inserta una combinación vendible (stock, SKU, atributos no dominantes en JSONB).
 * id: se asigna con COALESCE(MAX(id),0)+1 a nivel global para mantener compatibilidad con carrito/órdenes.
 */
CREATE OR REPLACE FUNCTION fun_insert_variant_combination(
    p_group_id BIGINT,
    p_sku VARCHAR DEFAULT NULL,
    p_price DECIMAL(12,2) DEFAULT 0,
    p_stock INT DEFAULT 0,
    p_attributes JSONB DEFAULT '{}',
    p_is_active BOOLEAN DEFAULT TRUE,
    p_tipo_clasificacion VARCHAR DEFAULT NULL
) RETURNS VARCHAR AS $$
DECLARE
    v_id DECIMAL(10);
    v_sku VARCHAR;
    v_product_id DECIMAL(10);
BEGIN
    IF p_group_id IS NULL OR NOT EXISTS (SELECT 1 FROM tab_product_variant_groups WHERE id = p_group_id) THEN
        RETURN 'Error: group_id obligatorio y debe existir.';
    END IF;
    SELECT product_id INTO v_product_id FROM tab_product_variant_groups WHERE id = p_group_id LIMIT 1;
    IF p_price IS NULL OR p_price < 0 THEN
        RETURN 'Error: price obligatorio y >= 0.';
    END IF;
    IF p_stock IS NULL OR p_stock < 0 THEN
        RETURN 'Error: stock debe ser >= 0.';
    END IF;
    v_sku := fun_generate_sku(v_product_id, nullif(trim(p_sku), ''));
    IF length(v_sku) >= 120 THEN
        RETURN 'Error: SKU no debe superar 119 caracteres.';
    END IF;
    v_id := (SELECT COALESCE(MAX(id), 0) + 1 FROM tab_product_variant_combinations);
    INSERT INTO tab_product_variant_combinations (id, group_id, sku, price, stock, attributes, is_active, tipo_clasificacion, usr_insert, fec_insert)
    VALUES (v_id, p_group_id, v_sku, p_price, COALESCE(p_stock, 0), COALESCE(p_attributes, '{}'::JSONB), COALESCE(p_is_active, TRUE), nullif(trim(p_tipo_clasificacion), ''), 0, NOW());
    RETURN 'OK:' || v_id;
EXCEPTION
    WHEN unique_violation THEN RETURN 'Error: SKU duplicado.';
    WHEN OTHERS THEN RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
