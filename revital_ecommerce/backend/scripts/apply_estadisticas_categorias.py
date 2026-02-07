#!/usr/bin/env python3
"""
Verifica y aplica las funciones y triggers de estadísticas (tab_estadisticas_categorias
y tab_estadisticas_productos) en la base de datos.

Orden de aplicación:
  1. fun_actualizar_resumen_ventas.sql  (estadísticas por producto)
  2. fun_actualizar_resumen_categoria.sql (estadísticas por categoría + fun_sincronizar_estadisticas_completas)
  3. trg_actualizar_estadisticas_ventas.sql (funciones trigger + fun_recalcular_estadisticas_batch)
  4. Los triggers en tab_ordenes/tab_orden_productos suelen estar en db/triggers/triggers.sql

Uso (desde revital_ecommerce/backend, con venv activado):
  python scripts/apply_estadisticas_categorias.py           # solo verificar
  python scripts/apply_estadisticas_categorias.py --apply   # aplicar SQL (requiere ser owner de las funciones en la BD)
  python scripts/apply_estadisticas_categorias.py --apply --recalcular  # aplicar y ejecutar recálculo batch

Si el usuario de la BD no es owner de las funciones, aplicar los SQL como superuser/owner, por ejemplo:
  psql -U postgres -d TU_BD -f db/Functions/tab_estadisticas_productos/fun_actualizar_resumen_ventas.sql
  psql -U postgres -d TU_BD -f db/Functions/tab_estadisticas_categorias/fun_actualizar_resumen_categoria.sql
  psql -U postgres -d TU_BD -f db/triggers/trg_actualizar_estadisticas_ventas.sql
Luego ejecutar en la BD: SELECT fun_recalcular_estadisticas_batch(TRUE, FALSE);
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings


DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "db")
FUNCTIONS_DIR = os.path.join(DB_DIR, "Functions")
TRIGGERS_DIR = os.path.join(DB_DIR, "triggers")

# Orden exacto de archivos SQL a aplicar
SQL_FILES = [
    os.path.join(FUNCTIONS_DIR, "tab_estadisticas_productos", "fun_actualizar_resumen_ventas.sql"),
    os.path.join(FUNCTIONS_DIR, "tab_estadisticas_categorias", "fun_actualizar_resumen_categoria.sql"),
    os.path.join(TRIGGERS_DIR, "trg_actualizar_estadisticas_ventas.sql"),
]


def check_exists(conn, object_type: str, name: str) -> bool:
    """Comprueba si existe una función o trigger en la BD."""
    if object_type == "function":
        r = conn.execute(text("""
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = :name
        """), {"name": name})
        return r.scalar() is not None
    if object_type == "trigger":
        r = conn.execute(text("""
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public' AND c.relname = :table_name AND t.tgname = :name
        """), {"table_name": "tab_ordenes", "name": name})
        return r.scalar() is not None
    return False


def main():
    parser = argparse.ArgumentParser(description="Verificar/aplicar funciones y triggers de estadísticas")
    parser.add_argument("--apply", action="store_true", help="Aplicar archivos SQL que falten")
    parser.add_argument("--recalcular", action="store_true", help="Tras aplicar, ejecutar fun_recalcular_estadisticas_batch()")
    args = parser.parse_args()

    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        # Verificar funciones clave
        funciones = [
            "fun_actualizar_resumen_ventas",
            "fun_actualizar_resumen_categoria",
            "fun_sincronizar_estadisticas_completas",
            "fun_trigger_actualizar_estadisticas_orden",
            "fun_recalcular_estadisticas_batch",
        ]
        print("Verificando funciones en la BD:")
        for f in funciones:
            exists = check_exists(conn, "function", f)
            print(f"  {f}: {'OK' if exists else 'FALTA'}")
        trigger_orden_pagada = check_exists(conn, "trigger", "trg_actualizar_estadisticas_orden_pagada")
        print(f"  Trigger trg_actualizar_estadisticas_orden_pagada (tab_ordenes): {'OK' if trigger_orden_pagada else 'FALTA'}")

        if args.apply:
            for path in SQL_FILES:
                if not os.path.isfile(path):
                    print(f"  Archivo no encontrado: {path}")
                    continue
                print(f"  Aplicando: {os.path.basename(path)}")
                sql = open(path, "r", encoding="utf-8").read()
                try:
                    conn.execute(text(sql))
                    conn.commit()
                    print(f"    OK")
                except Exception as e:
                    conn.rollback()
                    print(f"    ERROR: {e}")
                    sys.exit(1)

        if args.recalcular:
            print("Ejecutando fun_recalcular_estadisticas_batch()...")
            try:
                r = conn.execute(text("SELECT fun_recalcular_estadisticas_batch(TRUE, FALSE)"))
                row = r.fetchone()
                conn.commit()
                print("  Resultado:", row[0] if row else "N/A")
            except Exception as e:
                conn.rollback()
                print(f"  ERROR: {e}")
                sys.exit(1)

    print("Listo.")


if __name__ == "__main__":
    main()
