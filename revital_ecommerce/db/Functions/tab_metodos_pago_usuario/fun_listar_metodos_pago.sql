/*
 * FUNCIÓN: fun_listar_metodos_pago
 * 
 * DESCRIPCIÓN: Lista todos los métodos de pago guardados por un usuario.
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario (obligatorio)
 * 
 * RETORNA: TABLE - Una tabla con los detalles de los métodos de pago.
 * 
 * LÓGICA:
 *   1. Busca todos los métodos de pago asociados al ID del usuario.
 *   2. Ordena los resultados para mostrar el método por defecto primero.
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_listar_metodos_pago(
    p_id_usuario tab_usuarios.id_usuario%TYPE
) RETURNS TABLE (
    id_metodo_pago INT,
    provider_name VARCHAR(50),
    brand VARCHAR(50),
    last_four_digits VARCHAR(4),
    expiration_month INT,
    expiration_year INT,
    is_default BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mpu.id_metodo_pago,
        mpu.provider_name,
        mpu.brand,
        mpu.last_four_digits,
        mpu.expiration_month,
        mpu.expiration_year,
        mpu.is_default
    FROM
        tab_metodos_pago_usuario mpu
    WHERE
        mpu.id_usuario = p_id_usuario
    ORDER BY
        mpu.is_default DESC, mpu.fec_insert DESC;
END;
$$ LANGUAGE plpgsql; 