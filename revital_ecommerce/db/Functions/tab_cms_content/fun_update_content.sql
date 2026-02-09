/*
 * FUNCIÓN: fun_update_content
 * 
 * DESCRIPCIÓN: Actualiza el contenido existente en el sistema CMS.
 *              Permite modificar descripción, versión y estado de publicación.
 * 
 * PARÁMETROS:
 *   - wnom_cms_content: Nombre del contenido a actualizar (obligatorio, identificador único)
 *   - wdes_cms_content: Nueva descripción del contenido (opcional)
 *   - wnum_version: Nuevo número de versión (opcional)
 *   - wind_publicado: Nuevo estado de publicación (opcional, boolean)
 *   - wusr_operacion: Usuario que realiza la operación (obligatorio)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar nombre del contenido
 *   2. Validar usuario operación para auditoría
 *   3. Actualizar contenido por nombre
 *   4. Confirmar éxito de la actualización
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_update_content(
    wnom_cms_content tab_cms_content.nom_cms_content%TYPE,
    wdes_cms_content tab_cms_content.des_cms_content%TYPE,
    wnum_version tab_cms_content.num_version%TYPE,
    wind_publicado tab_cms_content.ind_publicado%TYPE,
    wusr_operacion tab_cms_content.usr_update%TYPE
)
RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: Nombre del contenido
        IF wnom_cms_content IS NULL OR wnom_cms_content = '' THEN
            RETURN 'Error: El nombre del contenido es obligatorio para la actualización.';
        END IF;

        -- VALIDACIÓN 2: Usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion = '' THEN
            RETURN 'Error: El usuario que realiza la operación es obligatorio para auditoría.';
        END IF;

        -- ACTUALIZACIÓN: Modificar contenido CMS existente
        UPDATE tab_cms_content SET 
            des_cms_content = wdes_cms_content,     -- Nueva descripción
            num_version = wnum_version,             -- Nuevo número de versión
            ind_publicado = wind_publicado,         -- Nuevo estado de publicación
            usr_update = wusr_operacion,            -- Usuario que actualiza
            fec_update = NOW()                      -- Timestamp de actualización
        WHERE nom_cms_content = wnom_cms_content;
        
        -- VERIFICACIÓN: Confirmar que la actualización fue exitosa
        IF FOUND THEN
            RETURN 'Contenido CMS actualizado correctamente';
        ELSE
            RETURN 'Error: Contenido no encontrado o no se pudo actualizar';
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