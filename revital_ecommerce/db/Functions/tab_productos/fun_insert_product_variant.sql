/*
 * Inserta una variante en tab_product_variants. SKU: p_sku opcional; si NULL o vacío se autogenera.
 * Color y talla se gestionan por tab_product_variant_attributes (atributos de la variante).
 */
CREATE OR REPLACE FUNCTION fun_insert_product_variant(
    p_product_id DECIMAL,
    p_price DECIMAL(12,2),
    p_stock INT DEFAULT 0,
    p_sku VARCHAR DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT TRUE,
    p_usr_operacion DECIMAL(10) DEFAULT NULL
) RETURNS VARCHAR AS $$
DECLARE
    v_id DECIMAL(10);
    v_sku VARCHAR;
    v_usr DECIMAL(10);
BEGIN
    v_usr := COALESCE(p_usr_operacion, 0);
    IF p_product_id IS NULL OR NOT EXISTS (SELECT 1 FROM tab_products WHERE id = p_product_id) THEN
        RETURN 'Error: product_id obligatorio y debe existir.';
    END IF;
    IF p_price IS NULL OR p_price < 0 THEN
        RETURN 'Error: price obligatorio y >= 0.';
    END IF;
    IF p_stock IS NULL OR p_stock < 0 THEN
        RETURN 'Error: stock debe ser >= 0.';
    END IF;

    v_sku := fun_generate_sku(p_product_id, nullif(trim(p_sku), ''));
    IF length(v_sku) >= 120 THEN
        RETURN 'Error: SKU no debe superar 119 caracteres.';
    END IF;

    v_id := (SELECT COALESCE(MAX(id), 0) + 1 FROM tab_product_variants);
    INSERT INTO tab_product_variants (id, product_id, sku, price, stock, is_active, usr_insert)
    VALUES (v_id, p_product_id, v_sku, p_price, p_stock, COALESCE(p_is_active, TRUE), v_usr);

    RETURN 'OK:' || v_id;
EXCEPTION
    WHEN unique_violation THEN RETURN 'Error: SKU duplicado.';
    WHEN OTHERS THEN RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
