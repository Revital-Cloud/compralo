/*
 * Inserta una categoría en la tabla tab_categories (jerarquía por parent_id).
 * Genera slug único desde el nombre. parent_id NULL = raíz.
 */
CREATE OR REPLACE FUNCTION fun_insert_categoria(
    p_name VARCHAR,
    p_parent_id DECIMAL DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT TRUE,
    p_usr_operacion DECIMAL(10) DEFAULT NULL
) RETURNS VARCHAR AS $$
DECLARE
    v_id DECIMAL(10);
    v_slug VARCHAR;
    v_usr DECIMAL(10);
BEGIN
    IF p_name IS NULL OR trim(p_name) = '' OR length(trim(p_name)) < 2 THEN
        RETURN 'Error: El nombre es obligatorio y debe tener al menos 2 caracteres.';
    END IF;
    IF p_parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tab_categories WHERE id = p_parent_id) THEN
        RETURN 'Error: La categoría padre no existe.';
    END IF;
    v_usr := COALESCE(p_usr_operacion, 0);

    v_id := (SELECT COALESCE(MAX(id), 0) + 1 FROM tab_categories);
    v_slug := fun_generate_unique_slug(p_name, 'tab_categories', NULL);

    INSERT INTO tab_categories (id, name, slug, parent_id, is_active, usr_insert)
    VALUES (v_id, trim(p_name), v_slug, p_parent_id, COALESCE(p_is_active, TRUE), v_usr);

    IF FOUND THEN
        RETURN 'Categoría insertada correctamente. Id: ' || v_id;
    ELSE
        RETURN 'Error al insertar la categoría';
    END IF;
EXCEPTION
    WHEN unique_violation THEN
        RETURN 'Error: Slug duplicado.';
    WHEN foreign_key_violation THEN
        RETURN 'Error: Violación de integridad referencial.';
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
