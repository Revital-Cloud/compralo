#!/usr/bin/env python3
"""
Aplica la función fun_agregar_producto_carrito (9 parámetros, con opciones_elegidas)
en la base de datos configurada en DATABASE_URL.

Uso (desde revital_ecommerce/backend, con venv activado):
  source venv/bin/activate   # o en Windows: venv\\Scripts\\activate
  python scripts/apply_fun_agregar_producto_carrito.py

Alternativa con psql (misma BD que usa el backend):
  psql -U USUARIO -d NOMBRE_BD -f ../db/Functions/tab_carrito_productos/fun_agregar_producto_carrito.sql

Requerido: migración add_cart_order_color_talla.sql ya ejecutada.
"""
import os
import sys

# Asegurar que app esté en el path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings


def main():
    db_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "db")
    sql_path = os.path.join(db_dir, "Functions", "tab_carrito_productos", "fun_agregar_producto_carrito.sql")
    if not os.path.isfile(sql_path):
        print(f"❌ No se encuentra: {sql_path}")
        sys.exit(1)
    sql = open(sql_path, "r", encoding="utf-8").read()
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text(sql))
        conn.commit()
    print("✅ fun_agregar_producto_carrito aplicada correctamente (9 parámetros, opciones_elegidas).")
    print("   Reinicia el backend y prueba agregar al carrito.")


if __name__ == "__main__":
    main()
