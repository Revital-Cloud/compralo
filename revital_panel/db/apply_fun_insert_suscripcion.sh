#!/bin/bash
# Aplicar fix de fun_insert_suscripcion (GROUP BY precio_mensual).
# Ejecutar DENTRO del servidor de la BD (SSH a 46.224.101.179) como usuario con acceso a synkro_admin.
#
# Uso desde el servidor:
#   cd /ruta/a/synkro_panel/db
#   ./apply_fun_insert_suscripcion.sh
#
# O con psql directo (desde el servidor):
#   psql -U synkro_admin -d synkro_saas -h localhost -f Functions/tab_suscripciones/fun_insert_suscripcion.sql

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

export PGPASSWORD="${PGPASSWORD:-synkro_admin_pwd}"
psql -U synkro_admin -d synkro_saas -h localhost -f Functions/tab_suscripciones/fun_insert_suscripcion.sql
echo "OK: fun_insert_suscripcion actualizada."
