#!/usr/bin/env bash
#
# Script para crear toda la base de datos Revital e-commerce desde cero (idempotente).
# Aplica en orden: 1) schema (db_revital.sql: DROP + CREATE tablas), 2) funciones,
# 3) triggers, 4) vistas, 5) opcional KPIs.
# Ejecutar desde la raíz del repo o desde revital_ecommerce/db.
#
# Uso:
#   ./apply_all.sh
#   ./apply_all.sh USER HOST DB
#   ./apply_all.sh USER HOST DB PORT
#
# Si no se pasan argumentos, intenta usar variables de entorno (ej. desde backend/.env):
#   PGHOST, PGPORT, PGUSER, PGDATABASE
#   o DATABASE_URL (postgresql://user:pass@host:port/dbname)
#
# IMPORTANTE: Para aplicar o actualizar funciones, PGUSER debe ser el dueño de la base
# (p. ej. postgres o revital_admin). Si usas el usuario de la app (revital_ecommerce_user)
# y las funciones ya existen creadas por otro usuario, fallará "must be owner of function".
# Ejemplo: ./apply_all.sh postgres 46.225.94.64 revital_ecommerce 5432
#
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# --- Cargar .env del backend si existe y no hay argumentos ---
if [[ $# -eq 0 && -z "$DATABASE_URL" && -f "$SCRIPT_DIR/../backend/.env" ]]; then
    set -a
    source "$SCRIPT_DIR/../backend/.env"
    set +a
fi

# --- Conexión a la base de datos ---
if [[ -n "$3" ]]; then
    export PGUSER="${1:-revital_admin}"
    export PGHOST="${2:-127.0.0.1}"
    export PGDATABASE="${3:-revital_ecommerce}"
    export PGPORT="${4:-5432}"
elif [[ -n "$DATABASE_URL" ]]; then
    # Parsear DATABASE_URL (postgresql://user:pass@host:port/dbname)
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
echo "Revital e-commerce – Aplicar schema y objetos"
echo "=============================================="
echo "Host: $PGHOST:$PGPORT | DB: $PGDATABASE | User: $PGUSER"
echo ""

run_psql() {
    psql -v ON_ERROR_STOP=1 -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$1"
}

# --- 1. Schema (tablas) ---
echo "[1/5] Aplicando schema (db_revital.sql)..."
run_psql "$SCRIPT_DIR/db_revital.sql"
echo ""

# --- 1.5. Migraciones idempotentes (ADD COLUMN IF NOT EXISTS, etc.) ---
# Útil si la DB existía con un schema anterior sin estas columnas.
if [[ -f "$SCRIPT_DIR/migrations/add_opciones_elegidas_orden_productos.sql" ]]; then
    echo "[1.5/5] Aplicando migración opciones_elegidas (carrito/orden)..."
    run_psql "$SCRIPT_DIR/migrations/add_opciones_elegidas_orden_productos.sql" || true
    echo ""
fi
if [[ -f "$SCRIPT_DIR/migrations/add_id_proveedor_tab_products.sql" ]]; then
    echo "[1.5/5] Aplicando migración id_proveedor en tab_products..."
    run_psql "$SCRIPT_DIR/migrations/add_id_proveedor_tab_products.sql" || true
    echo ""
fi

# --- 2. Funciones (orden por dependencias) ---
# Debe ejecutarse con el usuario dueño de la DB (postgres/revital_admin) para poder crear/reemplazar funciones.
echo "[2/5] Aplicando funciones..."

# 2.1 Utilidades (slug, sku) – deben ir primero
for f in "$SCRIPT_DIR/Functions/utils"/fun_*.sql; do
    [[ -f "$f" ]] || continue
    echo "  - $(basename "$f")"
    run_psql "$f"
done

# 2.2 Categorías (dependen de utils)
for f in "$SCRIPT_DIR/Functions/tab_categorias"/fun_*.sql; do
    [[ -f "$f" ]] || continue
    echo "  - tab_categorias/$(basename "$f")"
    run_psql "$f"
done

# 2.3 Productos (dependen de utils y categories)
for f in "$SCRIPT_DIR/Functions/tab_productos"/fun_*.sql; do
    [[ -f "$f" ]] || continue
    echo "  - tab_productos/$(basename "$f")"
    run_psql "$f"
done
# Índices para filtros si existen
if [[ -f "$SCRIPT_DIR/Functions/tab_productos/indexes_filter_products.sql" ]]; then
    echo "  - tab_productos/indexes_filter_products.sql"
    run_psql "$SCRIPT_DIR/Functions/tab_productos/indexes_filter_products.sql" || true
fi

# 2.4 Resto de funciones por directorio (orden alfabético)
# Se omiten: tab_categorias y tab_productos (ya aplicados arriba), tab_lineas/tab_sublineas
# (tablas obsoletas, reemplazadas por tab_categories), tab_kpis_dashboards (opcional al final).
for dir in "$SCRIPT_DIR/Functions"/tab_*; do
    [[ -d "$dir" ]] || continue
    case "$(basename "$dir")" in
        tab_categorias|tab_productos|tab_lineas|tab_sublineas|tab_kpis_dashboards) continue ;;
        *) ;;
    esac
    for f in "$dir"/*.sql; do
        [[ -f "$f" ]] || continue
        base="$(basename "$f")"
        [[ "$base" == EJEMPLOS* ]] && continue
        [[ "$base" == *unificada*.sql ]] && continue
        echo "  - $(basename "$dir")/$base"
        run_psql "$f"
    done
done
echo ""

# --- 3. Triggers de auditoría y de negocio ---
echo "[3/5] Aplicando triggers..."

echo "  - audit.sql"
run_psql "$SCRIPT_DIR/triggers/audit.sql"

echo "  - trg_actualizar_estadisticas_ventas.sql"
run_psql "$SCRIPT_DIR/triggers/trg_actualizar_estadisticas_ventas.sql"

echo "  - trg_actualizar_stock_compra_proveedor.sql"
run_psql "$SCRIPT_DIR/triggers/trg_actualizar_stock_compra_proveedor.sql"

echo "  - trg_acumular_puntos_orden.sql"
run_psql "$SCRIPT_DIR/triggers/trg_acumular_puntos_orden.sql"

echo "  - trg_automatizar_pagos_descuentos.sql"
run_psql "$SCRIPT_DIR/triggers/trg_automatizar_pagos_descuentos.sql"

echo "  - trg_actualizar_stock_orden_pagada.sql"
run_psql "$SCRIPT_DIR/triggers/trg_actualizar_stock_orden_pagada.sql"

echo "  - triggers.sql (definición de triggers en tablas)"
run_psql "$SCRIPT_DIR/triggers/triggers.sql"
echo ""

# --- 4. Vistas ---
echo "[4/5] Aplicando vistas..."
for f in "$SCRIPT_DIR/views"/*.sql; do
    [[ -f "$f" ]] || continue
    echo "  - $(basename "$f")"
    run_psql "$f"
done
echo ""

# --- 5. Opcional: KPIs / datos iniciales (no falla el script si faltan tablas) ---
echo "[5/5] Objetos opcionales (KPIs, etc.)..."
for f in "$SCRIPT_DIR/Functions/tab_kpis_dashboards"/*.sql; do
    [[ -f "$f" ]] || continue
    echo "  - tab_kpis_dashboards/$(basename "$f")"
    run_psql "$f" || true
done
echo ""

echo "=============================================="
echo "Proceso terminado."
echo "=============================================="
