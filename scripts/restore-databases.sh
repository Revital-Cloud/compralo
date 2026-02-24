#!/usr/bin/env bash
# Restaura bases de datos PostgreSQL desde un directorio de backup.
# Crea las bases si no existen y aplica los dumps (formato custom -Fc).
# Requiere pg_restore y psql.
#
# Uso:
#   ./scripts/restore-databases.sh backups/2026-02-06_20-54-50
#   # O con URLs por env:
#   DATABASE_URL_ECOM='...' DATABASE_URL_PANEL='...' ./scripts/restore-databases.sh backups/2026-02-06_20-54-50

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 <directorio_backup>"
  echo "Ejemplo: $0 backups/2026-02-06_20-54-50"
  exit 1
fi

BACKUP_DIR="$1"
if [[ ! -d "$BACKUP_DIR" ]]; then
  echo "Error: directorio no encontrado: $BACKUP_DIR"
  exit 1
fi

# Extrae DATABASE_URL de un .env (misma lógica que backup-databases.sh)
get_db_url() {
  local env_file="$1"
  if [[ ! -f "$env_file" ]]; then
    echo "" && return
  fi
  grep -E '^DATABASE_URL=' "$env_file" | sed -E 's/^DATABASE_URL=//' | sed -E 's/^["'\'']//;s/["'\'']$//' | head -1
}

# Devuelve la URL de conexión a la base 'postgres' (para CREATE DATABASE)
# postgresql://user:pass@host:5432/revital_ecommerce -> postgresql://user:pass@host:5432/postgres
maintenance_url() {
  local url="$1"
  if [[ -z "$url" ]]; then
    echo "" && return
  fi
  echo "$url" | sed -E 's|/[^/]*$|/postgres|'
}

create_db_if_not_exists() {
  local db_name="$1"
  local maint_url="$2"
  if [[ -z "$maint_url" ]]; then
    return 1
  fi
  psql "$maint_url" -v ON_ERROR_STOP=1 -tc "SELECT 1 FROM pg_database WHERE datname = '$db_name'" | grep -q 1 || \
    psql "$maint_url" -v ON_ERROR_STOP=1 -c "CREATE DATABASE $db_name;"
}

restore_one() {
  local name="$1"
  local env_path="$2"
  local override_var="$3"
  local url
  case "$override_var" in
    DATABASE_URL_ECOM)  url="${DATABASE_URL_ECOM:-}";;
    DATABASE_URL_PANEL) url="${DATABASE_URL_PANEL:-}";;
    *) url="";;
  esac
  if [[ -z "$url" ]]; then
    url="$(get_db_url "$env_path")"
  fi
  if [[ -z "$url" ]]; then
    echo "[SKIP] $name: no .env o $override_var (ruta: $env_path)"
    return 0
  fi
  local dump_file="$BACKUP_DIR/${name}.dump"
  if [[ ! -f "$dump_file" ]]; then
    echo "[SKIP] $name: no existe $dump_file"
    return 0
  fi
  local maint_url
  maint_url="$(maintenance_url "$url")"
  local db_name="${url##*/}"
  db_name="${db_name%%\?*}"
  echo "[CREATE] $db_name (si no existe)"
  if ! create_db_if_not_exists "$db_name" "$maint_url"; then
    echo "[WARN] $name: no se pudo crear la base (¿psql disponible?). Intentando restaurar igual..."
  fi
  echo "[RESTORE] $name <- $dump_file"
  pg_restore -d "$url" -Fc --no-owner --no-acl "$dump_file" || true
  echo "[OK] $name"
}

echo "Restaurando desde: $BACKUP_DIR"
restore_one "revital_ecommerce" "revital_ecommerce/backend/.env" "DATABASE_URL_ECOM"
restore_one "revital_panel"     "revital_panel/backend/.env"    "DATABASE_URL_PANEL"
echo "Listo."
