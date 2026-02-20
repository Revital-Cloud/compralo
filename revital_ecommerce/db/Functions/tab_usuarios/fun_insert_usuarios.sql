/*
 * FUNCIÓN: fun_insert_usuarios
 * 
 * DESCRIPCIÓN: Inserta un nuevo usuario en el sistema con validaciones completas
 *              de todos los campos requeridos.
 * 
 * PARÁMETROS:
 *   - wid_usuario: Identificación única del usuario (cédula, pasaporte, etc.)
 *   - wnom_usuario: Nombre del usuario (mínimo 3 caracteres)
 *   - wape_usuario: Apellido del usuario (mínimo 3 caracteres)
 *   - wemail_usuario: Correo electrónico del usuario
 *   - wpassword_usuario: Contraseña del usuario (mínimo 3 caracteres)
 *   - wdes_direccion: Dirección de residencia (mínimo 3 caracteres)
 *   - wid_rol: ID del rol asignado al usuario
 *   - wind_genero: Indicador de género (boolean: true/false)
 *   - wcel_usuario: Número de celular (mínimo 3 caracteres)
 *   - wfec_nacimiento: Fecha de nacimiento (opcional, puede ser NULL)
 *   - wind_activo: Estado activo del usuario (opcional, default TRUE)
 * 
 * RETORNA: VARCHAR - Mensaje indicando éxito o error específico
 * 
 * VALIDACIONES:
 *   - Campos obligatorios: nombre, apellido, email, contraseña, género, celular
 *   - Campos de texto deben tener mínimo 3 caracteres
 *   - Género debe estar definido
 *   - Fecha de nacimiento es opcional
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2024
 */
CREATE OR REPLACE FUNCTION fun_insert_usuarios(
    wid_usuario tab_usuarios.id_usuario%TYPE,
    wnom_usuario tab_usuarios.nom_usuario%TYPE,
    wape_usuario tab_usuarios.ape_usuario%TYPE,
    wemail_usuario tab_usuarios.email_usuario%TYPE,
    wpassword_usuario tab_usuarios.password_usuario%TYPE,
    wind_genero tab_usuarios.ind_genero%TYPE,
    wcel_usuario tab_usuarios.cel_usuario%TYPE,
    wfec_nacimiento tab_usuarios.fec_nacimiento%TYPE,
    usr_insert tab_usuarios.usr_insert%TYPE
) RETURNS VARCHAR AS
$$
    BEGIN
        -- VALIDACIÓN 1: Nombre del usuario
        IF wnom_usuario IS NULL OR wnom_usuario = '' OR LENGTH(TRIM(wnom_usuario)) < 3 THEN
            RETURN 'Error: El nombre del usuario es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 2: Apellido del usuario
        IF wape_usuario IS NULL OR wape_usuario = '' OR LENGTH(TRIM(wape_usuario)) < 3 THEN
            RETURN 'Error: El apellido del usuario es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 3: Email del usuario
        IF wemail_usuario IS NULL OR wemail_usuario = '' OR LENGTH(TRIM(wemail_usuario)) < 3 THEN
            RETURN 'Error: El email del usuario es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 4: Contraseña del usuario
        IF wpassword_usuario IS NULL OR wpassword_usuario = '' OR LENGTH(TRIM(wpassword_usuario)) < 3 THEN
            RETURN 'Error: La contraseña es obligatoria y debe tener al menos 3 caracteres.';
        END IF;

        -- VALIDACIÓN 5: Indicador de género
        IF wind_genero IS NULL THEN
            RETURN 'Error: El indicador de género es obligatorio.';
        END IF;

        -- VALIDACIÓN 6: Número de celular
        IF wcel_usuario IS NULL OR wcel_usuario = '' OR LENGTH(TRIM(wcel_usuario)) < 3 THEN
            RETURN 'Error: El número de celular es obligatorio y debe tener al menos 3 caracteres.';
        END IF;

        -- fec_nacimiento es opcional (puede ser NULL)

        -- INSERCIÓN: Crear nuevo usuario en la base de datos
        INSERT INTO tab_usuarios (
            id_usuario,       -- Identificación única
            nom_usuario,      -- Nombre
            ape_usuario,      -- Apellido
            email_usuario,    -- Correo electrónico
            password_usuario, -- Contraseña
            ind_genero,       -- Género
            cel_usuario,      -- Celular
            fec_nacimiento,  -- Fecha de nacimiento
            usr_insert        -- Usuario que insertó    
        )
        VALUES (
            wid_usuario, wnom_usuario, wape_usuario, wemail_usuario, wpassword_usuario,
            wind_genero, wcel_usuario, wfec_nacimiento, usr_insert
        );
        
        -- VERIFICACIÓN: Confirmar que la inserción fue exitosa
        IF FOUND THEN
            RAISE NOTICE 'Usuario insertado exitosamente: %', wnom_usuario;
            RETURN 'Usuario insertado correctamente';
        ELSE
            RAISE NOTICE 'Error: No se pudo insertar el usuario';
            RETURN 'Error al insertar el usuario';
        END IF;
    END;
$$
LANGUAGE plpgsql;

