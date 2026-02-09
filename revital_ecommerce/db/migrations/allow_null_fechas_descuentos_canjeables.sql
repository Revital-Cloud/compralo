/*
 * Migración: Permitir fec_inicio y fec_fin NULL en tab_descuentos
 *
 * Permite crear descuentos "plantilla" canjeables por puntos sin fechas,
 * para que estén disponibles para canje hasta que el usuario los canjee
 * (la vigencia del derecho de uso es la del canje, 30 días).
 *
 * Ejecutar sobre una base ya creada con db_revital.sql.
 */

-- Permitir NULL en fechas
ALTER TABLE tab_descuentos
    ALTER COLUMN fec_inicio DROP NOT NULL,
    ALTER COLUMN fec_fin DROP NOT NULL;

-- Reemplazar CHECK: vigencia cuando ambas null o ambas no null y fec_fin >= fec_inicio
ALTER TABLE tab_descuentos
    DROP CONSTRAINT IF EXISTS chk_fechas_validez_descuento;

ALTER TABLE tab_descuentos
    ADD CONSTRAINT chk_fechas_validez_descuento CHECK (
        (fec_inicio IS NULL AND fec_fin IS NULL)
        OR (fec_inicio IS NOT NULL AND fec_fin IS NOT NULL AND fec_fin >= fec_inicio)
    );
