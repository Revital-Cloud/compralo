/*
 * FUNCIÓN: fun_update_usuarios
 * 
 * DESCRIPCIÓN: Actualiza la información de un usuario existente en el sistema
 *              con validaciones completas de todos los campos modificables.
 * 
 * PARÁMETROS:
 *   - wid_usuario: ID del usuario a actualizar (obligatorio, > 0)
 *   - wnom_usuario: Nuevo nombre del usuario (obligatorio, mínimo 3 caracteres)
 *   - wape_usuario: Nuevo apellido del usuario (obligatorio, mínimo 3 caracteres)
 *   - wemail_usuario: Nuevo email del usuario (obligatorio, mínimo 3 caracteres)
 *   - wpassword_usuario: Nueva contraseña (obligatorio, no vacío)
 *   - wdes_direccion: Nueva dirección (obligatorio, mínimo 3 caracteres)
 *   - wind_genero: Nuevo indicador de género (obligatorio)
 *   - wcel_usuario: Nuevo número de celular (obligatorio, mínimo 3 caracteres)
 *   - wfec_nacimiento: Nueva fecha de nacimiento (opcional, puede ser NULL)
 *   - wind_activo: Nuevo estado activo (opcional, mantiene actual si es NULL)
 *   - wusr_operacion: ID del usuario que realiza la operación (obligatorio, > 0)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * LÓGICA:
 *   1. Validar existencia del usuario por ID
 *   2. Validar todos los campos obligatorios
 *   3. Actualizar registro con nueva información
 *   4. Actualizar timestamp de modificación
 *   5. Confirmar éxito de la operación
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_update_usuarios(
    wid_usuario tab_usuarios.id_usuario%TYPE,
    wnom_usuario tab_usuarios.nom_usuario%TYPE,
    wape_usuario tab_usuarios.ape_usuario%TYPE,
    wemail_usuario tab_usuarios.email_usuario%TYPE,
    wpassword_usuario tab_usuarios.password_usuario%TYPE,
    wind_genero tab_usuarios.ind_genero%TYPE,
    wcel_usuario tab_usuarios.cel_usuario%TYPE,
    wfec_nacimiento tab_usuarios.fec_nacimiento%TYPE,
    wusr_operacion tab_usuarios.usr_update%TYPE
) RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: ID del usuario a actualizar
        IF wid_usuario IS NULL OR wid_usuario = 0 THEN
            RETURN 'Error: El ID del usuario es obligatorio y debe ser mayor a 0.';
        END IF;

        -- VALIDACIÓN 2: Nombre del usuario
        IF wnom_usuario IS NULL OR wnom_usuario = '' OR LENGTH(TRIM(wnom_usuario)) < 3 THEN
            RETURN 'Error: El nombre del usuario es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 3: Apellido del usuario
        IF wape_usuario IS NULL OR wape_usuario = '' OR LENGTH(TRIM(wape_usuario)) < 3 THEN
            RETURN 'Error: El apellido del usuario es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 4: Email del usuario
        IF wemail_usuario IS NULL OR wemail_usuario = '' OR LENGTH(TRIM(wemail_usuario)) < 3 THEN
            RETURN 'Error: El email del usuario es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 5: Contraseña del usuario
        IF wpassword_usuario IS NULL OR wpassword_usuario = '' THEN
            RETURN 'Error: La contraseña es obligatoria y no puede estar vacía.';
        END IF;

        -- VALIDACIÓN 8: Indicador de género
        IF wind_genero IS NULL THEN
            RETURN 'Error: El indicador de género es obligatorio.';
        END IF;

        -- VALIDACIÓN 9: Número de celular
        IF wcel_usuario IS NULL OR wcel_usuario = '' OR LENGTH(TRIM(wcel_usuario)) < 3 THEN
            RETURN 'Error: El número de celular es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- wfec_nacimiento es opcional (puede ser NULL)

        -- VALIDACIÓN 10: ID de usuario operación para auditoría
        IF wusr_operacion IS NULL OR wusr_operacion <= 0 THEN
            RETURN 'Error: El ID del usuario que realiza la operación es obligatorio y debe ser mayor a 0.';
        END IF;

        -- ACTUALIZACIÓN: Modificar información del usuario existente
        UPDATE tab_usuarios SET 
            nom_usuario = wnom_usuario,                                     -- Nuevo nombre
            ape_usuario = wape_usuario,                                     -- Nuevo apellido
            email_usuario = wemail_usuario,                                 -- Nuevo email
            password_usuario = wpassword_usuario,                           -- Nueva contraseña
            ind_genero = wind_genero,                                       -- Nuevo género
            cel_usuario = wcel_usuario,                                     -- Nuevo celular
            fec_nacimiento = wfec_nacimiento,                               -- Nueva fecha nacimiento
            usr_update = wusr_operacion,                                    -- ID del usuario que actualiza
            fec_update = NOW()                                              -- Timestamp de actualización
        WHERE id_usuario = wid_usuario;

        -- VERIFICACIÓN: Confirmar que la actualización fue exitosa
        IF FOUND THEN
            RAISE NOTICE 'Usuario actualizado exitosamente: % por usuario ID: %', wnom_usuario, wusr_operacion;
            RETURN 'Usuario actualizado correctamente';
        ELSE
            RAISE NOTICE 'Error: No se encontró el usuario o no se pudo actualizar';
            RETURN 'Error al actualizar el usuario o usuario no encontrado';
        END IF;
    END;
$$
LANGUAGE plpgsql;
