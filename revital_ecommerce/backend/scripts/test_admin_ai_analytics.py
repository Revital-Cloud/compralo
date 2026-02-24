#!/usr/bin/env python3
"""
Script para probar las nuevas tools de analytics del asistente admin.
Ejecutar desde revital_ecommerce/backend con: python scripts/test_admin_ai_analytics.py
Requiere: DB configurada.
"""
import os
import sys

# Añadir app al path para imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app_dir = os.path.join(backend_dir, "app")
sys.path.insert(0, app_dir)
os.chdir(app_dir)

from sqlalchemy.orm import Session
from core.database import SessionLocal
from services.admin_ai_actions import execute_action


def test_analytics_tools():
    db: Session = SessionLocal()
    try:
        user_id = 1  # Asumir admin con ID 1
        print("=== Probando tools de analytics ===\n")

        # 1. Top categorías por ingresos
        print("1. get_top_categories_by_revenue:")
        result = execute_action(db, "get_top_categories_by_revenue", {"limit": 5}, user_id)
        print(result[:500] if len(result) > 500 else result)
        print()

        # 2. Métricas de conversión
        print("2. get_conversion_metrics:")
        result = execute_action(db, "get_conversion_metrics", {}, user_id)
        print(result[:500] if len(result) > 500 else result)
        print()

        # 3. Ventas geográficas
        print("3. get_geographic_sales:")
        result = execute_action(db, "get_geographic_sales", {"limit": 5}, user_id)
        print(result[:500] if len(result) > 500 else result)
        print()

        # 4. Tráfico por hora
        print("4. get_hourly_traffic:")
        result = execute_action(db, "get_hourly_traffic", {}, user_id)
        print(result[:500] if len(result) > 500 else result)
        print()

        # 5. Demografía
        print("5. get_customer_demographics:")
        result = execute_action(db, "get_customer_demographics", {}, user_id)
        print(result[:500] if len(result) > 500 else result)
        print()

        print("=== Todas las tools de analytics funcionan correctamente ===")
    except Exception as e:
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    test_analytics_tools()
