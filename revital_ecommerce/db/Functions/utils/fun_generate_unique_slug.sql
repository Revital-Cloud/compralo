/*
 * Genera un slug único a partir de un nombre.
 * Uso: categorías y productos. p_table = 'tab_categories' o 'tab_products'.
 * p_exclude_id: al actualizar, excluir ese id del chequeo de unicidad.
 */
CREATE OR REPLACE FUNCTION fun_generate_unique_slug(
    p_name TEXT,
    p_table TEXT,
    p_exclude_id DECIMAL DEFAULT NULL
) RETURNS VARCHAR AS $$
DECLARE
    base VARCHAR;
    candidate VARCHAR;
    i INT := 0;
    found BOOLEAN;
BEGIN
    IF p_name IS NULL OR trim(p_name) = '' THEN
        RETURN 'item';
    END IF;
    base := lower(trim(p_name));
    base := translate(base, 'áéíóúñüàèìòùäëïöüÁÉÍÓÚÑÜÀÈÌÒÙÄËÏÖÜ', 'aeiounuaeiouaeiouAEIOUNUAEIOUAEIOU');
    base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
    base := trim(both '-' from base);
    IF base = '' THEN
        base := 'item';
    END IF;
    candidate := base;
    LOOP
        IF p_table = 'tab_categories' THEN
            SELECT EXISTS(SELECT 1 FROM tab_categories WHERE slug = candidate AND (p_exclude_id IS NULL OR id != p_exclude_id)) INTO found;
        ELSIF p_table = 'tab_products' THEN
            SELECT EXISTS(SELECT 1 FROM tab_products WHERE slug = candidate AND (p_exclude_id IS NULL OR id != p_exclude_id)) INTO found;
        ELSE
            RAISE EXCEPTION 'fun_generate_unique_slug: tabla no soportada %', p_table;
        END IF;
        IF NOT found THEN
            RETURN candidate;
        END IF;
        i := i + 1;
        candidate := base || '-' || i;
        IF i > 9999 THEN
            RAISE EXCEPTION 'fun_generate_unique_slug: no se pudo generar slug único';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
