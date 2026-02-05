-- Fix: column reference "num_factura" is ambiguous in fn_generar_num_factura
-- Run: psql -U <user> -d <database> -f fix_fn_generar_num_factura.sql

CREATE OR REPLACE FUNCTION fn_generar_num_factura()
RETURNS VARCHAR AS $$
DECLARE
    prefijo VARCHAR := 'FAC-';
    anio VARCHAR := TO_CHAR(CURRENT_DATE, 'YYYY');
    mes VARCHAR := TO_CHAR(CURRENT_DATE, 'MM');
    num_secuencia INTEGER;
    num_factura VARCHAR;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(fc.num_factura FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO num_secuencia
    FROM tab_facturacion_cabecera fc
    WHERE fc.num_factura LIKE prefijo || anio || '-' || mes || '-%';

    num_factura := prefijo || anio || '-' || mes || '-' || LPAD(num_secuencia::TEXT, 5, '0');
    RETURN num_factura;
END;
$$ LANGUAGE plpgsql;
