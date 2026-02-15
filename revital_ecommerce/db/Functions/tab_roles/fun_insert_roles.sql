/*
 * FUNCIÓN: fun_insert_roles
 * 
 * DESCRIPCIÓN: Inserta un nuevo rol en el sistema con ID generado automáticamente.
 *              Los roles definen niveles de acceso y permisos para usuarios.
 * 
 * PARÁMETROS:
 *   - wnom_rol: Nombre del rol (obligatorio, mínimo 3 caracteres)
 *   - wdes_rol: Descripción del rol (opcional)
 *   - wusr_operacion: ID del usuario que realiza la operación (obligatorio, DECIMAL)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar nombre del rol
 *   2. Validar ID de usuario operación para auditoría
 *   3. Generar ID secuencial automático
 *   4. Insertar nuevo rol
 *   5. Confirmar éxito de la inserción
 * 
 * MANEJO DE ERRORES:
 *   - Captura violaciones de integridad referencial
 *   - Realiza ROLLBACK en caso de error
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_insert_roles(
    wnom_rol tab_roles.nom_rol%TYPE,
    wdes_rol tab_roles.des_rol%TYPE,
    wusr_operacion tab_roles.usr_insert%TYPE  -- Ahora es DECIMAL(10)
) RETURNS VARCHAR AS
$$
BEGIN
    -- VALIDACIÓN 1: Nombre del rol
    IF wnom_rol IS NULL OR wnom_rol = '' OR LENGTH(TRIM(wnom_rol)) < 3 THEN
        RETURN 'Error: El nombre del rol es obligatorio y debe tener al menos 3 caracteres.';
    END IF;

    -- VALIDACIÓN 2: ID de usuario operación para auditoría
    IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
        RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
    END IF;

    -- INSERCIÓN: Crear nuevo rol con ID automático
    INSERT INTO tab_roles (id_rol, nom_rol, des_rol, usr_insert)
    VALUES (
        (SELECT COALESCE(MAX(id_rol), 0) + 1 FROM tab_roles),  -- ID generado automáticamente
        wnom_rol,                                               -- Nombre del rol
        wdes_rol,                                               -- Descripción del rol
        wusr_operacion                                          -- ID del usuario que realiza la inserción
    );

    -- VERIFICACIÓN: Confirmar éxito de la inserción
    IF FOUND THEN
        RAISE NOTICE 'Rol insertado exitosamente: % por usuario ID: %', wnom_rol, wusr_operacion;
        RETURN 'Rol insertado correctamente';
    ELSE
        RAISE NOTICE 'Error: No se pudo insertar el rol';
        RETURN 'Error al insertar el rol';
    END IF;

-- MANEJO DE ERRORES: Capturar excepciones específicas
EXCEPTION
    WHEN SQLSTATE '23503' THEN
        RETURN 'Error: Violación de integridad referencial.';
    WHEN OTHERS THEN
        RETURN 'Error inesperado: ' || SQLERRM;
        ROLLBACK;
END;
$$
LANGUAGE plpgsql;
