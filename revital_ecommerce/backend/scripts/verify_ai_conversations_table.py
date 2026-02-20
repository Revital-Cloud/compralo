#!/usr/bin/env python3
"""Script para verificar que la tabla tab_ai_conversations existe y tiene la estructura correcta."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def verify_table():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        # Verificar que la tabla existe
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'tab_ai_conversations' 
            ORDER BY ordinal_position
        """))
        cols = result.fetchall()
        
        if not cols:
            print("❌ La tabla tab_ai_conversations no existe")
            return False
        
        print("✅ Tabla tab_ai_conversations existe")
        print("\n📋 Estructura de la tabla:")
        for col in cols:
            nullable = "NULL" if col[2] == "YES" else "NOT NULL"
            print(f"  - {col[0]}: {col[1]} ({nullable})")
        
        # Verificar índices
        result = conn.execute(text("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'tab_ai_conversations'
        """))
        indexes = result.fetchall()
        
        print("\n📊 Índices encontrados:")
        for idx in indexes:
            print(f"  - {idx[0]}")
        
        return True

if __name__ == "__main__":
    print("=" * 60)
    print("🔍 Verificando tabla tab_ai_conversations")
    print("=" * 60)
    print()
    
    if verify_table():
        print("\n✅ Verificación completada exitosamente")
    else:
        print("\n❌ La verificación falló")
        sys.exit(1)
