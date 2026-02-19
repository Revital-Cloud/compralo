#!/usr/bin/env python3
"""
Aplica la actualización de fun_get_all_products_admin para mostrar precio y stock
incluso cuando las variantes están inactivas (productos desactivados por IA).

Uso (desde revital_ecommerce/backend, con venv activado):
  python scripts/apply_fun_filter_admin_products_migration.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings


def apply_migration():
    db_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "db")
    sql_file = os.path.join(db_dir, "Functions", "tab_productos", "fun_filter_admin_products.sql")
    if not os.path.isfile(sql_file):
        print(f"❌ No se encontró: {sql_file}")
        return False
    print(f"📄 Leyendo: {sql_file}")
    with open(sql_file, "r", encoding="utf-8") as f:
        migration_sql = f.read()
    print("🔌 Conectando a la base de datos...")
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("⚙️  Ejecutando actualización de fun_get_all_products_admin...")
        conn.execute(text(migration_sql))
        conn.commit()
    print("✅ Migración aplicada correctamente.")
    return True


if __name__ == "__main__":
    try:
        success = apply_migration()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    if not success:
        sys.exit(1)
