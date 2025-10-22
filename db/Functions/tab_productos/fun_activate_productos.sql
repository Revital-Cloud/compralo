-- Función: fun_set_producto_activo
-- Actualiza únicamente el campo ind_activo de un producto identificado por su clave compuesta.
-- Retorna un mensaje de resultado.

CREATE OR REPLACE FUNCTION fun_set_producto_activo(
  p_id_categoria NUMERIC,
  p_id_linea     NUMERIC,
  p_id_sublinea  NUMERIC,
  p_id_producto  NUMERIC,
  p_active       BOOLEAN,
  p_usr_update   NUMERIC
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated_id NUMERIC;
BEGIN
  UPDATE tab_productos
  SET ind_activo = p_active,
      usr_update = p_usr_update,
      fec_update = NOW()
  WHERE id_categoria = p_id_categoria
    AND id_linea     = p_id_linea
    AND id_sublinea  = p_id_sublinea
    AND id_producto  = p_id_producto
  RETURNING id_producto INTO v_updated_id;

  IF v_updated_id IS NULL THEN
    RETURN 'Error: producto no encontrado';
  END IF;

  IF p_active THEN
    RETURN 'Producto activado exitosamente';
  ELSE
    RETURN 'Producto desactivado exitosamente';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error al actualizar estado del producto: ' || SQLERRM;
END;
$$;