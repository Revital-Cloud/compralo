#!/usr/bin/env python3
"""
Aplica la versión actualizada de fun_insert_usuarios (y fun_update_usuarios)
donde la fecha de nacimiento es OPCIONAL.

Uso (desde revital_ecommerce/backend, con venv activado):
  source venv/bin/activate
  python scripts/apply_fun_insert_usuarios_optional_fec_nacimiento.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

# Ruta a db/Functions/tab_usuarios (desde backend/)
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_db_dir = os.path.join(os.path.dirname(_backend_dir), "db")
_functions_dir = os.path.join(_db_dir, "Functions", "tab_usuarios")


def apply():
    engine = create_engine(settings.DATABASE_URL)
    for name in ("fun_insert_usuarios.sql", "fun_update_usuarios.sql"):
        path = os.path.join(_functions_dir, name)
        if not os.path.isfile(path):
            print(f"⚠️  No encontrado: {path}")
            continue
        with open(path, "r", encoding="utf-8") as f:
            sql = f.read()
        with engine.begin() as conn:
            conn.execute(text(sql))
        print(f"✅ Aplicado: {name}")
    print("Listo. La fecha de nacimiento es opcional en registro y actualización.")


if __name__ == "__main__":
    apply()
