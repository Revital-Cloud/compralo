#!/usr/bin/env bash
#
# Aplica los datos iniciales (seed) a la base de datos.
# Ejecutar después de apply_all.sh.
#
# Uso: ./apply_seed.sh
#      ./apply_seed.sh USER HOST DB [PORT]
# Con las mismas variables que apply_all.sh (PGUSER, PGHOST, PGDATABASE, PGPORT o DATABASE_URL).
#
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ $# -eq 0 && -z "$DATABASE_URL" && -f "$SCRIPT_DIR/../backend/.env" ]]; then
    set -a
    source "$SCRIPT_DIR/../backend/.env"
    set +a
fi

if [[ -n "$3" ]]; then
    export PGUSER="${1:-revital_admin}"
    export PGHOST="${2:-127.0.0.1}"
    export PGDATABASE="${3:-revital_ecommerce}"
    export PGPORT="${4:-5432}"
elif [[ -n "$DATABASE_URL" ]]; then
    if [[ "$DATABASE_URL" =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
        export PGUSER="${BASH_REMATCH[1]}"
        export PGPASSWORD="${BASH_REMATCH[2]}"
        export PGHOST="${BASH_REMATCH[3]}"
        export PGPORT="${BASH_REMATCH[4]}"
        export PGDATABASE="${BASH_REMATCH[5]}"
    fi
fi
PGUSER="${PGUSER:-revital_admin}"
PGHOST="${PGHOST:-127.0.0.1}"
PGDATABASE="${PGDATABASE:-revital_ecommerce}"
PGPORT="${PGPORT:-5432}"

echo "=============================================="
echo "Revital e-commerce – Aplicar seed (datos iniciales)"
echo "=============================================="
echo "Host: $PGHOST:$PGPORT | DB: $PGDATABASE | User: $PGUSER"
echo ""

psql -v ON_ERROR_STOP=1 -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$SCRIPT_DIR/seed_data.sql"

echo "Seed aplicado correctamente."
