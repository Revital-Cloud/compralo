/*
 * Devuelve categorías en estructura de árbol (lista plana con parent_id y level).
 * p_root_id NULL = todas; si se pasa un id, solo esa categoría y sus descendientes.
 * p_active_only: si TRUE, solo is_active = TRUE.
 */
CREATE OR REPLACE FUNCTION fun_get_categories_tree(
    p_root_id DECIMAL DEFAULT NULL,
    p_active_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id DECIMAL,
    name VARCHAR,
    slug VARCHAR,
    parent_id DECIMAL,
    is_active BOOLEAN,
    level INT,
    path_ids DECIMAL[]
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE tree AS (
        SELECT c.id, c.name, c.slug, c.parent_id, c.is_active,
               0 AS level,
               ARRAY[c.id]::DECIMAL[] AS path_ids
        FROM tab_categories c
        WHERE (p_root_id IS NULL AND c.parent_id IS NULL)
           OR (p_root_id IS NOT NULL AND c.id = p_root_id)
        AND (NOT p_active_only OR c.is_active = TRUE)
        UNION ALL
        SELECT c.id, c.name, c.slug, c.parent_id, c.is_active,
               t.level + 1,
               t.path_ids || c.id
        FROM tab_categories c
        INNER JOIN tree t ON c.parent_id = t.id
        WHERE (NOT p_active_only OR c.is_active = TRUE)
    )
    SELECT t.id, t.name, t.slug, t.parent_id, t.is_active, t.level, t.path_ids
    FROM tree t
    ORDER BY t.path_ids;
END;
$$ LANGUAGE plpgsql;
