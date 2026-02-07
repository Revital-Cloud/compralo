/*
 * FUNCIÓN: fun_delete_content
 * 
 * DESCRIPCIÓN: Elimina permanentemente contenido del sistema CMS.
 *              Realiza eliminación física del registro por nombre.
 * 
 * PARÁMETROS:
 *   - wnom_cms_content: Nombre del contenido a eliminar (obligatorio, usado como identificador)
 *   - wusr_operacion: Usuario que realiza la operación (obligatorio para auditoría)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar parámetros
 *   2. Eliminar contenido por nombre
 *   3. Confirmar éxito de la eliminación
 * 
 * NOTA: Eliminación física del registro, no lógica
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_delete_content(
    wnom_cms_content tab_cms_content.nom_cms_content%TYPE,
    wusr_operacion VARCHAR
)
RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: Nombre del contenido
        IF wnom_cms_content IS NULL OR wnom_cms_content = '' THEN
            RETURN 'Error: El nombre del contenido es obligatorio para eliminación.';
        END IF;

        -- VALIDACIÓN 2: Usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion = '' THEN
            RETURN 'Error: El usuario que realiza la operación es obligatorio para auditoría.';
        END IF;

        -- ELIMINACIÓN: Remover contenido CMS por nombre
        DELETE FROM tab_cms_content WHERE nom_cms_content = wnom_cms_content;
        
        -- VERIFICACIÓN: Confirmar que se eliminó el contenido
        IF FOUND THEN
            RAISE NOTICE 'Contenido CMS eliminado exitosamente por usuario %: %', wusr_operacion, wnom_cms_content;
            RETURN 'Contenido CMS eliminado correctamente';
        ELSE
            RETURN 'Error: Contenido no encontrado o ya fue eliminado';
        END IF;
    END;
$$
LANGUAGE plpgsql;