/*
 * FUNCIÓN: fun_get_content
 * 
 * DESCRIPCIÓN: Obtiene el contenido publicado del CMS por nombre.
 *              Solo retorna contenido que esté marcado como publicado.
 * 
 * PARÁMETROS:
 *   - wnom_cms_content: Nombre del contenido a obtener (obligatorio)
 * 
 * RETORNA: JSONB - Descripción del contenido en formato JSON, NULL si no existe o no está publicado
 * 
 * LÓGICA:
 *   1. Buscar contenido por nombre
 *   2. Filtrar solo contenido publicado
 *   3. Retornar descripción del contenido
 * 
 * NOTA: Solo retorna contenido con ind_publicado = true
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_get_content(
    wnom_cms_content tab_cms_content.nom_cms_content%TYPE
)
RETURNS JSONB AS $$
BEGIN
    -- CONSULTA: Obtener contenido publicado por nombre
    RETURN (
        SELECT des_cms_content                                      -- Descripción del contenido
        FROM tab_cms_content 
        WHERE nom_cms_content = wnom_cms_content                    -- Contenido específico por nombre
          AND ind_publicado = true                                  -- Solo contenido publicado
    );
END;
$$ LANGUAGE plpgsql;