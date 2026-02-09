/*
 * FUNCIÓN: fun_insert_content
 * 
 * DESCRIPCIÓN: Inserta nuevo contenido en el sistema de gestión de contenidos (CMS).
 *              Permite crear contenido con versionado y control de publicación.
 * 
 * PARÁMETROS:
 *   - wnom_cms_content: Nombre del contenido (obligatorio, no vacío)
 *   - wdes_cms_content: Descripción del contenido (opcional)
 *   - wnum_version: Número de versión del contenido (opcional)
 *   - wind_publicado: Indicador si está publicado (opcional, boolean)
 *   - wusr_operacion: Usuario que realiza la operación (obligatorio, no vacío)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar nombre del contenido
 *   2. Validar usuario operación para auditoría
 *   3. Insertar contenido CMS
 *   4. Confirmar éxito de la inserción
 * 
 * MANEJO DE ERRORES:
 *   - 23502: Campos obligatorios faltantes
 *   - Realiza ROLLBACK en caso de error
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_insert_content(
    wnom_cms_content tab_cms_content.nom_cms_content%TYPE,
    wdes_cms_content tab_cms_content.des_cms_content%TYPE,
    wnum_version tab_cms_content.num_version%TYPE,
    wind_publicado tab_cms_content.ind_publicado%TYPE,
    wusr_operacion tab_cms_content.usr_insert%TYPE
)
RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: Nombre del contenido
        IF wnom_cms_content IS NULL OR wnom_cms_content = '' THEN
            RETURN 'Error: El nombre del contenido es obligatorio y no puede estar vacío.';
        END IF;

        -- VALIDACIÓN 2: Usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion = '' THEN
            RETURN 'Error: El usuario que realiza la operación es obligatorio para auditoría.';
        END IF;

        -- INSERCIÓN: Crear contenido CMS
        INSERT INTO tab_cms_content (
            nom_cms_content,            -- Nombre del contenido
            des_cms_content,            -- Descripción del contenido
            num_version,                -- Número de versión
            ind_publicado,              -- Indicador de publicación
            usr_insert                  -- Usuario que realiza la inserción
        )
        VALUES (wnom_cms_content, wdes_cms_content, wnum_version, wind_publicado, wusr_operacion);

        -- VERIFICACIÓN: Confirmar éxito de la inserción
        IF FOUND THEN
            RETURN 'Contenido CMS insertado correctamente';
        ELSE
            RETURN 'Error al insertar el contenido CMS';
        END IF;

    -- MANEJO DE ERRORES: Capturar excepciones específicas
    EXCEPTION
        WHEN SQLSTATE '23502' THEN
            RETURN 'Error: Faltan campos obligatorios del contenido.';
        WHEN OTHERS THEN
            RETURN 'Error inesperado: ' || SQLERRM;
            ROLLBACK;
    END;
$$
LANGUAGE plpgsql;