#!/usr/bin/env python3
"""
Script para aplicar la migración de la tabla tab_ai_conversations.

Ejecuta el script SQL de migración para crear la tabla de historial de conversaciones AI.

Uso (desde revital_ecommerce/backend, con venv activado):
  source venv/bin/activate   # o en Windows: venv\\Scripts\\activate
  python scripts/apply_ai_conversations_migration.py
"""
import sys
import os
from pathlib import Path

# Asegurar que app esté en el path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings


def apply_migration():
    """Aplica la migración de la tabla tab_ai_conversations."""
    # Obtener ruta del archivo SQL
    db_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "db")
    migration_file = os.path.join(db_dir, "migrations", "add_ai_conversations_table.sql")
    
    if not os.path.isfile(migration_file):
        print(f"❌ Error: No se encontró el archivo de migración en {migration_file}")
        return False
    
    print(f"📄 Leyendo migración desde: {migration_file}")
    
    try:
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        print("🔌 Conectando a la base de datos...")
        db_name = settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'N/A'
        print(f"   Base de datos: {db_name}")
        
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            # Ejecutar la migración
            print("⚙️  Ejecutando migración...")
            conn.execute(text(migration_sql))
            conn.commit()
        
        print("✅ Migración aplicada exitosamente!")
        print("\n📊 Tabla creada: tab_ai_conversations")
        print("   - Historial de conversaciones AI")
        print("   - Índices para búsquedas eficientes")
        print("   - Soporte para aprendizaje incremental")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al aplicar la migración: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Aplicando migración: tab_ai_conversations")
    print("=" * 60)
    print()
    
    success = apply_migration()
    
    print()
    print("=" * 60)
    if success:
        print("✅ Migración completada exitosamente")
    else:
        print("❌ La migración falló. Revisa los errores arriba.")
        sys.exit(1)
    print("=" * 60)
