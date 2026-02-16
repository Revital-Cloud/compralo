-- Evitar filas duplicadas por (variant_group_id, image_url).
-- Al editar, si se usa la misma imagen (misma URL) no se crea otra fila.

-- 0) Normalizar URLs (quitar espacios) para que coincidan
UPDATE tab_product_variant_images SET image_url = trim(image_url) WHERE image_url <> trim(image_url);

-- 1) Eliminar duplicados dejando una fila por (variant_group_id, image_url) (la de menor id)
--    Usamos trim(image_url) por si quedaron diferencias por espacios
DELETE FROM tab_product_variant_images a
USING (
    SELECT variant_group_id, trim(image_url) AS url_trimmed, min(id) AS keep_id
    FROM tab_product_variant_images
    GROUP BY variant_group_id, trim(image_url)
) b
WHERE a.variant_group_id = b.variant_group_id
  AND trim(a.image_url) = b.url_trimmed
  AND a.id <> b.keep_id;

-- 2) Índice único para no permitir la misma URL dos veces en el mismo grupo
DROP INDEX IF EXISTS idx_tab_product_variant_images_group_url;
CREATE UNIQUE INDEX idx_tab_product_variant_images_group_url
ON tab_product_variant_images(variant_group_id, image_url);

-- 3) Función: si la URL ya existe en el grupo, actualizar sort_order/is_primary en vez de insertar otra fila
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
    ON CONFLICT (variant_group_id, image_url)
    DO UPDATE SET
        is_primary = EXCLUDED.is_primary,
        sort_order = EXCLUDED.sort_order,
        usr_update = 0,
        fec_update = NOW()
    RETURNING id INTO v_id;
    RETURN 'OK:' || v_id;
EXCEPTION
    WHEN OTHERS THEN RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
