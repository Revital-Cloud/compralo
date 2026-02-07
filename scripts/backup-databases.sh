#!/usr/bin/env bash
# Backup de bases de datos PostgreSQL: revital_ecommerce y revital_panel.
# Usa DATABASE_URL del .env de cada backend, o variables de entorno opcionales.
# Requiere pg_dump instalado.
#
# Uso:
#   ./scripts/backup-databases.sh
#   # O pasar URLs por env (si no tienes .env):
#   DATABASE_URL_ECOM='postgresql://...' DATABASE_URL_PANEL='postgresql://...' ./scripts/backup-databases.sh
#
# Los dumps se guardan en backups/YYYY-MM-DD_HH-MM-SS/

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Directorio de backups con timestamp
BACKUP_DIR="backups/$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$BACKUP_DIR"

# Extrae DATABASE_URL de un .env (soporta KEY=value y KEY="value")
get_db_url() {
  local env_file="$1"
  if [[ ! -f "$env_file" ]]; then
    echo "" && return
  fi
  grep -E '^DATABASE_URL=' "$env_file" | sed -E 's/^DATABASE_URL=//' | sed -E 's/^["'\'']//;s/["'\'']$//' | head -1
}

backup_one() {
  local name="$1"
  local env_path="$2"
  local override_var="$3"   # ej. DATABASE_URL_ECOM o DATABASE_URL_PANEL
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
    echo "[SKIP] $name: no .env or $override_var (ruta: $env_path)"
    return 0
  fi
  local out="$BACKUP_DIR/${name}.dump"
  echo "[BACKUP] $name -> $out"
  pg_dump "$url" -Fc -f "$out"
  echo "[OK] $name"
}

echo "Backups en: $BACKUP_DIR"
backup_one "revital_ecommerce" "revital_ecommerce/backend/.env" "DATABASE_URL_ECOM"
backup_one "revital_panel"     "revital_panel/backend/.env"    "DATABASE_URL_PANEL"
echo "Listo. Archivos:"
ls -la "$BACKUP_DIR"
