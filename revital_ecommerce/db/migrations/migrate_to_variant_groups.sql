/*
 * Migración: modelo plano (tab_product_variants + tab_product_images)
 * → modelo profesional (tab_product_variant_groups + tab_product_variant_combinations + tab_product_variant_images).
 *
 * Paso 0 — SEGURIDAD
 * ------------------
 * RECOMENDACIÓN: Ejecutar backup de la base de datos antes de correr este script.
 *   pg_dump -U usuario -d nombre_bd -F c -f backup_antes_variant_groups.dump
 *
 * Este script:
 * - Crea las nuevas tablas (groups, combinations, images).
 * - Migra datos usando dominant_attribute = 'color'.
 * - Reasigna FKs de carrito, órdenes, movimientos y órdenes de compra a tab_product_variant_combinations.
 * - Al final hace DROP de tab_product_variant_attributes, tab_product_images, tab_product_variants.
 */

-- =============================================================================
-- Paso 1 — Crear nuevas tablas
-- =============================================================================

CREATE TABLE IF NOT EXISTS tab_product_variant_groups (
    id              BIGSERIAL PRIMARY KEY,
    product_id      DECIMAL(10) NOT NULL REFERENCES tab_products(id) ON DELETE CASCADE,
    dominant_attribute VARCHAR(100) NOT NULL,
    dominant_value  VARCHAR(255) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    usr_insert      DECIMAL(10) NOT NULL DEFAULT 0,
    fec_insert      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update      DECIMAL(10),
    fec_update      TIMESTAMP WITHOUT TIME ZONE,
    UNIQUE (product_id, dominant_value)
);

CREATE TABLE IF NOT EXISTS tab_product_variant_combinations (
    id              DECIMAL(10) PRIMARY KEY,
    group_id        BIGINT NOT NULL REFERENCES tab_product_variant_groups(id) ON DELETE CASCADE,
    sku             VARCHAR(120) NOT NULL UNIQUE,
    price           DECIMAL(12,2) NOT NULL CHECK (price >= 0),
    stock           INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    attributes      JSONB NOT NULL DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    usr_insert      DECIMAL(10) NOT NULL DEFAULT 0,
    fec_insert      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update      DECIMAL(10),
    fec_update      TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS tab_product_variant_images (
    id              BIGSERIAL PRIMARY KEY,
    variant_group_id BIGINT NOT NULL REFERENCES tab_product_variant_groups(id) ON DELETE CASCADE,
    image_url       VARCHAR NOT NULL,
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order      INT NOT NULL DEFAULT 0,
    usr_insert      DECIMAL(10) NOT NULL DEFAULT 0,
    fec_insert      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update      DECIMAL(10),
    fec_update      TIMESTAMP WITHOUT TIME ZONE
);

COMMENT ON TABLE tab_product_variant_groups IS 'Variante visual (ej. Color). Un grupo = una galería de imágenes.';
COMMENT ON TABLE tab_product_variant_combinations IS 'Combinaciones vendibles (stock, SKU, atributos no dominantes en JSONB).';
COMMENT ON TABLE tab_product_variant_images IS 'Imágenes por grupo; no se repiten por talla.';

-- =============================================================================
-- Paso 2 — Detectar atributo dominante (para esta migración: 'color')
-- =============================================================================
-- Se usa en los siguientes pasos: agrupamos variantes por (product_id, valor del atributo 'color').
-- El valor se obtiene de tab_product_variant_attributes + tab_attributes (name ILIKE 'color')
-- y tab_attribute_values.value o value_text.

-- =============================================================================
-- Paso 3 — Crear grupos (DISTINCT product_id, color)
-- =============================================================================

INSERT INTO tab_product_variant_groups (product_id, dominant_attribute, dominant_value, is_active, usr_insert, fec_insert)
SELECT DISTINCT
    pv.product_id,
    'color'::VARCHAR AS dominant_attribute,
    COALESCE(
        (SELECT TRIM(COALESCE(av.value, pva.value_text::TEXT))
         FROM tab_product_variant_attributes pva
         JOIN tab_attributes a ON a.id = pva.attribute_id AND LOWER(TRIM(a.name)) = 'color'
         LEFT JOIN tab_attribute_values av ON av.id = pva.attribute_value_id
         WHERE pva.variant_id = pv.id
         LIMIT 1),
        'Sin color'
    ) AS dominant_value,
    TRUE AS is_active,
    0 AS usr_insert, NOW() AS fec_insert
FROM tab_product_variants pv
WHERE EXISTS (
    SELECT 1 FROM tab_product_variant_attributes pva
    JOIN tab_attributes a ON a.id = pva.attribute_id AND LOWER(TRIM(a.name)) = 'color'
    WHERE pva.variant_id = pv.id
)
ON CONFLICT (product_id, dominant_value) DO NOTHING;

-- Productos con variantes pero sin atributo 'color': crear un solo grupo por producto con valor por defecto
INSERT INTO tab_product_variant_groups (product_id, dominant_attribute, dominant_value, is_active, usr_insert, fec_insert)
SELECT pv.product_id, 'color'::VARCHAR, 'Sin color'::VARCHAR, TRUE, 0, NOW()
FROM tab_product_variants pv
WHERE NOT EXISTS (
    SELECT 1 FROM tab_product_variant_attributes pva
    JOIN tab_attributes a ON a.id = pva.attribute_id AND LOWER(TRIM(a.name)) = 'color'
    WHERE pva.variant_id = pv.id
)
ON CONFLICT (product_id, dominant_value) DO NOTHING;

-- Asegurar un grupo por cada producto que tenga variantes (por si no hubiera 'color')
INSERT INTO tab_product_variant_groups (product_id, dominant_attribute, dominant_value, is_active, usr_insert, fec_insert)
SELECT DISTINCT pv.product_id, 'color'::VARCHAR, 'Sin color'::VARCHAR, TRUE, 0, NOW()
FROM tab_product_variants pv
WHERE NOT EXISTS (SELECT 1 FROM tab_product_variant_groups g WHERE g.product_id = pv.product_id)
ON CONFLICT (product_id, dominant_value) DO NOTHING;

-- =============================================================================
-- Paso 4 — Columna temporal en tab_product_variants (variant_group_id)
-- No es necesaria si migramos en un solo script; usamos directamente el mapeo
-- product_id + color → group_id en el siguiente paso.
-- =============================================================================

-- (Omitido: mapeo se hace en memoria en Paso 5 vía CTE/subquery.)

-- =============================================================================
-- Paso 5 — Mapear variantes → grupo (match por product_id + color)
-- Paso 6 — Migrar combinaciones (cada fila tab_product_variants → tab_product_variant_combinations)
--          Guardando atributos NO dominantes en JSONB.
-- =============================================================================

INSERT INTO tab_product_variant_combinations (
    id,
    group_id,
    sku,
    price,
    stock,
    attributes,
    is_active,
    usr_insert,
    fec_insert,
    usr_update,
    fec_update
)
SELECT
    pv.id AS id,
    g.id AS group_id,
    pv.sku,
    pv.price,
    pv.stock,
    COALESCE(
        (
            SELECT jsonb_object_agg(LOWER(TRIM(a.name)), COALESCE(av.value, pva.value_text::TEXT))
            FROM tab_product_variant_attributes pva
            JOIN tab_attributes a ON a.id = pva.attribute_id
            LEFT JOIN tab_attribute_values av ON av.id = pva.attribute_value_id
            WHERE pva.variant_id = pv.id
              AND LOWER(TRIM(a.name)) <> 'color'
        ),
        '{}'::JSONB
    ) AS attributes,
    COALESCE(pv.is_active, TRUE) AS is_active,
    0 AS usr_insert,
    COALESCE(pv.fec_insert, NOW()) AS fec_insert,
    pv.usr_update AS usr_update,
    pv.fec_update AS fec_update
FROM tab_product_variants pv
JOIN tab_product_variant_groups g ON g.product_id = pv.product_id
AND g.dominant_value = COALESCE(
    (SELECT TRIM(COALESCE(av.value, pva.value_text::TEXT))
     FROM tab_product_variant_attributes pva
     JOIN tab_attributes a ON a.id = pva.attribute_id AND LOWER(TRIM(a.name)) = 'color'
     LEFT JOIN tab_attribute_values av ON av.id = pva.attribute_value_id
     WHERE pva.variant_id = pv.id
     LIMIT 1),
    'Sin color'
)
ON CONFLICT (id) DO NOTHING;

-- Variantes sin atributo color: asignar al grupo "Sin color" del mismo producto
INSERT INTO tab_product_variant_combinations (id, group_id, sku, price, stock, attributes, is_active, usr_insert, fec_insert, usr_update, fec_update)
SELECT
    pv.id,
    g.id,
    pv.sku,
    pv.price,
    pv.stock,
    (
        SELECT COALESCE(jsonb_object_agg(LOWER(TRIM(a.name)), COALESCE(av.value, pva.value_text::TEXT)), '{}'::JSONB)
        FROM tab_product_variant_attributes pva
        JOIN tab_attributes a ON a.id = pva.attribute_id
        LEFT JOIN tab_attribute_values av ON av.id = pva.attribute_value_id
        WHERE pva.variant_id = pv.id
    ),
    COALESCE(pv.is_active, TRUE),
    0,
    COALESCE(pv.fec_insert, NOW()),
    pv.usr_update,
    pv.fec_update
FROM tab_product_variants pv
JOIN tab_product_variant_groups g ON g.product_id = pv.product_id AND g.dominant_value = 'Sin color'
WHERE NOT EXISTS (SELECT 1 FROM tab_product_variant_combinations c WHERE c.id = pv.id)
  AND NOT EXISTS (
    SELECT 1 FROM tab_product_variant_attributes pva
    JOIN tab_attributes a ON a.id = pva.attribute_id AND LOWER(TRIM(a.name)) = 'color'
    WHERE pva.variant_id = pv.id
);

-- =============================================================================
-- Paso 7 — Migrar imágenes SIN duplicar (DISTINCT ON por grupo + image_url)
--          Mantener is_primary si existe.
-- =============================================================================

INSERT INTO tab_product_variant_images (variant_group_id, image_url, is_primary, sort_order, usr_insert, fec_insert)
SELECT DISTINCT ON (g.id, pi.image_url)
    g.id AS variant_group_id,
    pi.image_url,
    COALESCE(pi.is_main, FALSE) AS is_primary,
    COALESCE(pi.sort_order, 0) AS sort_order,
    0 AS usr_insert,
    NOW() AS fec_insert
FROM tab_product_images pi
JOIN tab_product_variants pv ON pv.id = pi.variant_id AND pi.variant_id IS NOT NULL
JOIN tab_product_variant_groups g ON g.product_id = pv.product_id
AND g.dominant_value = COALESCE(
    (SELECT TRIM(COALESCE(av.value, pva.value_text::TEXT))
     FROM tab_product_variant_attributes pva
     JOIN tab_attributes a ON a.id = pva.attribute_id AND LOWER(TRIM(a.name)) = 'color'
     LEFT JOIN tab_attribute_values av ON av.id = pva.attribute_value_id
     WHERE pva.variant_id = pv.id
     LIMIT 1),
    'Sin color'
)
ORDER BY g.id, pi.image_url, pi.is_main DESC NULLS LAST, pi.sort_order, pi.id;

-- Imágenes a nivel producto (variant_id IS NULL): asignar al primer grupo del producto
INSERT INTO tab_product_variant_images (variant_group_id, image_url, is_primary, sort_order, usr_insert, fec_insert)
SELECT
    (SELECT g.id FROM tab_product_variant_groups g WHERE g.product_id = pi.product_id ORDER BY g.id LIMIT 1),
    pi.image_url,
    COALESCE(pi.is_main, FALSE),
    COALESCE(pi.sort_order, 0),
    0,
    NOW()
FROM tab_product_images pi
WHERE pi.variant_id IS NULL;

-- (tab_product_variant_images no tiene UNIQUE en (variant_group_id, image_url); DISTINCT ON ya evita duplicados por fila.
-- Si la misma URL se inserta dos veces por el mismo grupo, dejamos una sola con la primera aparición.)
-- Eliminar duplicados por (variant_group_id, image_url) dejando una fila por par
DELETE FROM tab_product_variant_images a
USING tab_product_variant_images b
WHERE a.id > b.id
  AND a.variant_group_id = b.variant_group_id
  AND a.image_url = b.image_url;

-- =============================================================================
-- Paso 8 — Índices recomendados
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_tab_product_variant_groups_product_id
    ON tab_product_variant_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_tab_product_variant_groups_product_active
    ON tab_product_variant_groups(product_id, is_active);

CREATE INDEX IF NOT EXISTS idx_tab_product_variant_combinations_group_id
    ON tab_product_variant_combinations(group_id);
CREATE INDEX IF NOT EXISTS idx_tab_product_variant_combinations_group_active
    ON tab_product_variant_combinations(group_id, is_active);
-- UNIQUE sku ya existe en la definición de la tabla

CREATE INDEX IF NOT EXISTS idx_tab_product_variant_combinations_attributes_gin
    ON tab_product_variant_combinations USING GIN (attributes);

CREATE INDEX IF NOT EXISTS idx_tab_product_variant_images_variant_group_id
    ON tab_product_variant_images(variant_group_id);

-- =============================================================================
-- Reasignar FKs: tab_carrito_productos, tab_orden_productos, tab_movimientos_inventario,
--                tab_orden_compra_proveedor: variant_id debe apuntar a tab_product_variant_combinations
-- =============================================================================

-- Nombres de FK generados por PostgreSQL (tabla_columna_fkey)
ALTER TABLE tab_carrito_productos      DROP CONSTRAINT IF EXISTS tab_carrito_productos_variant_id_fkey;
ALTER TABLE tab_orden_productos        DROP CONSTRAINT IF EXISTS tab_orden_productos_variant_id_fkey;
ALTER TABLE tab_movimientos_inventario DROP CONSTRAINT IF EXISTS tab_movimientos_inventario_variant_id_fkey;
ALTER TABLE tab_orden_compra_proveedor DROP CONSTRAINT IF EXISTS tab_orden_compra_proveedor_variant_id_fkey;

ALTER TABLE tab_carrito_productos
    ADD CONSTRAINT tab_carrito_productos_variant_id_fkey
    FOREIGN KEY (variant_id) REFERENCES tab_product_variant_combinations(id);
ALTER TABLE tab_orden_productos
    ADD CONSTRAINT tab_orden_productos_variant_id_fkey
    FOREIGN KEY (variant_id) REFERENCES tab_product_variant_combinations(id);
ALTER TABLE tab_movimientos_inventario
    ADD CONSTRAINT tab_movimientos_inventario_variant_id_fkey
    FOREIGN KEY (variant_id) REFERENCES tab_product_variant_combinations(id);
ALTER TABLE tab_orden_compra_proveedor
    ADD CONSTRAINT tab_orden_compra_proveedor_variant_id_fkey
    FOREIGN KEY (variant_id) REFERENCES tab_product_variant_combinations(id);

-- =============================================================================
-- Paso 9 — Queries de verificación (ejecutar manualmente tras el script)
-- =============================================================================
/*
-- Conteo de grupos por producto
SELECT product_id, COUNT(*) AS num_groups
FROM tab_product_variant_groups
GROUP BY product_id;

-- Conteo de combinaciones
SELECT COUNT(*) AS total_combinations FROM tab_product_variant_combinations;
SELECT group_id, COUNT(*) AS combinations_per_group
FROM tab_product_variant_combinations
GROUP BY group_id;

-- Detección de imágenes duplicadas por grupo (debe ser 0)
SELECT variant_group_id, image_url, COUNT(*)
FROM tab_product_variant_images
GROUP BY variant_group_id, image_url
HAVING COUNT(*) > 1;

-- Validación de stock total por producto (comparar con tab_product_variants antes del DROP)
SELECT c.group_id, SUM(c.stock) AS total_stock
FROM tab_product_variant_combinations c
GROUP BY c.group_id;
*/

-- =============================================================================
-- Paso 10 — Limpieza final: eliminar tablas antiguas
-- =============================================================================

DROP TABLE IF EXISTS tab_product_variant_attributes;
DROP TABLE IF EXISTS tab_product_images;
DROP TABLE IF EXISTS tab_product_variants;

-- Actualizar fun_generate_sku para usar tab_product_variant_combinations (conteo por product_id vía group)
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
    SELECT COUNT(*) + 1 INTO v_seq
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

-- Funciones para el nuevo modelo (grupos, imágenes por grupo, combinaciones)
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

CREATE OR REPLACE FUNCTION fun_insert_variant_combination(
    p_group_id BIGINT,
    p_sku VARCHAR DEFAULT NULL,
    p_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    p_stock INT DEFAULT 0,
    p_attributes JSONB DEFAULT '{}',
    p_is_active BOOLEAN DEFAULT TRUE
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
    INSERT INTO tab_product_variant_combinations (id, group_id, sku, price, stock, attributes, is_active, usr_insert, fec_insert)
    VALUES (v_id, p_group_id, v_sku, p_price, COALESCE(p_stock, 0), COALESCE(p_attributes, '{}'::JSONB), COALESCE(p_is_active, TRUE), 0, NOW());
    RETURN 'OK:' || v_id;
EXCEPTION
    WHEN unique_violation THEN RETURN 'Error: SKU duplicado.';
    WHEN OTHERS THEN RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
