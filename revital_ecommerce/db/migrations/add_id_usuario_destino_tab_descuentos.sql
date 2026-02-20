-- Cupón personal: solo el usuario destinatario puede usar el código.
-- Si id_usuario_destino IS NOT NULL, fun_validar_descuento_aplicable exige p_id_usuario = id_usuario_destino.

ALTER TABLE tab_descuentos
ADD COLUMN IF NOT EXISTS id_usuario_destino DECIMAL(10) NULL
REFERENCES tab_usuarios(id_usuario) ON DELETE SET NULL;

COMMENT ON COLUMN tab_descuentos.id_usuario_destino IS 'Si no es NULL, solo este usuario puede usar el código de cupón.';
