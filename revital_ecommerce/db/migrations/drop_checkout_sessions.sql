-- Elimina la tabla tab_checkout_sessions.
-- El flujo de checkout ya no la usa: la referencia codifica cart_id, id_direccion, id_canje
-- y la orden se crea solo cuando el webhook recibe pago APPROVED; el frontend obtiene order_id vía tab_pagos.

DROP TABLE IF EXISTS tab_checkout_sessions;
