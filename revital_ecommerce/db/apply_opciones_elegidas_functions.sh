#!/bin/sh
# Aplica las funciones necesarias para que las opciones elegidas (color, talla, etc.)
# se guarden en el carrito y se copien a la orden.
# Ejecutar con un usuario con permisos de propietario (ej. revital_admin o postgres).
#
# Uso: ./apply_opciones_elegidas_functions.sh [USUARIO] [BASE_DE_DATOS]
# Ejemplo: ./apply_opciones_elegidas_functions.sh revital_admin revital_ecommerce

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
USER="${1:-revital_admin}"
DB="${2:-revital_ecommerce}"

echo "Aplicando funciones (usuario=$USER, bd=$DB)..."
psql -U "$USER" -h 127.0.0.1 -d "$DB" -f "$SCRIPT_DIR/Functions/tab_carrito_productos/fun_agregar_producto_carrito.sql"
psql -U "$USER" -h 127.0.0.1 -d "$DB" -f "$SCRIPT_DIR/Functions/tab_ordenes/fun_crear_orden_desde_carrito.sql"
echo "Listo. Las nuevas órdenes incluirán las opciones elegidas (color, talla, etc.)."
